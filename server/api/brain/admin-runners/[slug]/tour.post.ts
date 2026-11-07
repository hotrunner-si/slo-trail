import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { slug } = await runnerEditorAccess(event)
  const body = await brainBody(
    event,
    z
      .object({
        id: z.string().min(1).max(150),
        title: z.string().trim().min(2).max(150),
        location: z.string().trim().max(150),
        description: z.string().trim().max(1500),
        dateIso: z.union([z.literal(''), z.iso.date()]),
        distanceKm: z.number().positive().max(10000).optional(),
        elevationGain: z.number().nonnegative().max(1000000).nullable().optional(),
      })
      .strict(),
  )
  const service = brainService(event)
  const tour = await service
    .from('runner_tours')
    .select('data')
    .eq('runner_slug', slug)
    .eq('id', body.id)
    .single()
  if (tour.error || !tour.data)
    throw createError({ statusCode: 404, statusMessage: 'Tura ne obstaja.' })
  const result = await service
    .from('runner_tours')
    .update({ data: { ...tour.data.data, ...body } })
    .eq('runner_slug', slug)
    .eq('id', body.id)
    .eq('data', JSON.stringify(tour.data.data))
    .select('id')
    .maybeSingle()
  brainCheck(result.error)
  if (!result.data)
    throw createError({
      statusCode: 409,
      statusMessage: 'Tura je bila vmes spremenjena. Osveži stran.',
    })
  return { ok: true }
})
