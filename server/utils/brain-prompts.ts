export function pickBrainPrompts<T>(prompts: T[], randomInt: (max: number) => number): T[] {
  const pool = [...prompts]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  return pool.slice(0, 2)
}
