import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { email } = await brainBody(event, z.object({ email: z.email().max(254) }))
  brainLimit(event, 'recover:' + getRequestIP(event), 3)
  brainClearRecovery(event)
  const { error } = await brainClient(event).auth.resetPasswordForEmail(email, {
    redirectTo: `${getRequestURL(event).origin}/mozgan/racun`,
  })
  // Do not disclose whether an address has an account. Infrastructure failures stay explicit.
  if (error && !['user_not_found', 'email_not_found'].includes(error.code || ''))
    throw createError({
      statusCode: 503,
      statusMessage:
        'Pošiljanje trenutno ni uspelo. Poskusi pozneje; skrbnik naj preveri nastavitve pošiljanja.',
    })
  return { ok: true }
})
