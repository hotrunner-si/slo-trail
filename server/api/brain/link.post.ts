import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  brainLimit(event, 'runner-link:' + user!.id, 4)
  const body = await brainBody(
    event,
    z.object({ runner: adminRunnerSlug, note: z.string().min(10).max(1000).optional() }),
  )
  const { error } = await client.rpc('brain_link_request', {
    p_runner: body.runner,
    p_note:
      body.note || `Prošnja za povezavo uporabniškega računa ${user!.email} s profilom tekača.`,
  })
  if (error?.code === '23505')
    throw createError({
      statusCode: 409,
      statusMessage: 'Profil ali račun je že povezan oziroma prošnja za to povezavo že čaka na pregled.',
    })
  brainCheck(error)
  return { ok: true }
})
