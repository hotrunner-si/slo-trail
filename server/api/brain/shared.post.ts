import { brainShareSchema } from '../../utils/brain-share-policy'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  const body = await brainBody(event, brainShareSchema)
  brainLimit(event, 'share:' + user!.id, 5)
  const { data, error } = await client
    .from('brain_shared_conversations')
    .insert({ user_id: user!.id, title: body.title, content: body.content })
    .select('id,title,created_at')
    .single()
  brainCheck(error)
  if (!data)
    throw createError({ statusCode: 503, statusMessage: 'Pogovora ni bilo mogoče deliti.' })
  return { id: String(data.id), title: String(data.title), createdAt: String(data.created_at) }
})
