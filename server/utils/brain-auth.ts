import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { validAccountPassword } from '../../utils/account-password'
import { createClient, type User } from '@supabase/supabase-js'

export async function brainVerifyCurrentPassword(event: H3Event, user: User, password: string) {
  const config = useRuntimeConfig(event)
  const verifier = createClient(config.public.supabaseUrl, config.public.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const checked = await verifier.auth.signInWithPassword({ email: user.email!, password })
  if (checked.error || checked.data.user?.id !== user.id)
    throw createError({ statusCode: 400, statusMessage: 'Trenutno geslo ni pravilno.' })
  await verifier.auth.signOut({ scope: 'local' })
}

export const brainPassword = z.string().min(6).max(128).refine(validAccountPassword)
export const brainPasswordPair = z
  .object({
    password: brainPassword,
    repeatPassword: brainPassword,
  })
  .refine((v) => v.password === v.repeatPassword)

const recoveryCookie = 'brain-recovery'
export function brainClearRecovery(event: H3Event) {
  deleteCookie(event, recoveryCookie, { path: '/api/brain' })
}
function signature(event: H3Event, value: string) {
  const key = brainConfig(event).supabaseSecretKey
  if (!key)
    throw createError({ statusCode: 503, statusMessage: 'Obnovitev računa še ni nastavljena.' })
  return createHmac('sha256', key).update(value).digest('hex')
}
export function brainAllowRecovery(event: H3Event, userId: string) {
  const value = `${userId}:${Date.now() + 10 * 60_000}`
  setCookie(event, recoveryCookie, `${value}:${signature(event, value)}`, {
    path: '/api/brain',
    httpOnly: true,
    sameSite: 'strict',
    secure: getRequestURL(event).protocol === 'https:',
    maxAge: 600,
  })
}
export function brainHasRecovery(event: H3Event, userId: string) {
  const parts = (getCookie(event, recoveryCookie) || '').split(':')
  if (parts.length !== 3 || parts[0] !== userId || Number(parts[1]) <= Date.now()) return false
  const expected = Buffer.from(signature(event, `${parts[0]}:${parts[1]}`))
  const actual = Buffer.from(parts[2]!)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
