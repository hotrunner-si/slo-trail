import type { H3Event } from 'h3'
import type { CommunityThread, CommunityDetail } from '../../types/knowledge'

export async function forumContext(event: H3Event) {
  const { user } = await brainIdentity(event)
  const service = brainService(event)
  const { data, error } = await service
    .from('brain_admins')
    .select('user_id')
    .eq('user_id', user!.id)
    .maybeSingle()
  brainCheck(error)
  return { user: user!, service, admin: Boolean(data) }
}
export type ForumContext = Awaited<ReturnType<typeof forumContext>>
export async function forumThread(context: ForumContext, id: string) {
  const { data, error } = await context.service
    .from('brain_forum_threads')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  brainCheck(error)
  if (!data || (data.hidden && !context.admin && data.user_id !== context.user.id))
    throw createError({ statusCode: 404, statusMessage: 'Teme ni ali je bila umaknjena.' })
  return data
}
export function forumPublicThread(row: any, context: ForumContext, follow?: any): CommunityThread {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    topic: row.topic,
    related_key: row.related_key,
    year: row.year,
    conditions: row.conditions,
    author_name: row.author_name,
    created_at: row.created_at,
    activity_at: row.activity_at,
    revision: row.revision,
    reply_count: row.reply_count,
    accepted_post_id: row.accepted_post_id,
    hidden: row.hidden,
    mine: row.user_id === context.user.id,
    following: Boolean(follow),
    unread: Boolean(follow && follow.seen_revision < row.revision),
    published: Boolean(row.shared_id),
  }
}
export async function forumDetail(context: ForumContext, id: string): Promise<CommunityDetail> {
  const row = await forumThread(context, id)
  const [posts, follows] = await Promise.all([
    context.service
      .from('brain_forum_posts')
      .select('*')
      .eq('thread_id', id)
      .order('created_at')
      .order('id'),
    context.service
      .from('brain_forum_follows')
      .select('seen_revision')
      .eq('thread_id', id)
      .eq('user_id', context.user.id)
      .maybeSingle(),
  ])
  brainCheck(posts.error)
  brainCheck(follows.error)
  const stale = row.summary_revision !== row.revision
  return {
    thread: forumPublicThread(row, context, follows.data),
    posts: (posts.data || [])
      .filter((p) => !p.hidden || context.admin || p.user_id === context.user.id)
      .map((p) => ({
        id: p.id,
        body: p.body,
        author_name: p.author_name,
        created_at: p.created_at,
        updated_at: p.updated_at,
        mine: p.user_id === context.user.id,
        hidden: p.hidden,
      })),
    summary: stale ? null : row.summary,
    summaryAt: row.summary_at,
    summaryStale: Boolean(row.summary && stale),
  }
}
export async function forumAuthor(context: ForumContext) {
  const { data } = await context.service
    .from('brain_profiles')
    .select('display_name')
    .eq('user_id', context.user.id)
    .maybeSingle()
  // Use only the public display name; never fall back to email or an Auth identifier.
  const { redactBrainShare } = await import('../../utils/brainShare')
  return (
    redactBrainShare(
      data?.display_name || context.user.user_metadata?.display_name || 'Član skupnosti',
    ).slice(0, 80) || 'Član skupnosti'
  )
}
