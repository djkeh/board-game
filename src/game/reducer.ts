import { cellsWithin } from './hexgrid'
import { random } from './rng'
import { SPIN_LABEL, resolveKnock, rollSpin, selectable } from './rules'
import type { Action, Block, Color, GameState } from './types'

export interface Config {
  players: string[]
  rounds: number
  seed: number
}

const BOARD_RADIUS = 3

/** 37칸에 흰색 19, 파란색 18을 섞어 배치 */
function makeBlocks(seed: number): { blocks: Block[]; seed: number } {
  const cells = cellsWithin(BOARD_RADIUS)
  const colors: Color[] = cells.map((_, i) => (i < Math.ceil(cells.length / 2) ? 'white' : 'blue'))
  for (let i = colors.length - 1; i > 0; i--) {
    const r = random(seed)
    seed = r.seed
    const j = Math.floor(r.value * (i + 1))
    ;[colors[i], colors[j]] = [colors[j]!, colors[i]!]
  }
  return { blocks: cells.map((c, id) => ({ id, q: c.q, r: c.r, color: colors[id]!, alive: true })), seed }
}

export function createGame(cfg: Config): GameState {
  const { blocks, seed } = makeBlocks(cfg.seed)
  return {
    phase: 'spin',
    players: cfg.players.map((name) => ({ name, losses: 0 })),
    current: 0,
    round: 1,
    totalRounds: cfg.rounds,
    blocks,
    penguinBlock: blocks.find((b) => b.q === 0 && b.r === 0)!.id,
    spin: null,
    seed,
    message: `${cfg.players[0]} 차례. 룰렛을 돌리세요`,
  }
}

const nextPlayer = (s: GameState) => (s.current + 1) % s.players.length
const name = (s: GameState, i: number) => s.players[i]!.name

export function reduce(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'spin': {
      if (s.phase !== 'spin') return s
      const { spin, seed } = rollSpin(s.seed)
      if (selectable(s.blocks, spin).length === 0) {
        const n = nextPlayer(s)
        return { ...s, seed, spin, current: n, message: `${name(s, s.current)}: ${SPIN_LABEL[spin]} → 건너뜀. ${name(s, n)} 차례` }
      }
      return { ...s, seed, spin, phase: 'pick', message: `${name(s, s.current)}: ${SPIN_LABEL[spin]} 블록을 고르세요` }
    }
    case 'knock': {
      if (s.phase !== 'pick') return s
      if (!selectable(s.blocks, s.spin).some((b) => b.id === a.blockId)) return s
      const { blocks, penguinFell } = resolveKnock(s.blocks, a.blockId, s.penguinBlock)
      if (!penguinFell) {
        const n = nextPlayer(s)
        return { ...s, blocks, spin: null, phase: 'spin', current: n, message: `${name(s, n)} 차례. 룰렛을 돌리세요` }
      }
      const players = s.players.map((p, i) => (i === s.current ? { ...p, losses: p.losses + 1 } : p))
      const last = s.round >= s.totalRounds
      return { ...s, blocks, players, spin: null, phase: last ? 'gameOver' : 'roundEnd', message: `${name(s, s.current)}이(가) 펭귄을 떨어뜨렸습니다!` }
    }
    case 'nextRound': {
      // 직전 판 패자(current)가 먼저 시작한다
      if (s.phase !== 'roundEnd') return s
      const { blocks, seed } = makeBlocks(s.seed)
      return { ...s, blocks, seed, round: s.round + 1, phase: 'spin', spin: null, message: `${s.round + 1}판. ${name(s, s.current)} 차례. 룰렛을 돌리세요` }
    }
  }
}
