import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  const body = await brainBody(
    event,
    z.object({
      query: z.string().trim().max(300),
      semantic: z.boolean().default(false),
      kind: z.string().max(30).default(''),
      origin: z.enum(['', 'official', 'editorial', 'unverified', 'community']).default(''),
    }),
  )
  brainLimit(event, 'search:' + user!.id, 30)
  const { count: indexed } = body.semantic
    ? await brainService(event)
        .from('brain_sources')
        .select('id', { count: 'exact', head: true })
        .eq('embedding_model', brainConfig(event).brainEmbeddingModel)
        .not('embedding', 'is', null)
    : { count: 0 }
  const vector = body.semantic && indexed ? await brainEmbedding(event, body.query) : null
  const { data, error } = await client.rpc('brain_search_filtered', {
    p_query: body.query,
    p_vector: vector ? JSON.stringify(vector) : null,
    p_kind: body.kind,
    p_origin: body.origin,
    p_model: brainConfig(event).brainEmbeddingModel,
  })
  brainCheck(error)
  await brainTrack(event, 'search', true)
  const ids = (data || []).map((r: { entity_id: string }) => r.entity_id)
  const { data: relations } = ids.length
    ? await client.from('brain_relations').select('*').in('subject_id', ids)
    : { data: [] }
  // Claims are separate from editorial/official sources, with no account identifiers.
  const { data: claims } = ids.length
    ? await client
        .from('brain_claims')
        .select('id,entity_id,statement,year,conditions,origin')
        .in('entity_id', ids)
        .eq('status', 'active')
    : { data: [] }
  return {
    records: data,
    relations: relations || [],
    claims: claims || [],
    mode: vector ? 'hybrid' : 'keyword',
    semanticNote:
      body.semantic && !vector
        ? 'Pomenska storitev ni na voljo; prikazani so zadetki po besedah.'
        : 'Podobnost ni ocena resničnosti.',
  }
})
