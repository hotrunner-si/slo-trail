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
  if (error?.code === 'invalid_credentials') {
    // Auth intentionally uses the same error for a wrong password and a missing account.
    // Only a server-side lookup may distinguish them; never attempt sign-up on every failure.
    const service = brainService(event)
    for (let page = 1; ; page++) {
      const listed = await service.auth.admin.listUsers({ page, perPage: 1000 })
      if (listed.error)
        throw createError({ statusCode: 503, statusMessage: 'Prijavna storitev trenutno ni dosegljiva.' })
      if (listed.data.users.some((user) => user.email?.toLowerCase() === body.email.trim().toLowerCase()))
        break
      if (listed.data.users.length < 1000) return { firstLogin: true }
    }
  }
  if (error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Prijava ni uspela. Preveri e-pošto in geslo ter potrdi svoj e-poštni naslov.',
    })
  brainClearRecovery(event)
  return { ok: true, firstLogin: false }
})
