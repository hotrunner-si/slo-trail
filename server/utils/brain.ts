import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { H3Event } from 'h3'
import { z } from 'zod'
import process from 'node:process'

export function brainConfig(event: H3Event) {
  const config = useRuntimeConfig(event)
  // Resolve secrets only while serving requests, never bake them into build artifacts.
  return {
    ...config,
    supabaseSecretKey: config.supabaseSecretKey || process.env.SUPABASE_SECRET_KEY || '',
    openaiApiKey: config.openaiApiKey || process.env.OPENAI_API_KEY || '',
    geminiApiKey: config.geminiApiKey || process.env.GEMINI_API_KEY || '',
    geminiModel: config.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    brainAiModel: config.brainAiModel || process.env.BRAIN_AI_MODEL || '',
    brainEmbeddingModel: config.brainEmbeddingModel || process.env.BRAIN_EMBEDDING_MODEL || 'gemini-embedding-001',
    brainAiZeroRetention:
      config.brainAiZeroRetention || process.env.BRAIN_AI_ZERO_RETENTION === 'true',
  }
}

export function brainClient(event: H3Event) {
  const config = useRuntimeConfig(event)
  if (
    config.public.supabaseUrl !== 'https://favatadzmmqsdocrstti.supabase.co' ||
    !config.public.supabasePublishableKey
  )
    throw createError({ statusCode: 503, statusMessage: 'Povezava z Možganom ni nastavljena.' })
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  setResponseHeader(event, 'Vary', 'Cookie')
  return createServerClient(config.public.supabaseUrl, config.public.supabasePublishableKey, {
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: getRequestURL(event).protocol === 'https:',
    },
    cookies: {
      getAll: () => Object.entries(parseCookies(event)).map(([name, value]) => ({ name, value })),
      setAll: (cookies) =>
        cookies.forEach(({ name, value, options }) => setCookie(event, name, value, options)),
    },
  })
}
export function brainService(event: H3Event) {
  const config = brainConfig(event)
  if (!config.supabaseSecretKey)
    throw createError({ statusCode: 503, statusMessage: 'Strežniški dostop še ni nastavljen.' })
  return createClient(config.public.supabaseUrl, config.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
export async function brainIdentity(event: H3Event, required = true) {
  const client = brainClient(event)
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user && required)
    throw createError({ statusCode: 401, statusMessage: 'Za ta pogled se prijavi.' })
  return { client, user }
}
export function brainMutation(event: H3Event) {
  // Reject cross-site forms/fetches, including cookie-authenticated operations.
  const origin = getHeader(event, 'origin')
  if (
    !origin ||
    origin !== getRequestURL(event).origin ||
    getHeader(event, 'sec-fetch-site') === 'cross-site'
  )
    throw createError({ statusCode: 403, statusMessage: 'Zahteva mora priti s te strani.' })
}
export async function brainBody<T extends z.ZodType>(
  event: H3Event,
  schema: T,
): Promise<z.infer<T>> {
  const size = Number(getHeader(event, 'content-length') || 0)
  if (!Number.isFinite(size) || size <= 0 || size > 48_000 || getHeader(event, 'transfer-encoding'))
    throw createError({
      statusCode: 413,
      statusMessage: 'Zahteva je prevelika ali nima določene velikosti.',
    })
  let value: unknown
  try {
    value = await readBody(event)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Zahteva ni veljaven zapis.' })
  }
  const result = schema.safeParse(value)
  if (!result.success)
    throw createError({ statusCode: 400, statusMessage: 'Preveri vnesene podatke.' })
  return result.data
}
export function brainCheck(error: { message: string; code?: string } | null) {
  if (!error) return
  throw createError({
    statusCode: error.code === '23505' ? 409 : 400,
    statusMessage:
      error.code === '23505'
        ? 'Ta odgovor ali zahteva je že shranjena.'
        : 'Sprememba ni dovoljena ali podatki niso veljavni.',
  })
}
export async function brainAdmin(event: H3Event) {
  const { client, user } = await brainIdentity(event)
  const { data, error } = await client.rpc('brain_account')
  brainCheck(error)
  if (!data?.admin)
    throw createError({ statusCode: 403, statusMessage: 'Potrebuješ skrbniški dostop.' })
  return { client, user: user! }
}
// Per-process burst limit; persistent limits also protect Auth at Supabase.
const bursts = new Map<string, { n: number; until: number }>()
export function brainLimit(event: H3Event, key: string, maximum = 15) {
  const now = Date.now()
  for (const [k, v] of bursts) if (v.until < now) bursts.delete(k)
  const hit = bursts.get(key) || { n: 0, until: now + 60_000 }
  if (++hit.n > maximum)
    throw createError({ statusCode: 429, statusMessage: 'Preveč zahtev. Poskusi čez minuto.' })
  bursts.set(key, hit)
}
export async function brainTrack(event: H3Event, action: string, account: boolean) {
  // Best effort. Never log user content, provider payloads or raw errors.
  try {
    await brainService(event).rpc('brain_track', {
      p_event: action,
      p_audience: account ? 'account' : 'guest',
    })
  } catch {
    /* no content logging */
  }
}
