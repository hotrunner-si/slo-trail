import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { user } = await brainAdmin(event)
  brainLimit(event, 'admin-runner-create:' + user.id, 10)
  const body = await brainBody(
    event,
    z.object({ slug: adminRunnerSlug, data: adminRunnerFields }).strict(),
  )
  const result = await brainService(event)
    .from('runners')
    .insert({
      slug: body.slug,
      position: 10000,
      data: { ...body.data, slug: body.slug, id: body.slug, image: '', favouriteRouteSlugs: [] },
    })
    .select('slug,data,updated_at')
    .single()
  if (result.error?.code === '23505')
    throw createError({
      statusCode: 409,
      statusMessage: 'Ta naslov profila že obstaja. Izberi drugega.',
    })
  brainCheck(result.error)
  return result.data
})
