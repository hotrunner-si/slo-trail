import { z } from 'zod'
import { forumContext, forumPublicThread } from '../../utils/brain-forum'
export default defineEventHandler(async (event) => {
  const context = await forumContext(event)
  const parsed = z
    .object({
      query: z.string().max(300).default(''),
      topic: z.string().max(30).default('all'),
      type: z.enum(['all', 'question', 'discussion', 'source']).default('all'),
      view: z.enum(['all', 'mine', 'replies', 'following', 'unanswered', 'review']).default('all'),
      related: z.string().max(200).default(''),
      page: z.coerce.number().int().min(1).max(100000).default(1),
    })
    .safeParse(getQuery(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Neveljavno iskanje.' })
  const p = parsed.data
  const follows = await context.service
    .from('brain_forum_follows')
    .select('thread_id,seen_revision')
    .eq('user_id', context.user.id)
  brainCheck(follows.error)
  const mine = new Map((follows.data || []).map((f) => [f.thread_id, f]))
  let query = context.service.from('brain_forum_threads').select('*', { count: 'exact' })
  if (p.view === 'review') {
    if (!context.admin)
      throw createError({ statusCode: 403, statusMessage: 'Potrebuješ skrbniški dostop.' })
    query = query.eq('hidden', false).not('summary', 'is', null).is('shared_id', null)
  } else if (p.view === 'mine') query = query.eq('user_id', context.user.id)
  else query = query.eq('hidden', false)
  if (p.view === 'replies') {
    const replies = await context.service
      .from('brain_forum_posts')
      .select('thread_id')
      .eq('user_id', context.user.id)
    brainCheck(replies.error)
    const ids = [...new Set((replies.data || []).map((p) => p.thread_id))]
    query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  }
  if (p.view === 'following')
    query = query.in(
      'id',
      [...mine.keys()].length ? [...mine.keys()] : ['00000000-0000-0000-0000-000000000000'],
    )
  if (p.view === 'unanswered') query = query.eq('type', 'question').eq('reply_count', 0)
  if (p.query.trim())
    query = query.textSearch('search', p.query, { type: 'websearch', config: 'simple' })
  if (p.topic !== 'all') query = query.eq('topic', p.topic)
  if (p.type !== 'all') query = query.eq('type', p.type)
  if (p.related) query = query.eq('related_key', p.related)
  const { data, error, count } = await query
    .order('activity_at', { ascending: false })
    .order('id')
    .range((p.page - 1) * 20, p.page * 20 - 1)
  brainCheck(error)
  const unread = mine.size
    ? await context.service
        .from('brain_forum_threads')
        .select('id,revision')
        .in('id', [...mine.keys()])
        .eq('hidden', false)
    : { data: [], error: null }
  brainCheck(unread.error)
  return {
    threads: (data || []).map((r) => forumPublicThread(r, context, mine.get(r.id))),
    total: count || 0,
    unread: (unread.data || []).filter((r) => r.revision > mine.get(r.id)!.seen_revision).length,
  }
})
