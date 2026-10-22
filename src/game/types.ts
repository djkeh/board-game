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

export type Action = { type: 'spin' } | { type: 'knock'; blockId: number } | { type: 'nextRound' }
