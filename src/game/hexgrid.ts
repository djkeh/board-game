export interface Axial {
  q: number
  r: number
}

/** 중심에서 거리 radius 이내의 모든 칸 (radius 3 → 37칸) */
export function cellsWithin(radius: number): Axial[] {
  const out: Axial[] = []
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) out.push({ q, r })
  }
  return out
}

/** 축 좌표 거리가 1이면 이웃 */
export function isNeighbor(a: Axial, b: Axial): boolean {
  const dq = b.q - a.q
  const dr = b.r - a.r
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) === 1
}

/** pointy-top 육각형 중심의 픽셀 좌표. size는 외접원 반지름 */
export function hexToPixel(a: Axial, size: number): { x: number; y: number } {
  return { x: size * Math.sqrt(3) * (a.q + a.r / 2), y: size * 1.5 * a.r }
}
