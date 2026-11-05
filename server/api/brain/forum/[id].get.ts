import { z } from 'zod'
import { forumContext, forumDetail } from '../../../utils/brain-forum'
export default defineEventHandler(async (event) => {
  const context = await forumContext(event)
  const id = z.uuid().safeParse(getRouterParam(event, 'id'))
  if (!id.success) throw createError({ statusCode: 400, statusMessage: 'Neveljavna tema.' })
  return forumDetail(context, id.data)
})
