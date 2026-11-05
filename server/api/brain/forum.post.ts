import { forumContext, forumAuthor } from '../../utils/brain-forum'
import { forumThreadSchema } from '../../utils/brain-forum-policy'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const context = await forumContext(event)
  const body = await brainBody(event, forumThreadSchema)
  brainLimit(event, 'forum-create:' + context.user.id, 5)
  // Only catalog/entity identifiers are accepted, never arbitrary private object references.
  if (
    body.relatedKey &&
    !/^(race|distance|runner|route|tour|article|entity|source|claim|page|shared):[\p{L}\p{N}_:.%\-]+$/u.test(
      body.relatedKey,
    )
  )
    throw createError({ statusCode: 400, statusMessage: 'Izberi povezani zapis iz zbirke.' })
  const { data, error } = await context.service
    .from('brain_forum_threads')
    .insert({
      user_id: context.user.id,
      author_name: await forumAuthor(context),
      title: body.title,
      body: body.body,
      type: body.type,
      topic: body.topic,
      related_key: body.relatedKey,
      year: body.year,
      conditions: body.conditions,
    })
    .select('id')
    .single()
  brainCheck(error)
  const followed = await context.service
    .from('brain_forum_follows')
    .insert({ user_id: context.user.id, thread_id: data!.id, seen_revision: 1 })
  brainCheck(followed.error)
  return { id: data!.id }
})
