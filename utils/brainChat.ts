export interface BrainChatMessage {
  role: 'user' | 'assistant'
  text: string
}

/** A bounded fallback for retrieval only. Previous replies supply references, never evidence. */
export function brainChatRetrievalQuery(messages: BrainChatMessage[]): string {
  const latest = messages.at(-1)?.text || ''
  if (messages.length === 1) return latest
  const context = messages
    .slice(-5, -1)
    .map((m) => `${m.role === 'user' ? 'Vprašanje' : 'Kontekst odgovora'}: ${m.text.slice(0, 500)}`)
    .join('\n')
  return `${context}\nZadnje vprašanje: ${latest}`.slice(-3000)
}

/** Bound the transient context by bytes as well as turns; never persist a transcript. */
export function brainChatHistory(messages: BrainChatMessage[]): BrainChatMessage[] {
  const turns = messages.slice(-12).map((m) => ({ ...m, text: m.text.slice(0, 6000) }))
  const bytes = () => new TextEncoder().encode(JSON.stringify(turns)).length
  while (turns.length > 1 && (turns[0]?.role !== 'user' || bytes() > 32_000)) turns.shift()
  return turns
}
