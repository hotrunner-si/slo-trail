import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  const body = await brainBody(event, z.object({ id: z.uuid() }))
  brainLimit(event, 'withdraw:' + user!.id, 10)
  const { data, error } = await client
    .from('brain_shared_conversations')
    .delete()
    .eq('id', body.id)
    .eq('user_id', user!.id)
    .select('id')
    .maybeSingle()
  brainCheck(error)
  if (!data)
    throw createError({ statusCode: 404, statusMessage: 'Deljenega pogovora ni mogoče najti.' })
  return { removed: true }
})
