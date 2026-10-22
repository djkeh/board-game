import { Application } from 'pixi.js'
import { createGame, reduce } from './game/reducer'
import type { Action, GameState } from './game/types'
import { World } from './physics/world'
import { BOARD_SIZE, BoardView } from './render/board'
import { mountDebug } from './ui/debug'
import { renderHud } from './ui/hud'

const NAMES = ['1번', '2번', '3번', '4번']

async function main() {
  const boardEl = document.getElementById('board')!
  const statusEl = document.getElementById('status')!
  const form = document.getElementById('new') as HTMLFormElement

  const app = new Application()
  await app.init({ resizeTo: boardEl, background: 0xcfe9f7, antialias: true, resolution: window.devicePixelRatio, autoDensity: true })
  boardEl.appendChild(app.canvas)

  let state: GameState = newGame(2, 3)
  let world = new World(state.blocks)
  let busy = false // 타격 연출 재생 중

  const board = new BoardView((id) => {
    if (busy) return
    busy = true
    board.update({ ...state, spin: null }) // 재생 중에는 강조와 입력을 끈다
    const sim = world.knock(id, state.seed)
    board.play(sim, () => {
      busy = false
      dispatch({ type: 'knock', blockId: id, fell: sim.fell.map((f) => f.id) })
    })
  })
  app.stage.addChild(board.root)
  const fit = () => {
    board.root.scale.set(Math.min(app.screen.width, app.screen.height) / BOARD_SIZE)
    board.root.position.set(app.screen.width / 2, app.screen.height / 2)
  }
  app.renderer.on('resize', fit)
  fit()
  new ResizeObserver(() => app.resize()).observe(boardEl) // HUD 높이가 바뀌면 #board도 바뀐다

  function newGame(players: number, rounds: number): GameState {
    return createGame({ players: NAMES.slice(0, players), rounds, seed: Date.now() })
  }
  /** 현재 상태의 블록으로 물리 월드를 새로 만든다 (새 판, 새 게임) */
  function resetWorld() {
    world = new World(state.blocks)
    board.setPose(world.pose())
  }
  function render() {
    board.update(state)
    renderHud(statusEl, state, dispatch)
  }
  function dispatch(a: Action) {
    state = reduce(state, a)
    render()
    if (a.type === 'nextRound') resetWorld()
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (busy) return
    const data = new FormData(form)
    state = newGame(Number(data.get('players')), Number(data.get('rounds')))
    render()
    resetWorld()
  })
  render()
  resetWorld()
  if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) mountDebug(document.getElementById('debug')!, resetWorld)
}

main()
