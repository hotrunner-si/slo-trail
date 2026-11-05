import type { H3Event } from 'h3'
import type { BrainSource } from '../../types/brain'
import { brainEmbeddingSettings, createBrainVector } from './brain-embeddings.ts'

export async function brainSemanticSearch(
  event: H3Event,
  query: string,
  options: {
    client?: ReturnType<typeof brainService>
    kind?: string
    origin?: string
    publicOnly?: boolean
    entity?: string | null
  } = {},
) {
  const settings = brainEmbeddingSettings(brainConfig(event))
  if (!settings || !query.trim()) return null
  const client = options.client || brainService(event)
  const { count, error } = await client
    .from('brain_sources')
    .select('id', { count: 'exact', head: true })
    .eq('embedding_model', settings.identity)
    .not('embedding', 'is', null)
  if (error || !count) return null
  try {
    const vector = await createBrainVector(settings, query.slice(-3000), 'query')
    const result = await client.rpc('brain_nearest_sources', {
      p_vector: JSON.stringify(vector),
      p_model: settings.identity,
      p_kind: options.kind || '',
      p_origin: options.origin || '',
      p_public_only: options.publicOnly ?? true,
      p_entity: options.entity || null,
    })
    if (result.error) throw new Error('Vector lookup unavailable')
    return result.data as (BrainSource & { distance: number })[]
  } catch {
    // No query text, keys, user data or provider responses in diagnostics.
    console.warn('[brain-search] semantic lookup unavailable; using keyword search')
    return null
  }
}
