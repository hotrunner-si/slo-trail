import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  brainLimit(event, 'password:' + user!.id, 4)
  const body = await brainBody(
    event,
    brainPasswordPair.and(z.object({ currentPassword: z.string().max(128).optional() })),
  )
  const recovery = brainHasRecovery(event, user!.id)
  if (!recovery && !body.currentPassword)
    throw createError({
      statusCode: 400,
      statusMessage: 'Vnesi tudi trenutno geslo ali uporabi povezavo za ponastavitev.',
    })
  if (!recovery) {
    await brainVerifyCurrentPassword(event, user!, body.currentPassword!)
  }
  const { error } = await client.auth.updateUser({
    password: body.password,
    ...(!recovery ? { current_password: body.currentPassword } : {}),
  })
  if (error)
    throw createError({
      statusCode: 400,
      statusMessage:
        'Geslo ni spremenjeno. Preveri trenutno geslo. Novo geslo mora imeti vsaj 6 znakov, vsaj eno črko in eno številko.',
    })
  brainClearRecovery(event)
  // Revoke sessions after a successful reset/change; require an explicit password login.
  const { error: logoutError } = await client.auth.signOut({ scope: 'global' })
  if (logoutError)
    throw createError({
      statusCode: 503,
      statusMessage:
        'Geslo je spremenjeno, odjava vseh sej pa ni uspela. Odjavi se in se znova prijavi.',
    })
  return { ok: true }
})
