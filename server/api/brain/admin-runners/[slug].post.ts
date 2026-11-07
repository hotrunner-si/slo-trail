import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { slug } = await runnerEditorAccess(event)
  const body = await brainBody(
    event,
    z.object({ data: adminRunnerFields, updatedAt: z.string().max(100) }).strict(),
  )
  const runner = await adminRunnerRecord(event, slug)
  const result = await brainService(event)
    .from('runners')
    .update({
      data: { ...runner.data, ...body.data },
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug)
    .eq('updated_at', body.updatedAt)
    .select('slug,data,updated_at')
    .maybeSingle()
  brainCheck(result.error)
  if (!result.data)
    throw createError({
      statusCode: 409,
      statusMessage: 'Profil je bil vmes spremenjen. Osveži ga in poskusi znova.',
    })
  return result.data
})
