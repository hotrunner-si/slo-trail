import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client } = await brainAdmin(event)
  const body = await brainBody(
    event,
    z.object({
      kind: z.enum(['profile', 'link', 'route']),
      id: z.uuid(),
      action: z.enum(['approve', 'reject', 'publish']),
    }),
  )
  const { error } = await client.rpc('brain_moderate', {
    p_kind: body.kind,
    p_id: body.id,
    p_action: body.action,
  })
  brainCheck(error)
  return { ok: true }
})
