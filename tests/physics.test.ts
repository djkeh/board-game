import { describe, expect, it } from 'vitest'
import { unsupported } from '../src/physics/support'

describe('unsupported', () => {
  it('keeps blocks reachable from an anchor and drops the rest', () => {
    // 0(anchor) - 1 - 2    3 - 4 (떠 있음)   5 (고립)
    const out = unsupported([0, 1, 2, 3, 4, 5], [[0, 1], [1, 2], [3, 4]], [0])
    expect(out).toEqual([3, 4, 5])
  })
  it('ignores anchors and edges that point at dead blocks', () => {
    expect(unsupported([1, 2], [[0, 1], [1, 2]], [0])).toEqual([1, 2])
    expect(unsupported([1, 2], [[1, 2]], [1, 9])).toEqual([])
  })
  it('returns nothing when everything is anchored', () => {
    expect(unsupported([0, 1], [], [0, 1])).toEqual([])
    expect(unsupported([], [], [])).toEqual([])
  })
})

import { createGame } from '../src/game/reducer'
import { random } from '../src/game/rng'
import { World } from '../src/physics/world'

const blocksOf = (seed: number) => createGame({ players: ['A', 'B'], rounds: 1, seed }).blocks
const centerOf = (seed: number) => createGame({ players: ['A', 'B'], rounds: 1, seed }).penguinBlock

describe('World', () => {
  it('is deterministic for the same blocks, seed and knock', () => {
    const a = new World(blocksOf(3)).knock(5, 99)
    const b = new World(blocksOf(3)).knock(5, 99)
    expect(b.fell).toEqual(a.fell)
    expect(b.frames.map((f) => [...f])).toEqual(a.frames.map((f) => [...f]))
    expect(a.frames.length).toBeGreaterThan(0)
  })

  it('records the knocked block as fallen at frame 0 and refuses a dead block', () => {
    const w = new World(blocksOf(3))
    const r = w.knock(5, 1)
    expect(r.fell[0]).toEqual({ id: 5, at: 0 })
    expect(w.alive(5)).toBe(false)
    expect(() => w.knock(5, 1)).toThrow()
  })

  it('drops a block once all six neighbours are gone', () => {
    const blocks = blocksOf(3)
    const x = blocks.find((b) => b.q === 2 && b.r === 0)!
    const ring = blocks.filter((b) => Math.max(Math.abs(b.q - x.q), Math.abs(b.r - x.r), Math.abs(b.q + b.r - x.q - x.r)) === 1)
    expect(ring).toHaveLength(6)
    const w = new World(blocks)
    const fell = new Set<number>()
    for (const n of ring) {
      if (!w.alive(n.id)) continue
      for (const f of w.knock(n.id, n.id).fell) fell.add(f.id)
    }
    expect(fell.has(x.id)).toBe(true)
    expect(w.alive(x.id)).toBe(false)
  })

  it('drops the penguin block when every other block is removed', () => {
    const blocks = blocksOf(4)
    const center = centerOf(4)
    const w = new World(blocks)
    let penguinFell = false
    for (const b of blocks) {
      if (b.id === center || !w.alive(b.id)) continue
      if (w.knock(b.id, b.id).fell.some((f) => f.id === center)) penguinFell = true
    }
    expect(penguinFell).toBe(true)
    expect(w.alive(center)).toBe(false)
  })

  it('rarely drops the penguin or chains on the first hit of a fresh board', () => {
    let penguin = 0
    let chain = 0
    for (let seed = 1; seed <= 100; seed++) {
      const blocks = blocksOf(seed)
      const center = centerOf(seed)
      const pick = blocks[Math.floor(random(seed).value * blocks.length)]!
      if (pick.id === center) continue
      const r = new World(blocks).knock(pick.id, seed * 7)
      if (r.fell.some((f) => f.id === center)) penguin++
      if (r.fell.length > 1) chain++
    }
    expect(penguin).toBeLessThan(5)
    expect(chain).toBeLessThan(10)
  })
})
