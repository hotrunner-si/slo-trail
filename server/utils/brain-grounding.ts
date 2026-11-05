import type { BrainSource } from '../../types/brain'

export interface BrainGroundedCandidate {
  finishReason?: string
  content?: { parts?: { text?: string; thought?: boolean }[] }
  groundingMetadata?: {
    groundingChunks?: { web?: { uri?: string; title?: string } }[]
    groundingSupports?: {
      segment?: { partIndex?: number; endIndex?: number; text?: string }
      groundingChunkIndices?: number[]
    }[]
    searchEntryPoint?: { renderedContent?: string }
    webSearchQueries?: string[]
  }
}

export function parseBrainGrounding(candidate: BrainGroundedCandidate) {
  const metadata = candidate.groundingMetadata
  const chunks = metadata?.groundingChunks || []
  const supports = metadata?.groundingSupports || []
  const used = new Set(supports.flatMap((s) => s.groundingChunkIndices || []))
  const citations: BrainSource[] = []
  const indices = new Map<number, number>()
  chunks.forEach((chunk, index) => {
    if (used.size && !used.has(index)) return
    const url = chunk.web?.uri
    if (!url || !/^https?:\/\//i.test(url) || citations.length >= 12) return
    const existing = citations.findIndex((s) => s.url === url)
    if (existing >= 0) {
      indices.set(index, existing + 1)
      return
    }
    citations.push({
      id: `web:${index}`,
      title: chunk.web?.title || new URL(url).hostname,
      url,
      origin: 'web',
      entity_id: '',
      excerpt: '',
      verified_at: null,
      valid_from: null,
      valid_until: null,
    })
    indices.set(index, citations.length)
  })
  const text = (candidate.content?.parts || [])
    .map((part, partIndex) => {
      if (part.thought || !part.text) return ''
      const bytes = new TextEncoder().encode(part.text)
      const markers = new Map<number, Set<number>>()
      for (const support of supports) {
        if ((support.segment?.partIndex ?? 0) !== partIndex) continue
        const end = support.segment?.endIndex
        if (end == null || !Number.isInteger(end) || end < 0 || end > bytes.length) continue
        const refs = markers.get(end) || new Set<number>()
        for (const id of support.groundingChunkIndices || []) {
          const ref = indices.get(id)
          if (ref) refs.add(ref)
        }
        if (refs.size) markers.set(end, refs)
      }
      let result = '',
        cursor = 0
      for (const [end, refs] of [...markers].sort(([a], [b]) => a - b)) {
        result +=
          new TextDecoder().decode(bytes.slice(cursor, end)) +
          ` [${[...refs].sort((a, b) => a - b).join(', ')}]`
        cursor = end
      }
      return result + new TextDecoder().decode(bytes.slice(cursor))
    })
    .filter(Boolean)
    .join('\n')
  if (!text.trim() || text.length > 9000) throw new Error('Invalid grounded answer')
  // A model-only answer is never presented as verified web research.
  if (!citations.length)
    return {
      answer:
        'Tega podatka v naši bazi še nimamo, spletno iskanje pa ni vrnilo preverljivega vira za odgovor.',
      citations: [],
      mode: 'missing' as const,
      searchSuggestionsHtml: null,
    }
  return {
    answer: text.trim(),
    citations,
    mode: 'web' as const,
    searchSuggestionsHtml: metadata?.searchEntryPoint?.renderedContent || null,
  }
}
