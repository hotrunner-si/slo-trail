import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client } = await brainIdentity(event)
  const body = await brainBody(
    event,
    z.object({ file: z.uuid(), title: z.string().trim().min(2).max(150) }),
  )
  const { error } = await client.rpc('brain_route_request', {
    p_file: body.file,
    p_title: body.title,
  })
  brainCheck(error)
  return { ok: true }
})
