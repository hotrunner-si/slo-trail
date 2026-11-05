export interface BrainChatMessage {
  role: 'user' | 'assistant'
  text: string
}

/** Bound the transient context by bytes as well as turns; never persist a transcript. */
export function brainChatHistory(messages: BrainChatMessage[]): BrainChatMessage[] {
  const turns = messages.slice(-12).map((m) => ({ ...m, text: m.text.slice(0, 6000) }))
  const bytes = () => new TextEncoder().encode(JSON.stringify(turns)).length
  while (turns.length > 1 && (turns[0]?.role !== 'user' || bytes() > 32_000)) turns.shift()
  return turns
}
