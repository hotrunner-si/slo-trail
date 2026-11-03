import { z } from 'zod'
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
  const { error } = await brainService(event)
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
  brainCheck(error)
  return { ok: true }
})
