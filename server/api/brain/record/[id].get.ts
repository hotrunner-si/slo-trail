import { z } from 'zod'
import type { BrainRecord } from '~/types/brain'
export default defineEventHandler(async (event): Promise<BrainRecord> => {
  const { client } = await brainIdentity(event)
  const parsed = z.uuid().safeParse(getRouterParam(event, 'id'))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Neveljaven zapis.' })
  const id = parsed.data
  const { data: entity, error } = await client
    .from('brain_entities')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  brainCheck(error)
  if (!entity) throw createError({ statusCode: 404, statusMessage: 'Zapisa ni.' })
  const [sources, relations, claims] = await Promise.all([
    client
      .from('brain_sources')
      .select('id,entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until')
      .eq('entity_id', id)
      .limit(50),
    client
      .from('brain_relations')
      .select('*')
      .or(`subject_id.eq.${id},object_id.eq.${id}`)
      .limit(100),
    client
      .from('brain_claims')
      .select('id,entity_id,statement,year,conditions,origin')
      .eq('entity_id', id)
      .eq('status', 'active')
      .limit(100),
  ])
  for (const r of [sources, relations, claims]) brainCheck(r.error)
  const ids = [...new Set((relations.data || []).flatMap((r) => [r.subject_id, r.object_id]))]
  const { data: related } = ids.length
    ? await client.from('brain_entities').select('id,title,kind').in('id', ids)
    : { data: [] }
  return {
    entity,
    sources: sources.data || [],
    relations: relations.data || [],
    claims: claims.data || [],
    related: related || [],
  } as BrainRecord
})
