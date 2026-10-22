import { Application } from 'pixi.js'
import { createGame, reduce } from './game/reducer'
import type { Action, GameState } from './game/types'
import { BOARD_SIZE, BoardView } from './render/board'
import { renderHud } from './ui/hud'

const NAMES = ['1번', '2번', '3번', '4번']

async function main() {
  const boardEl = document.getElementById('board')!
  const statusEl = document.getElementById('status')!
  const form = document.getElementById('new') as HTMLFormElement

  const app = new Application()
  await app.init({ resizeTo: boardEl, background: 0xcfe9f7, antialias: true, resolution: window.devicePixelRatio, autoDensity: true })
  boardEl.appendChild(app.canvas)

  const board = new BoardView((id) => dispatch({ type: 'knock', blockId: id }))
  app.stage.addChild(board.root)
  const fit = () => {
    board.root.scale.set(Math.min(app.screen.width, app.screen.height) / BOARD_SIZE)
    board.root.position.set(app.screen.width / 2, app.screen.height / 2)
  }
  app.renderer.on('resize', fit)
  fit()

  let state: GameState = newGame(2, 3)
  function newGame(players: number, rounds: number): GameState {
    return createGame({ players: NAMES.slice(0, players), rounds, seed: Date.now() })
  }
  function render() {
    board.update(state)
    renderHud(statusEl, state, dispatch)
  }
  function dispatch(a: Action) {
    state = reduce(state, a)
    render()
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(form)
    state = newGame(Number(data.get('players')), Number(data.get('rounds')))
    render()
  })
  render()
}

main()
