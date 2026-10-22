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
