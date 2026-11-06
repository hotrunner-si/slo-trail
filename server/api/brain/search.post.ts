import { z } from 'zod'
import { brainQuestionSearchQuery, rankBrainSources } from '../../utils/brain-knowledge'
import type { BrainSource } from '../../../types/brain'
import { brainSemanticSearch } from '../../utils/brain-semantic'
import { publicPreviewEnabled } from '../../../utils/siteAccess'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const identity = await brainIdentity(event, !publicPreviewEnabled)
  const user = identity.user
  const publicOnly = !user
  const client = publicOnly ? brainService(event) : identity.client
  const body = await brainBody(
    event,
    z.object({
      query: z.string().trim().max(300),
      semantic: z.boolean().default(true),
      kind: z.string().max(30).default(''),
      origin: z.enum(['', 'official', 'editorial', 'unverified', 'community']).default(''),
    }),
  )
  brainLimit(event, 'search:' + (user?.id || getRequestIP(event)), 30)
  const semantic = body.semantic
    ? await brainSemanticSearch(event, body.query, {
        client,
        kind: body.kind,
        origin: body.origin,
        publicOnly,
      })
    : null
  const params = {
    p_query: body.query,
    p_vector: null,
    p_kind: body.kind,
    p_origin: body.origin,
    p_model: brainConfig(event).brainEmbeddingModel,
  }
  const search = (query: string) => publicOnly
    ? client.rpc('brain_hybrid_sources', { ...params, p_query: query, p_public_only: true })
    : client.rpc('brain_search_filtered', { ...params, p_query: query })
  let { data, error } =
    semantic !== null
      ? { data: semantic, error: null }
      : await search(body.query)
  brainCheck(error)
  // Keep the database's cosine-distance order; these are the actual nearest 25.
  // A sentence is an AND query in websearch_to_tsquery. If it finds nothing,
  // retrieve individual meaningful terms, retaining the same authenticated RPC/filters.
  const expanded = brainQuestionSearchQuery(body.query)
  if (semantic === null && !data?.length && expanded && expanded !== body.query) {
    const fallback = await search(expanded)
    brainCheck(fallback.error)
    data = rankBrainSources((fallback.data || []) as BrainSource[], body.query, 60)
  }
  await brainTrack(event, 'search', Boolean(user))
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
        .in('origin', publicOnly ? ['official', 'editorial'] : ['official', 'editorial', 'community', 'unverified'])
    : { data: [] }
  return {
    records: data,
    relations: relations || [],
    claims: claims || [],
    mode: semantic !== null ? 'vector' : 'keyword',
    semanticNote:
      body.semantic && body.query.trim() && semantic === null
        ? 'Pomenska storitev ni na voljo; prikazani so zadetki po besedah.'
        : 'Podobnost ni ocena resničnosti.',
  }
})
