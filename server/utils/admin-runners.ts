import { z } from 'zod'
import type { H3Event } from 'h3'

const httpsUrl = z.union([
  z.literal(''),
  z
    .url()
    .max(500)
    .refine((v) => v.startsWith('https://')),
])
export const adminRunnerFields = z
  .object({
    name: z.string().trim().min(2).max(100),
    location: z.string().trim().max(100),
    club: z.string().trim().max(100),
    favouriteDistance: z.string().trim().max(100),
    bio: z.string().trim().max(1500),
    longDescription: z.string().trim().max(5000),
    quote: z.string().trim().max(500),
    stravaUrl: httpsUrl,
    utmbUrl: httpsUrl,
    websiteUrl: httpsUrl,
  })
  .strict()
export const adminRunnerSlug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(120)
export function adminRunnerParam(event: H3Event) {
  const parsed = adminRunnerSlug.safeParse(getRouterParam(event, 'slug'))
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Neveljaven naslov profila.' })
  return parsed.data
}
export async function adminRunnerRecord(event: H3Event, slug: string) {
  const result = await brainService(event)
    .from('runners')
    .select('slug,data,updated_at')
    .eq('slug', slug)
    .single()
  if (result.error || !result.data)
    throw createError({ statusCode: 404, statusMessage: 'Tekaški profil ne obstaja.' })
  return result.data
}
