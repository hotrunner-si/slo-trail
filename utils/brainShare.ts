import type { BrainChatMessage } from './brainChat'

export function redactBrainShare(text: string) {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[e-pošta odstranjena]')
    .replace(/(?:\+?\d[\s().-]*){8,}/g, (value) =>
      /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}[.\s]*$/.test(value) ? value : '[telefon odstranjen]',
    )
}
export function brainShareDraft(messages: BrainChatMessage[]) {
  const title = redactBrainShare(
    messages.find((m) => m.role === 'user')?.text || 'Pogovor o trail teku',
  ).slice(0, 160)
  const original = redactBrainShare(
    messages
      .map((m) => `${m.role === 'user' ? 'Uporabnik' : 'Možgan (odgovor AI)'}:\n${m.text}`)
      .join('\n\n'),
  )
  let content = ''
  let bytes = 0
  const encoder = new TextEncoder()
  for (const character of original) {
    const size = encoder.encode(character).length
    if (content.length + character.length > 10800 || bytes + size > 31000) break
    content += character
    bytes += size
  }
  if (content.length < original.length)
    content += '\n\n[Preostanek pogovora ni vključen v ta posnetek.]'
  return { title, content }
}
