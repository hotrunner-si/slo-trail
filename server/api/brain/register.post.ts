import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const body = await brainBody(
    event,
    brainPasswordPair.and(z.object({ email: z.email().max(254), name: brainAccountName })),
  )
  brainLimit(event, 'register:' + getRequestIP(event), 3)
  brainClearRecovery(event)
  const config = useRuntimeConfig(event)
  let settings: { mailer_autoconfirm?: boolean }
  try {
    settings = await $fetch<{ mailer_autoconfirm?: boolean }>(
      `${config.public.supabaseUrl}/auth/v1/settings`,
      {
        headers: { apikey: config.public.supabasePublishableKey },
        timeout: 8000,
      },
    )
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Prijavna storitev trenutno ni dosegljiva. Poskusi pozneje.',
    })
  }
  // Avoid sending an unwanted confirmation email while external configuration is pending.
  if (settings.mailer_autoconfirm !== true)
    throw createError({
      statusCode: 503,
      statusMessage:
        'Registracija brez potrditvene povezave še ni vključena. Skrbnik naj v Supabase izklopi Confirm email.',
    })
  const { data, error } = await brainClient(event).auth.signUp({
    email: body.email,
    password: body.password,
    options: { data: { display_name: body.name } },
  })
  if (error) throw createError(brainRegistrationError(error))
  const welcome =
    data.session && data.user?.email ? await brainSendWelcome(data.user.email) : 'failed'
  return { signedIn: !!data.session, welcome }
})
