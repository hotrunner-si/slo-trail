export const BRAIN_VECTOR_DIMENSIONS = 1536

export interface BrainEmbeddingSettings {
  apiKey: string
  model: string
  identity: string
}

export function brainEmbeddingSettings(config: {
  geminiApiKey?: string
  brainEmbeddingModel?: string
}): BrainEmbeddingSettings | null {
  if (!config.geminiApiKey) return null
  const model = config.brainEmbeddingModel || 'gemini-embedding-001'
  // Task-specific document/query embeddings must use the same model and dimensions.
  if (model !== 'gemini-embedding-001') return null
  return {
    apiKey: config.geminiApiKey,
    model,
    identity: `google:${model}:${BRAIN_VECTOR_DIMENSIONS}:retrieval-v1`,
  }
}

export function normalizeBrainVector(value: unknown): number[] {
  if (
    !Array.isArray(value) ||
    value.length !== BRAIN_VECTOR_DIMENSIONS ||
    value.some((x) => typeof x !== 'number' || !Number.isFinite(x))
  )
    throw new Error('Invalid embedding vector')
  const norm = Math.hypot(...value)
  if (!Number.isFinite(norm) || norm === 0) throw new Error('Empty embedding vector')
  return value.map((x) => x / norm)
}

export async function createBrainVector(
  settings: BrainEmbeddingSettings,
  text: string,
  purpose: 'query' | 'document',
  title?: string,
  request: typeof fetch = fetch,
) {
  const response = await request(
    `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:embedContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': settings.apiKey },
      body: JSON.stringify({
        model: `models/${settings.model}`,
        content: { parts: [{ text }] },
        taskType: purpose === 'document' ? 'RETRIEVAL_DOCUMENT' : 'RETRIEVAL_QUERY',
        ...(purpose === 'document' && title ? { title } : {}),
        outputDimensionality: BRAIN_VECTOR_DIMENSIONS,
      }),
      signal: AbortSignal.timeout(20_000),
    },
  )
  if (!response.ok)
    throw Object.assign(new Error('Embedding service unavailable'), { statusCode: response.status })
  const result = (await response.json()) as { embedding?: { values?: number[] } }
  return normalizeBrainVector(result.embedding?.values)
}
