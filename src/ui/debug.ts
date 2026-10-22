import { PARAMS } from '../physics/params'

/** 물리 파라미터를 런타임에 바꾸는 패널. 스프링 관련 값은 "보드 리셋" 뒤에 적용된다 */
export function mountDebug(el: HTMLElement, resetWorld: () => void): void {
  const rows = Object.entries(PARAMS)
    .map(([k, v]) => `<label>${k}<input name="${k}" type="number" step="any" value="${v}" /></label>`)
    .join('')
  el.innerHTML = `<details><summary>물리 튜닝</summary>${rows}<button type="button" id="reset-world">보드 리셋 (스프링 복원)</button></details>`
  el.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement
    const v = Number(t.value)
    if (t.name in PARAMS && Number.isFinite(v)) (PARAMS as Record<string, number>)[t.name] = v
  })
  el.querySelector('#reset-world')!.addEventListener('click', resetWorld)
}
