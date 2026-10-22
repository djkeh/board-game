import { Container, Graphics, Ticker } from 'pixi.js'
import { HEX, hexToPixel } from '../game/hexgrid'
import { aliveNeighbors, selectable } from '../game/rules'
import type { GameState } from '../game/types'
import type { KnockResult } from '../physics/world'

/** 논리 해상도. main.ts가 뷰포트에 맞춰 스케일한다 */
export const BOARD_SIZE = 1080
/** 떨어지는 블록이 사라지는 데 걸리는 프레임 */
const FALL_FRAMES = 18
const COLORS = { white: 0xf2f7ff, blue: 0x5fc4e6, edge: 0x9fb8d8, hilite: 0xffd54a, frame: 0x1e4fb5, penguin: 0x1d1d1d }

export class BoardView {
  readonly root = new Container()
  private blocks = new Map<number, Graphics>()
  private penguin = new Graphics()
  private penguinId = -1
  /** 0(이웃 6개) ~ 1(이웃 없음). 펭귄 흔들림 진폭 */
  private wobble = 0
  private clock = 0

  constructor(private onPick: (id: number) => void) {
    this.root.addChild(new Graphics().regularPoly(0, 0, BOARD_SIZE / 2, 6).fill(COLORS.frame))
    this.penguin
      .circle(0, 0, HEX * 0.42).fill(COLORS.penguin)
      .ellipse(0, HEX * 0.08, HEX * 0.24, HEX * 0.3).fill(0xffffff)
      .poly([-8, -HEX * 0.1, 8, -HEX * 0.1, 0, HEX * 0.05]).fill(0xff9f1c)
    Ticker.shared.add((t: Ticker) => {
      this.clock += t.deltaTime
      this.penguin.rotation = Math.sin(this.clock * 0.3) * this.wobble * 0.4
    })
  }

  /** 상태에 따른 색·강조·표시 여부. 위치는 setPose/play가 정한다 */
  update(s: GameState): void {
    this.penguinId = s.penguinBlock
    const pick = new Set(selectable(s.blocks, s.phase === 'pick' ? s.spin : null).map((b) => b.id))
    for (const b of s.blocks) {
      let g = this.blocks.get(b.id)
      if (!g) {
        g = new Graphics()
        g.position.copyFrom(hexToPixel(b, HEX))
        g.cursor = 'pointer'
        g.on('pointertap', () => this.onPick(b.id))
        this.blocks.set(b.id, g)
        this.root.addChild(g)
      }
      const hot = pick.has(b.id)
      g.visible = b.alive
      g.eventMode = hot ? 'static' : 'none'
      g.clear().regularPoly(0, 0, HEX * 0.92, 6).fill(COLORS[b.color]).stroke({ width: hot ? 8 : 3, color: hot ? COLORS.hilite : COLORS.edge })
    }
    const pb = s.blocks.find((b) => b.id === s.penguinBlock)!
    this.penguin.visible = pb.alive
    this.wobble = 1 - aliveNeighbors(s.blocks, pb).length / 6
    this.root.addChild(this.penguin) // 항상 블록 위에
    this.followPenguin()
  }

  /** 모든 블록을 물리 좌표로 옮기고 낙하 연출 상태를 되돌린다 */
  setPose(pose: Float32Array): void {
    for (const [id, g] of this.blocks) {
      g.position.set(pose[id * 2]!, pose[id * 2 + 1]!)
      g.scale.set(1)
      g.alpha = 1
    }
    this.followPenguin()
  }

  /** 타격 시뮬레이션을 프레임 단위로 재생하고 끝나면 onDone */
  play(sim: KnockResult, onDone: () => void): void {
    let frame = 0
    const tick = (t: Ticker) => {
      frame += t.deltaTime
      const pose = sim.frames[Math.min(sim.frames.length - 1, Math.floor(frame))]
      if (pose) for (const [id, g] of this.blocks) g.position.set(pose[id * 2]!, pose[id * 2 + 1]!)
      for (const f of sim.fell) {
        if (frame < f.at) continue
        const k = Math.max(0, 1 - (frame - f.at) / FALL_FRAMES)
        const g = this.blocks.get(f.id)!
        g.scale.set(k)
        g.alpha = k
      }
      this.followPenguin()
      if (frame >= sim.frames.length + FALL_FRAMES) {
        Ticker.shared.remove(tick)
        onDone()
      }
    }
    Ticker.shared.add(tick)
  }

  /** 펭귄은 자기 블록의 위치·크기·투명도를 따라간다 */
  private followPenguin(): void {
    const g = this.blocks.get(this.penguinId)
    if (!g) return
    this.penguin.position.copyFrom(g.position)
    this.penguin.scale.copyFrom(g.scale)
    this.penguin.alpha = g.alpha
  }
}
