import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  brainLimit(event, 'email:' + user!.id, 4)
  const body = await brainBody(
    event,
    z.object({ email: z.email().max(254), currentPassword: z.string().min(1).max(128) }),
  )
  if (body.email.toLowerCase() === user!.email?.toLowerCase())
    throw createError({ statusCode: 400, statusMessage: 'Vnesi drug e-poštni naslov.' })
  await brainVerifyCurrentPassword(event, user!, body.currentPassword)
  const { data, error } = await client.auth.updateUser(
    { email: body.email },
    {
      emailRedirectTo: `${getRequestURL(event).origin}/mozgan/racun`,
    },
  )
  if (error)
    throw createError({
      statusCode: error.status === 429 ? 429 : 400,
      statusMessage:
        error.status === 429
          ? 'Preveč poskusov. Počakaj nekaj minut in poskusi znova.'
          : 'Sprememba e-pošte ni uspela. Preveri naslov; če se napaka ponovi, naj skrbnik preveri pošiljanje e-pošte.',
    })
  return { ok: true, pending: data.user?.email?.toLowerCase() !== body.email.toLowerCase() }
})
