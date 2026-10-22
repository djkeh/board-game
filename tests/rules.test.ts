import { describe, expect, it } from 'vitest'
import { cellsWithin, isNeighbor } from '../src/game/hexgrid'
import { PENGUIN_MIN_SUPPORT, SPINS, aliveNeighbors, resolveKnock, rollSpin, selectable, winners } from '../src/game/rules'
import type { Block } from '../src/game/types'

const blocks = (): Block[] =>
  cellsWithin(3).map((c, id) => ({ id, q: c.q, r: c.r, color: id % 2 ? 'blue' : 'white', alive: true }))
const CENTER = blocks().find((b) => b.q === 0 && b.r === 0)!.id

describe('hexgrid', () => {
  it('radius 3 has 37 cells, center has 6 neighbors', () => {
    const cells = cellsWithin(3)
    expect(cells).toHaveLength(37)
    expect(cells.filter((c) => isNeighbor({ q: 0, r: 0 }, c))).toHaveLength(6)
    expect(isNeighbor({ q: 0, r: 0 }, { q: 0, r: 0 })).toBe(false)
  })
})

describe('rollSpin', () => {
  it('is deterministic and advances the seed', () => {
    const a = rollSpin(42)
    expect(rollSpin(42)).toEqual(a)
    expect(a.seed).not.toBe(42)
    expect(SPINS).toContain(a.spin)
  })
  it('is roughly uniform', () => {
    const counts: Record<string, number> = {}
    let seed = 1
    for (let i = 0; i < 4000; i++) {
      const r = rollSpin(seed)
      seed = r.seed
      counts[r.spin] = (counts[r.spin] ?? 0) + 1
    }
    for (const s of SPINS) expect(counts[s]!).toBeGreaterThan(800)
  })
})

describe('selectable', () => {
  it('filters by colour, any, skip', () => {
    const b = blocks()
    b[0]!.alive = false
    expect(selectable(b, 'white').every((x) => x.color === 'white' && x.alive)).toBe(true)
    expect(selectable(b, 'white')).toHaveLength(18)
    expect(selectable(b, 'blue')).toHaveLength(18)
    expect(selectable(b, 'any')).toHaveLength(36)
    expect(selectable(b, 'skip')).toHaveLength(0)
    expect(selectable(b, null)).toHaveLength(0)
  })
})

describe('resolveKnock', () => {
  it('removes the block without mutating input', () => {
    const b = blocks()
    const out = resolveKnock(b, 3, CENTER)
    expect(b[3]!.alive).toBe(true)
    expect(out.blocks[3]!.alive).toBe(false)
    expect(out.fell).toEqual([3])
    expect(out.penguinFell).toBe(false)
  })
  it('penguin falls when its own block is knocked', () => {
    const out = resolveKnock(blocks(), CENTER, CENTER)
    expect(out.penguinFell).toBe(true)
    expect(out.fell).toEqual([CENTER])
  })
  it('penguin falls when support drops below the minimum', () => {
    let b = blocks()
    const center = b[CENTER]!
    const ring = aliveNeighbors(b, center)
    expect(ring).toHaveLength(6)
    // leave exactly PENGUIN_MIN_SUPPORT neighbours, then knock one more
    for (const n of ring.slice(0, 6 - PENGUIN_MIN_SUPPORT)) b = resolveKnock(b, n.id, CENTER).blocks
    expect(resolveKnock(b, 0, CENTER).penguinFell).toBe(false)
    const out = resolveKnock(b, ring[6 - PENGUIN_MIN_SUPPORT]!.id, CENTER)
    expect(out.penguinFell).toBe(true)
    expect(out.fell).toContain(CENTER)
    expect(out.blocks[CENTER]!.alive).toBe(false)
  })
})

describe('winners', () => {
  it('picks the fewest losses, with ties', () => {
    expect(winners([{ name: 'a', losses: 1 }, { name: 'b', losses: 0 }])).toEqual([1])
    expect(winners([{ name: 'a', losses: 1 }, { name: 'b', losses: 1 }, { name: 'c', losses: 2 }])).toEqual([0, 1])
  })
})
