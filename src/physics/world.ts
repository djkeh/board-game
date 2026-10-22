import Matter from 'matter-js'
import { HEX, hexToPixel, isNeighbor } from '../game/hexgrid'
import { random } from '../game/rng'
import type { Block } from '../game/types'
import { PARAMS } from './params'
import { unsupported } from './support'

const { Bodies, Body, Composite, Constraint, Engine, Vector } = Matter
const STEP_MS = 1000 / 60

export interface Fall {
  id: number
  /** 떨어진 프레임 번호 (0 = 타격 자체) */
  at: number
}

export interface KnockResult {
  fell: Fall[]
  /** 스텝마다 모든 블록의 [x, y] (id * 2 인덱스). 죽은 블록은 마지막 위치 유지 */
  frames: Float32Array[]
}

interface Link {
  c: Matter.Constraint
  a: number
  /** null이면 프레임 고정 */
  b: number | null
  rest: number
}

const hexDist = (b: Block) => Math.max(Math.abs(b.q), Math.abs(b.r), Math.abs(b.q + b.r))

/**
 * 탑뷰 2D 물리 월드. 중력 없음. 블록은 이웃과 스프링으로 묶이고 가장자리 블록은
 * 자기 자리에 스프링으로 고정된다(프레임에 끼어 있는 마찰 대신). 타격 충격으로
 * 스프링이 임계치 이상 늘어나면 끊기고, 프레임까지 이어지지 않는 블록은 떨어진다.
 */
export class World {
  private engine = Engine.create({ gravity: { x: 0, y: 0, scale: 0 } })
  private bodies = new Map<number, Matter.Body>()
  private links: Link[] = []
  private byId = new Map<number, Block>()
  private last: Float32Array

  constructor(blocks: readonly Block[]) {
    this.last = new Float32Array(blocks.length * 2)
    const radius = Math.max(...blocks.map(hexDist))
    const alive = blocks.filter((b) => b.alive)
    for (const b of alive) {
      this.byId.set(b.id, b)
      const p = hexToPixel(b, HEX)
      const body = Bodies.polygon(p.x, p.y, 6, HEX * 0.92, { angle: Math.PI / 6, frictionAir: PARAMS.frictionAir, inertia: Infinity })
      this.bodies.set(b.id, body)
      this.last[b.id * 2] = p.x
      this.last[b.id * 2 + 1] = p.y
      if (hexDist(b) === radius) {
        this.link(Constraint.create({ pointA: p, bodyB: body, length: 0, stiffness: PARAMS.anchor, damping: PARAMS.damping }), b.id, null, 0)
      }
    }
    for (const a of alive) {
      for (const b of alive) {
        if (a.id < b.id && isNeighbor(a, b)) {
          const ba = this.bodies.get(a.id)!
          const bb = this.bodies.get(b.id)!
          const rest = Vector.magnitude(Vector.sub(bb.position, ba.position))
          this.link(Constraint.create({ bodyA: ba, bodyB: bb, length: rest, stiffness: PARAMS.stiffness, damping: PARAMS.damping }), a.id, b.id, rest)
        }
      }
    }
    Composite.add(this.engine.world, [...this.bodies.values()])
  }

  alive(id: number): boolean {
    return this.bodies.has(id)
  }

  /** 현재 모든 블록의 [x, y]. 죽은 블록은 마지막 위치 */
  pose(): Float32Array {
    for (const [id, body] of this.bodies) {
      this.last[id * 2] = body.position.x
      this.last[id * 2 + 1] = body.position.y
    }
    return this.last.slice()
  }

  /** 블록을 망치로 쳐서 제거하고, 이웃에 충격을 준 뒤 PARAMS.steps 만큼 시뮬레이션한다 */
  knock(id: number, seed: number): KnockResult {
    const target = this.bodies.get(id)
    const block = this.byId.get(id)
    if (!target || !block) throw new Error(`block ${id} is not on the board`)
    const origin = Vector.clone(target.position)
    this.remove(id)
    const fell: Fall[] = [{ id, at: 0 }]
    let s = seed
    for (const [nid, body] of this.bodies) {
      if (!isNeighbor(block, this.byId.get(nid)!)) continue
      const r1 = random(s)
      const r2 = random(r1.seed)
      s = r2.seed
      const mag = PARAMS.impulse * (1 + PARAMS.spread * (r1.value * 2 - 1))
      const dir = Vector.rotate(Vector.normalise(Vector.sub(body.position, origin)), PARAMS.spread * (r2.value - 0.5))
      Body.setVelocity(body, Vector.add(body.velocity, Vector.mult(dir, mag)))
    }
    const frames: Float32Array[] = []
    for (let step = 1; step <= PARAMS.steps; step++) {
      Engine.update(this.engine, STEP_MS)
      this.breakStretched()
      for (const uid of this.unsupported()) {
        this.remove(uid)
        fell.push({ id: uid, at: step })
      }
      frames.push(this.pose())
    }
    return { fell, frames }
  }

  private link(c: Matter.Constraint, a: number, b: number | null, rest: number): void {
    this.links.push({ c, a, b, rest })
    Composite.add(this.engine.world, c)
  }

  private remove(id: number): void {
    Composite.remove(this.engine.world, this.bodies.get(id)!)
    this.bodies.delete(id)
    this.links = this.links.filter((l) => {
      if (l.a !== id && l.b !== id) return true
      Composite.remove(this.engine.world, l.c)
      return false
    })
  }

  private breakStretched(): void {
    this.links = this.links.filter((l) => {
      const pa = l.c.bodyA ? Vector.add(l.c.bodyA.position, l.c.pointA) : l.c.pointA
      const pb = Vector.add(l.c.bodyB!.position, l.c.pointB)
      if (Math.abs(Vector.magnitude(Vector.sub(pb, pa)) - l.rest) <= PARAMS.breakStretch) return true
      Composite.remove(this.engine.world, l.c)
      return false
    })
  }

  private unsupported(): number[] {
    const edges: (readonly [number, number])[] = []
    const anchored: number[] = []
    for (const l of this.links) l.b === null ? anchored.push(l.a) : edges.push([l.a, l.b])
    return unsupported(this.bodies.keys(), edges, anchored)
  }
}
