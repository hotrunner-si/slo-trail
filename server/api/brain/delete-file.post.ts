import { z } from 'zod'
import { cleanupPublicMedia } from '../../utils/public-media'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client } = await brainIdentity(event)
  const body = await brainBody(event, z.object({ id: z.uuid(), expected: z.string().max(250) }))
  brainCheck(
    (await client.rpc('brain_delete_file', { p_id: body.id, p_expected: body.expected })).error,
  )
  await brainCleanupFiles(event)
  await cleanupPublicMedia(event)
  return { ok: true }
})
