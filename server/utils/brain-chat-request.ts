import type { BrainSource } from '../../types/brain'

export function brainChatTimeout(deadline: number, now = Date.now()) {
  const remaining = deadline - now
  if (remaining < 1000)
    throw Object.assign(new Error('Chat request budget exhausted'), { statusCode: 503 })
  return Math.min(20_000, remaining)
}

/** Show stored evidence verbatim when generation is unavailable; never invent an answer. */
export function brainChatSourceFallback(sources: BrainSource[]) {
  const evidence = sources
    .filter(
      (s) =>
        ['official', 'editorial'].includes(s.origin) &&
        s.verified_at &&
        s.url?.startsWith('https://') &&
        !s.id.startsWith('catalog:'),
    )
    .slice(0, 3)
  if (!evidence.length) return null
  return {
    answer:
      'Chat trenutno ne more sestaviti odgovora. V bazi sem našel naslednje povezane zapise:\n\n' +
      evidence.map((s, i) => `${s.title}\n${s.excerpt.slice(0, 1200)} [${i + 1}]`).join('\n\n'),
    citations: evidence,
    mode: 'database' as const,
    searchSuggestionsHtml: null,
  }
}

export function brainChatUpstreamStatus(error: unknown) {
  const e = error as { statusCode?: number; status?: number; response?: { status?: number } }
  return e?.response?.status || e?.statusCode || e?.status || 0
}

/** Retry only transient failures; never repeat rejected requests or exhausted quotas. */
export async function brainChatRequest<T>(
  send: () => Promise<T>,
  onFailure: (status: number, attempt: number) => void,
  pause = () => new Promise<void>((resolve) => setTimeout(resolve, 500)),
) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await send()
    } catch (error) {
      const status = brainChatUpstreamStatus(error)
      onFailure(status, attempt)
      if (attempt >= 2 || ![0, 408, 500, 502, 503, 504].includes(status)) throw error
      await pause()
    }
  }
}
