import { z } from 'zod'
import { cleanupPublicMedia } from '../../utils/public-media'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client } = await brainIdentity(event)
  const body = await brainBody(event, z.object({ id: z.uuid() }))
  brainCheck((await client.rpc('brain_remove_runner_media', { p_id: body.id })).error)
  await cleanupPublicMedia(event)
  return { ok: true }
})
