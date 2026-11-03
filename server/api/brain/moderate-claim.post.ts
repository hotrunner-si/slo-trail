import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client } = await brainAdmin(event)
  const body = await brainBody(event, z.object({ id: z.uuid(), hidden: z.boolean() }))
  const { error } = await client.rpc('brain_moderate_claim', {
    p_id: body.id,
    p_hidden: body.hidden,
  })
  brainCheck(error)
  return { ok: true }
})
