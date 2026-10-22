/**
 * 프레임까지 살아 있는 제약으로 이어지지 않은 블록을 찾는다.
 * anchored 블록(프레임 고정 제약이 남은 블록)에서 edges를 따라 닿지 않는 블록은 떨어진다.
 */
export function unsupported(
  alive: Iterable<number>,
  edges: Iterable<readonly [number, number]>,
  anchored: Iterable<number>,
): number[] {
  const adj = new Map<number, number[]>()
  for (const id of alive) adj.set(id, [])
  for (const [a, b] of edges) {
    adj.get(a)?.push(b)
    adj.get(b)?.push(a)
  }
  const seen = new Set<number>()
  const stack = [...anchored].filter((id) => adj.has(id))
  for (const id of stack) seen.add(id)
  while (stack.length) {
    for (const n of adj.get(stack.pop()!)!) {
      if (!seen.has(n)) {
        seen.add(n)
        stack.push(n)
      }
    }
  }
  return [...adj.keys()].filter((id) => !seen.has(id))
}
