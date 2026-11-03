import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { code } = await brainBody(event, z.object({ code: z.string().min(10).max(2000) }))
  const client = brainClient(event)
  let recovery = false
  const { data: listener } = client.auth.onAuthStateChange((state) => {
    if (state === 'PASSWORD_RECOVERY') recovery = true
  })
  const { data, error } = await client.auth.exchangeCodeForSession(code)
  listener.subscription.unsubscribe()
  if (error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Povezava je potekla ali je bila odprta v drugem brskalniku. Pošlji novo.',
    })
  brainClearRecovery(event)
  if (recovery && data.user) brainAllowRecovery(event, data.user.id)
  return { ok: true, recovery }
})
