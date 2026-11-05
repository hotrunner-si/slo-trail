import { forumContext, forumThread, forumAuthor } from '../../utils/brain-forum'
import { forumPostSchema } from '../../utils/brain-forum-policy'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const context = await forumContext(event)
  const body = await brainBody(event, forumPostSchema)
  brainLimit(event, 'forum-reply:' + context.user.id, 15)
  const thread = await forumThread(context, body.thread)
  if (thread.hidden) throw createError({ statusCode: 409, statusMessage: 'Tema je umaknjena.' })
  const { data, error } = await context.service
    .from('brain_forum_posts')
    .insert({
      thread_id: body.thread,
      user_id: context.user.id,
      author_name: await forumAuthor(context),
      body: body.body,
    })
    .select('id')
    .single()
  brainCheck(error)
  return { id: data!.id }
})
