import { z } from 'zod'
import { brainEmbeddingSettings, createBrainVector } from '../../utils/brain-embeddings'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  await brainAdmin(event)
  const body = await brainBody(
    event,
    z.object({
      entity: z.uuid(),
      title: z.string().trim().min(3).max(200),
      excerpt: z.string().trim().min(10).max(8000),
      url: z.url().refine((s) => /^https?:\/\//.test(s)),
      origin: z.enum(['official', 'editorial', 'unverified']),
      verified: z.iso.date().nullable(),
      from: z.iso.date().nullable(),
      until: z.iso.date().nullable(),
    }),
  )
  if (body.from && body.until && body.from > body.until)
    throw createError({ statusCode: 400, statusMessage: 'Preveri čas veljavnosti.' })
  const service = brainService(event)
  const { data: source, error } = await service
    .from('brain_sources')
    .insert({
      entity_id: body.entity,
      title: body.title,
      excerpt: body.excerpt,
      url: body.url,
      origin: body.origin,
      verified_at: body.verified,
      valid_from: body.from,
      valid_until: body.until,
    })
    .select('id')
    .single()
  brainCheck(error)
  let indexed = false
  const settings = brainEmbeddingSettings(brainConfig(event))
  if (settings && source && ['official', 'editorial'].includes(body.origin)) {
    try {
      const vector = await createBrainVector(
        settings,
        `${body.title}\n${body.excerpt}`,
        'document',
        body.title,
      )
      const updated = await service
        .from('brain_sources')
        .update({ embedding: JSON.stringify(vector), embedding_model: settings.identity })
        .eq('id', source.id)
        .eq('title', body.title)
        .eq('excerpt', body.excerpt)
        .select('id')
      indexed = !updated.error && Boolean(updated.data?.length)
    } catch {
      /* Saved source remains searchable by words and pending for batch indexing. */
    }
  }
  return { ok: true, indexed }
})
