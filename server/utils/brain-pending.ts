import type { H3Event } from 'h3'
export async function brainProcessPending(event: H3Event, userId?: string) {
  const config = brainConfig(event)
  if (!config.openaiApiKey || !config.brainAiModel || !config.brainAiZeroRetention)
    return { processed: 0, available: false }
  const service = brainService(event)
  let query = service
    .from('brain_pending_experiences')
    .select('id,user_id,entity_id,year,conditions,summary_id')
    .eq('status', 'queued')
    .limit(1)
  if (userId) query = query.eq('user_id', userId)
  const { data: jobs } = await query
  let processed = 0
  for (const job of jobs || []) {
    const { data: summary } = await service
      .from('brain_summaries')
      .select('summary')
      .eq('id', job.summary_id)
      .single()
    const { data: entity } = await service
      .from('brain_entities')
      .select('id,title,kind')
      .eq('id', job.entity_id)
      .single()
    if (!summary || !entity) continue
    try {
      const result = await brainExtract(
        event,
        {
          humanExperience: summary.summary,
          year: job.year,
          conditions: job.conditions,
          directExperience: true,
          entities: [entity],
        },
        [entity.id],
        [],
      )
      if (
        result.clarification ||
        !result.summary ||
        !result.statement ||
        result.entityId !== entity.id ||
        result.year !== job.year ||
        result.conditions !== job.conditions ||
        !result.directExperience
      ) {
        await service
          .from('brain_pending_experiences')
          .update({ status: 'needs_clarification' })
          .eq('id', job.id)
        continue
      }
      const { error } = await service.rpc('brain_finalize_pending', {
        p_id: job.id,
        p_summary: result.summary,
        p_statement: result.statement,
      })
      if (!error) processed++
    } catch {
      /* Keep private queued summary. Never log provider/user content. */
    }
  }
  return { processed, available: true }
}
