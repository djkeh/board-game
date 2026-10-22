/** mulberry32 한 스텝. 상태를 밖에 두어 reducer가 순수 함수로 남는다. */
export function random(seed: number): { value: number; seed: number } {
  const next = (seed + 0x6d2b79f5) | 0
  let t = next
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: next }
}
