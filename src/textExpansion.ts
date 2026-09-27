/** Увеличивает ли новое значение объём текста относительно старого. */
export function isTextExpansion(prev: string, next: string): boolean {
  if (next.length > prev.length) return true
  const prevLines = prev.split('\n').length
  const nextLines = next.split('\n').length
  return nextLines > prevLines
}
