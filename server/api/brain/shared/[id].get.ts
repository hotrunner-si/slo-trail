import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainClient(event)
  const id = z.uuid().safeParse(getRouterParam(event, 'id'))
  if (!id.success) throw createError({ statusCode: 404, statusMessage: 'Pogovor ne obstaja.' })
  // The public projection contains only the explicitly shared snapshot, never the author's identity.
  const { data, error } = await brainService(event)
    .from('brain_shared_conversations')
    .select('id,title,content,created_at')
    .eq('id', id.data)
    .maybeSingle()
  if (error)
    throw createError({ statusCode: 503, statusMessage: 'Pogovora trenutno ni mogoče naložiti.' })
  if (!data)
    throw createError({ statusCode: 404, statusMessage: 'Pogovor ni deljen ali je bil umaknjen.' })
  return {
    id: String(data.id),
    title: String(data.title),
    content: String(data.content),
    createdAt: String(data.created_at),
  }
})
