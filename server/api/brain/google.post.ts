import { z } from 'zod'

export default defineEventHandler(async (event) => {
  brainMutation(event)
  brainLimit(event, 'google:' + getRequestIP(event), 5)
  const { next } = await brainBody(event, z.object({ next: z.string().max(100).optional() }))
  const config = useRuntimeConfig(event)
  const settings = await $fetch<{ external?: { google?: boolean } }>(
    `${config.public.supabaseUrl}/auth/v1/settings`,
    { headers: { apikey: config.public.supabasePublishableKey }, timeout: 8000 },
  ).catch(() => null)
  if (!settings?.external?.google)
    throw createError({
      statusCode: 503,
      statusMessage: 'Google prijava trenutno ni na voljo. Uporabi e-pošto in geslo.',
    })
  const redirect = new URL('/profil', getRequestURL(event).origin)
  if (next && ['/mozgan/baza', '/mozgan/analitika', '/mozgan/skrbnik', '/runners/nov'].includes(next))
    redirect.searchParams.set('next', next)
  const { data, error } = await brainClient(event).auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirect.toString(), skipBrowserRedirect: true },
  })
  if (error || !data.url)
    throw createError({ statusCode: 503, statusMessage: 'Google prijava ni uspela. Poskusi pozneje.' })
  brainClearRecovery(event)
  return { url: data.url }
})
