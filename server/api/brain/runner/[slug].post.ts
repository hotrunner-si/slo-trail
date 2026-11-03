import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  brainLimit(event, 'runner-edit:' + user!.id, 8)
  const slug = getRouterParam(event, 'slug') || ''
  if (!/^[a-z0-9-]{1,120}$/.test(slug))
    throw createError({ statusCode: 400, statusMessage: 'Profil ni veljaven.' })
  const body = await brainBody(
    event,
    z
      .object({
        name: z.string().trim().min(2).max(100),
        location: z.string().trim().max(100),
        club: z.string().trim().max(100),
        favouriteDistance: z.string().trim().max(100),
        bio: z.string().trim().max(1500),
        longDescription: z.string().trim().max(5000),
        quote: z.string().trim().max(500),
        stravaUrl: z.union([
          z.literal(''),
          z
            .url()
            .max(500)
            .refine((v) => v.startsWith('https://')),
        ]),
        utmbUrl: z
          .union([
            z.literal(''),
            z
              .url()
              .max(500)
              .refine((v) => v.startsWith('https://')),
          ])
          .optional(),
        websiteUrl: z
          .union([
            z.literal(''),
            z
              .url()
              .max(500)
              .refine((v) => v.startsWith('https://')),
          ])
          .optional(),
      })
      .strict(),
  )
  const { data, error } = await client.rpc('brain_runner_edit', { p_slug: slug, p_data: body })
  if (error)
    throw createError({
      statusCode: 403,
      statusMessage:
        'Urejanje tega profila ni dovoljeno ali podatki niso veljavni. Potrebuješ potrjeno povezavo s tem tekačem.',
    })
  return { runner: data }
})
