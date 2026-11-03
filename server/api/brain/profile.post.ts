import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client } = await brainIdentity(event)
  const body = await brainBody(
    event,
    z.object({
      name: z.string().trim().min(2).max(100),
      bio: z.string().max(1500),
      region: z.string().max(100),
    }),
  )
  const { error } = await client.rpc('brain_profile_save', {
    p_name: body.name,
    p_bio: body.bio,
    p_region: body.region,
  })
  brainCheck(error)
  return { ok: true }
})
