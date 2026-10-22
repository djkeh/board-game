import { isNeighbor } from './hexgrid'
import { random } from './rng'
import type { Block, Player, Spin } from './types'

/** 룰렛 네 칸, 균등 확률 */
export const SPINS: readonly Spin[] = ['white', 'blue', 'any', 'skip']

export const SPIN_LABEL: Record<Spin, string> = {
  white: '흰색',
  blue: '파란색',
  any: '아무 색깔',
  skip: '차례 건너뛰기',
}

export function rollSpin(seed: number): { spin: Spin; seed: number } {
  const r = random(seed)
  return { spin: SPINS[Math.floor(r.value * SPINS.length)]!, seed: r.seed }
}

/** 룰렛 결과로 칠 수 있는 블록 */
export function selectable(blocks: readonly Block[], spin: Spin | null): Block[] {
  if (!spin || spin === 'skip') return []
  return blocks.filter((b) => b.alive && (spin === 'any' || b.color === spin))
}

export function aliveNeighbors(blocks: readonly Block[], of: Block): Block[] {
  return blocks.filter((b) => b.alive && b.id !== of.id && isNeighbor(of, b))
}

/** 패배 수가 가장 적은 플레이어 인덱스. 동점이면 여럿 */
export function winners(players: readonly Player[]): number[] {
  const min = Math.min(...players.map((p) => p.losses))
  return players.flatMap((p, i) => (p.losses === min ? [i] : []))
}
