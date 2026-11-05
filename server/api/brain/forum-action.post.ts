import { z } from 'zod'
import { forumContext, forumThread } from '../../utils/brain-forum'
import { forumPublicationText, validateForumSummary } from '../../utils/brain-forum-policy'
import { redactBrainShare } from '../../../utils/brainShare'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const context = await forumContext(event)
  const body = await brainBody(
    event,
    z
      .object({
        thread: z.uuid(),
        action: z.enum([
          'follow',
          'unfollow',
          'seen',
          'accept',
          'hide-thread',
          'restore-thread',
          'hide-post',
          'restore-post',
          'edit-post',
          'edit-thread',
          'publish',
          'unpublish',
        ]),
        post: z.uuid().optional(),
        text: z.string().trim().min(10).max(5000).optional(),
        revision: z.number().int().optional(),
        consent: z.literal(true).optional(),
      })
      .strict(),
  )
  brainLimit(event, 'forum-action:' + context.user.id, 40)
  const thread = await forumThread(context, body.thread)
  const owner = thread.user_id === context.user.id
  const denied = () => {
    throw createError({ statusCode: 403, statusMessage: 'Tega prispevka ne moreš spreminjati.' })
  }
  const changed = () => {
    throw createError({
      statusCode: 409,
      statusMessage: 'Tema se je spremenila. Osveži jo in poskusi znova.',
    })
  }
  if (['follow', 'unfollow', 'seen'].includes(body.action)) {
    if (body.action === 'unfollow')
      brainCheck(
        (
          await context.service
            .from('brain_forum_follows')
            .delete()
            .eq('thread_id', thread.id)
            .eq('user_id', context.user.id)
        ).error,
      )
    else if (body.action === 'seen')
      brainCheck(
        (
          await context.service
            .from('brain_forum_follows')
            .update({ seen_revision: Math.min(body.revision || thread.revision, thread.revision) })
            .eq('thread_id', thread.id)
            .eq('user_id', context.user.id)
        ).error,
      )
    else
      brainCheck(
        (
          await context.service
            .from('brain_forum_follows')
            .upsert({
              thread_id: thread.id,
              user_id: context.user.id,
              seen_revision: thread.revision,
            })
        ).error,
      )
  } else if (['hide-post', 'restore-post', 'edit-post', 'accept'].includes(body.action)) {
    const { data: post, error } = await context.service
      .from('brain_forum_posts')
      .select('*')
      .eq('id', body.post || '')
      .eq('thread_id', thread.id)
      .maybeSingle()
    brainCheck(error)
    if (!post) throw createError({ statusCode: 404, statusMessage: 'Odgovora ni.' })
    if (body.action === 'accept') {
      if ((!owner && !context.admin) || post.hidden || thread.type !== 'question') denied()
      const result = await context.service
        .from('brain_forum_threads')
        .update({ accepted_post_id: thread.accepted_post_id === post.id ? null : post.id })
        .eq('id', thread.id)
        .eq('revision', body.revision ?? -1)
        .select('id')
      brainCheck(result.error)
      if (!result.data?.length) changed()
    } else {
      if (post.user_id !== context.user.id && !context.admin) denied()
      if (
        body.action === 'edit-post' &&
        (!body.consent || !body.text || redactBrainShare(body.text) !== body.text)
      )
        throw createError({ statusCode: 400, statusMessage: 'Potrdi objavo in odstrani kontakte.' })
      brainCheck(
        (
          await context.service
            .from('brain_forum_posts')
            .update(
              body.action === 'edit-post'
                ? { body: body.text, updated_at: new Date().toISOString() }
                : { hidden: body.action === 'hide-post', updated_at: new Date().toISOString() },
            )
            .eq('id', post.id)
        ).error,
      )
    }
  } else if (body.action === 'publish' || body.action === 'unpublish') {
    if (!context.admin) denied()
    if (body.action === 'unpublish') {
      if (thread.shared_id)
        brainCheck(
          (
            await context.service
              .from('brain_shared_conversations')
              .delete()
              .eq('id', thread.shared_id)
          ).error,
        )
    } else {
      if (
        thread.hidden ||
        thread.summary_revision !== thread.revision ||
        !thread.summary ||
        body.revision !== thread.revision
      )
        changed()
      const posts = await context.service
        .from('brain_forum_posts')
        .select('id')
        .eq('thread_id', thread.id)
        .eq('hidden', false)
      brainCheck(posts.error)
      const summary = validateForumSummary(
        thread.summary,
        (posts.data || []).map((p) => p.id),
      )
      const content = forumPublicationText(thread.title, summary, thread.id)
      if (content.length > 11000 || new TextEncoder().encode(content).length > 32000)
        throw createError({
          statusCode: 400,
          statusMessage: 'Povzetek je predolg za vključitev v znanje.',
        })
      brainCheck(
        (
          await context.service.rpc('brain_forum_publish', {
            p_thread: thread.id,
            p_revision: thread.revision,
            p_actor: context.user.id,
            p_content: content,
          })
        ).error,
      )
    }
  } else {
    if (!owner && !context.admin) denied()
    if (
      body.action === 'edit-thread' &&
      (!body.consent ||
        !body.text ||
        body.text.length < 20 ||
        redactBrainShare(body.text) !== body.text)
    )
      throw createError({
        statusCode: 400,
        statusMessage: 'Potrdi objavo, dodaj vsaj 20 znakov in odstrani kontakte.',
      })
    const result = await context.service
      .from('brain_forum_threads')
      .update(
        body.action === 'edit-thread'
          ? { body: body.text }
          : { hidden: body.action === 'hide-thread' },
      )
      .eq('id', thread.id)
      .eq('revision', body.revision ?? -1)
      .select('id')
    brainCheck(result.error)
    if (!result.data?.length) changed()
  }
  return { ok: true }
})
