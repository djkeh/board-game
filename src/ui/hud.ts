import { SPIN_LABEL, winners } from '../game/rules'
import type { Action, GameState } from '../game/types'

export function renderHud(el: HTMLElement, s: GameState, dispatch: (a: Action) => void): void {
  const players = s.players
    .map((p, i) => `<li class="${i === s.current && s.phase !== 'gameOver' ? 'current' : ''}">${p.name}<span>패배 ${p.losses}</span></li>`)
    .join('')
  const win = s.phase === 'gameOver' ? `<p class="win">승리: ${winners(s.players).map((i) => s.players[i]!.name).join(', ')}</p>` : ''
  el.innerHTML = `
    <p class="round">${s.round} / ${s.totalRounds}판</p>
    <ul class="players">${players}</ul>
    <p class="msg">${s.message}</p>
    <p class="spin">룰렛: ${s.spin ? SPIN_LABEL[s.spin] : '-'}</p>
    ${win}
    ${s.phase === 'spin' ? '<button id="spin">룰렛 돌리기</button>' : ''}
    ${s.phase === 'roundEnd' ? '<button id="next">다음 판</button>' : ''}`
  el.querySelector('#spin')?.addEventListener('click', () => dispatch({ type: 'spin' }))
  el.querySelector('#next')?.addEventListener('click', () => dispatch({ type: 'nextRound' }))
}
