import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const body = await brainBody(
    event,
    brainPasswordPair.and(z.object({ email: z.email().max(254), name: brainAccountName })),
  )
  brainLimit(event, 'register:' + getRequestIP(event), 3)
  brainClearRecovery(event)
  const { data, error } = await brainClient(event).auth.signUp({
    email: body.email,
    password: body.password,
    options: {
      data: { display_name: body.name },
      emailRedirectTo: new URL('/profil', getRequestURL(event).origin).toString(),
    },
  })
  if (error) throw createError(brainRegistrationError(error))
  const welcome =
    data.session && data.user?.email ? await brainSendWelcome(data.user.email) : 'failed'
  return { signedIn: !!data.session, welcome }
})
