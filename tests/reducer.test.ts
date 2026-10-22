import { describe, expect, it } from 'vitest'
import { createGame, reduce } from '../src/game/reducer'
import { rollSpin, selectable } from '../src/game/rules'
import type { GameState } from '../src/game/types'

const game = (seed = 7, rounds = 3) => createGame({ players: ['A', 'B', 'C'], rounds, seed })

/** 시드를 뒤져 다음 룰렛이 원하는 결과가 되는 상태를 만든다 */
function withNextSpin(s: GameState, want: string): GameState {
  for (let seed = 0; seed < 1000; seed++) if (rollSpin(seed).spin === want) return { ...s, seed }
  throw new Error('no seed')
}

describe('createGame', () => {
  it('builds 37 blocks, 19 white / 18 blue, penguin at centre, deterministic', () => {
    const s = game()
    expect(s.blocks).toHaveLength(37)
    expect(s.blocks.filter((b) => b.color === 'white')).toHaveLength(19)
    expect(s.blocks.every((b) => b.alive)).toBe(true)
    const pb = s.blocks.find((b) => b.id === s.penguinBlock)!
    expect([pb.q, pb.r]).toEqual([0, 0])
    expect(s.phase).toBe('spin')
    expect(game()).toEqual(s)
    expect(game(8).blocks.map((b) => b.color)).not.toEqual(s.blocks.map((b) => b.color))
  })
})

describe('reduce', () => {
  it('ignores actions in the wrong phase', () => {
    const s = game()
    expect(reduce(s, { type: 'knock', blockId: 0, fell: [0] })).toBe(s)
    expect(reduce(s, { type: 'nextRound' })).toBe(s)
    const picked = reduce(withNextSpin(s, 'any'), { type: 'spin' })
    expect(picked.phase).toBe('pick')
    expect(reduce(picked, { type: 'spin' })).toBe(picked)
  })

  it('rejects knocking a block the spin does not allow', () => {
    const s = reduce(withNextSpin(game(), 'white'), { type: 'spin' })
    const blue = s.blocks.find((b) => b.color === 'blue')!
    expect(reduce(s, { type: 'knock', blockId: blue.id, fell: [blue.id] })).toBe(s)
    const white = s.blocks.find((b) => b.color === 'white')!
    const next = reduce(s, { type: 'knock', blockId: white.id, fell: [white.id] })
    expect(next.blocks[white.id]!.alive).toBe(false)
    expect(next.phase).toBe('spin')
    expect(next.current).toBe(1)
    expect(next.seed).not.toBe(s.seed)
  })

  it('marks every block the physics dropped as dead', () => {
    const s = reduce(withNextSpin(game(), 'any'), { type: 'spin' })
    const [a, b, c] = s.blocks.filter((x) => x.id !== s.penguinBlock)
    const next = reduce(s, { type: 'knock', blockId: a!.id, fell: [a!.id, b!.id, c!.id] })
    expect(next.blocks.filter((x) => !x.alive).map((x) => x.id)).toEqual([a!.id, b!.id, c!.id])
    expect(next.phase).toBe('spin')
  })

  it('ends the round when the penguin block is among the fallen', () => {
    const s = reduce(withNextSpin(game(), 'any'), { type: 'spin' })
    const other = s.blocks.find((x) => x.id !== s.penguinBlock)!
    const next = reduce(s, { type: 'knock', blockId: other.id, fell: [other.id, s.penguinBlock] })
    expect(next.phase).toBe('roundEnd')
    expect(next.current).toBe(0)
    expect(next.players[0]!.losses).toBe(1)
    expect(next.blocks[s.penguinBlock]!.alive).toBe(false)
    const direct = reduce(s, { type: 'knock', blockId: s.penguinBlock, fell: [s.penguinBlock] })
    expect(direct.phase).toBe('roundEnd')
  })

  it('skip passes the turn', () => {
    const s = reduce(withNextSpin(game(), 'skip'), { type: 'spin' })
    expect(s.phase).toBe('spin')
    expect(s.current).toBe(1)
    expect(s.spin).toBe('skip')
  })

  it('passes the turn when no block of the rolled colour remains', () => {
    const base = game()
    const noWhite = { ...base, blocks: base.blocks.map((b) => (b.color === 'white' ? { ...b, alive: false } : b)) }
    const s = reduce(withNextSpin(noWhite, 'white'), { type: 'spin' })
    expect(s.phase).toBe('spin')
    expect(s.current).toBe(1)
    expect(s.message).toContain('건너')
  })

  it('plays a 3-round game to the end; turns rotate; loser starts the next round', () => {
    let s = game(11, 3)
    const seenRounds: number[] = []
    let knocks = 0
    for (let guard = 0; s.phase !== 'gameOver'; guard++) {
      if (guard > 5000) throw new Error('game did not finish')
      const prev = s.current
      if (s.phase === 'spin') {
        s = reduce(s, { type: 'spin' })
        if (s.phase === 'spin') expect(s.current).toBe((prev + 1) % 3) // 건너뜀
        else expect(s.current).toBe(prev)
      } else if (s.phase === 'pick') {
        const id = selectable(s.blocks, s.spin)[0]!.id
        // 여섯 번째 타격마다 물리가 펭귄을 떨어뜨렸다고 친다
        const fell = ++knocks % 6 === 0 ? [...new Set([id, s.penguinBlock])] : [id]
        s = reduce(s, { type: 'knock', blockId: id, fell })
        if (s.phase === 'spin') expect(s.current).toBe((prev + 1) % 3)
        else expect(s.current).toBe(prev) // 펭귄 낙하: 패자가 current로 남는다
      } else if (s.phase === 'roundEnd') {
        const loser = s.current
        expect(s.players[loser]!.losses).toBeGreaterThan(0)
        s = reduce(s, { type: 'nextRound' })
        expect(s.current).toBe(loser)
        expect(s.blocks.every((b) => b.alive)).toBe(true)
        seenRounds.push(s.round)
      }
    }
    expect(seenRounds).toEqual([2, 3])
    expect(s.round).toBe(3)
    expect(s.players.reduce((n, p) => n + p.losses, 0)).toBe(3)
    expect(reduce(s, { type: 'spin' })).toBe(s)
  })
})
