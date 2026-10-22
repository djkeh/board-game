export type Color = 'white' | 'blue'
export type Spin = Color | 'any' | 'skip'
export type Phase = 'spin' | 'pick' | 'roundEnd' | 'gameOver'

export interface Block {
  id: number
  q: number
  r: number
  color: Color
  alive: boolean
}

export interface Player {
  name: string
  losses: number
}

export interface GameState {
  phase: Phase
  players: Player[]
  /** 현재 차례. roundEnd/gameOver에서는 펭귄을 떨어뜨린 사람 */
  current: number
  round: number
  totalRounds: number
  blocks: Block[]
  penguinBlock: number
  spin: Spin | null
  seed: number
  message: string
}

export type Action =
  | { type: 'spin' }
  /** fell: 물리 시뮬레이션이 떨어뜨린 블록(타격한 블록 포함) */
  | { type: 'knock'; blockId: number; fell: number[] }
  | { type: 'nextRound' }
