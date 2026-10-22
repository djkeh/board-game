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
  current: number
  round: number
  totalRounds: number
  blocks: Block[]
  penguinBlock: number
  spin: Spin | null
  lastFell: number[]
  roundLoser: number | null
  seed: number
  message: string
}

export type Action = { type: 'spin' } | { type: 'knock'; blockId: number } | { type: 'nextRound' }
