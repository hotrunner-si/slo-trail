import { cleanupPublicMedia } from '../../utils/public-media'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client } = await brainIdentity(event)
  brainCheck((await client.rpc('brain_unlink_runner')).error)
  await cleanupPublicMedia(event)
  return { ok: true }
})
