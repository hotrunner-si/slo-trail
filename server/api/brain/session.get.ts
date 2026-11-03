import type { BrainSession, BrainAccount } from '~/types/brain'
export default defineEventHandler(async (event): Promise<BrainSession> => {
  const { client, user } = await brainIdentity(event, false)
  const config = brainConfig(event)
  let account: BrainAccount | null = null
  if (user) {
    const { data, error } = await client.rpc('brain_account')
    brainCheck(error)
    account = data as BrainAccount
    const media = await client
      .from('brain_runner_media')
      .select('id,file_id,source_path,kind,runner_slug,created_at')
      .eq('user_id', user.id)
    // Keep existing account access available during a staged schema rollout.
    if (media.error && !['42P01', 'PGRST205'].includes(media.error.code)) brainCheck(media.error)
    account.publications = media.data || []
    const { data: pending } = await brainService(event)
      .from('brain_pending_experiences')
      .select('id,status')
      .eq('user_id', user.id)
      .neq('status', 'done')
      .limit(100)
    account.pending = (pending || []).map((p) => ({ id: String(p.id), status: String(p.status) }))
  }
  return {
    user: user
      ? {
          id: user.id,
          email: user.email,
          createdAt: user.created_at,
          pendingEmail: user.new_email || null,
          displayName: brainAccountName.safeParse(user.user_metadata?.display_name).success
            ? String(user.user_metadata.display_name).trim()
            : '',
        }
      : null,
    recovery: !!user && brainHasRecovery(event, user.id),
    account,
    aiAvailable: Boolean(config.openaiApiKey && config.brainAiModel && config.brainAiZeroRetention),
    semanticAvailable: Boolean(
      config.openaiApiKey && config.brainEmbeddingModel && config.brainAiZeroRetention,
    ),
  }
})
