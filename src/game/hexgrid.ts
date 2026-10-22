export interface Axial {
  q: number
  r: number
}

export const DIRS: readonly Axial[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]

/** 중심에서 거리 radius 이내의 모든 칸 (radius 3 → 37칸) */
export function cellsWithin(radius: number): Axial[] {
  const out: Axial[] = []
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) out.push({ q, r })
  }
  return out
}

export const isNeighbor = (a: Axial, b: Axial): boolean =>
  DIRS.some((d) => a.q + d.q === b.q && a.r + d.r === b.r)

/** pointy-top 육각형 중심의 픽셀 좌표. size는 외접원 반지름 */
export function hexToPixel(a: Axial, size: number): { x: number; y: number } {
  return { x: size * Math.sqrt(3) * (a.q + a.r / 2), y: size * 1.5 * a.r }
}
