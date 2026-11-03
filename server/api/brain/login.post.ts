import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const body = await brainBody(
    event,
    z.object({ email: z.email().max(254), password: z.string().min(1).max(128) }),
  )
  brainLimit(event, 'login:' + getRequestIP(event), 4)
  const client = brainClient(event)
  const { error } = await client.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })
  if (error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Prijava ni uspela. Preveri e-pošto in geslo ter potrdi svoj e-poštni naslov.',
    })
  brainClearRecovery(event)
  return { ok: true }
})
