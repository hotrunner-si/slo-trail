import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client } = await brainIdentity(event)
  const body = await brainBody(
    event,
    z.object({ runner: z.string().max(150), note: z.string().min(10).max(1000) }),
  )
  const { error } = await client.rpc('brain_link_request', {
    p_runner: body.runner,
    p_note: body.note,
  })
  brainCheck(error)
  return { ok: true }
})
