export default defineEventHandler(async (event) => {
  brainMutation(event)
  await brainAdmin(event)
  const config = brainConfig(event)
  if (!config.openaiApiKey || !config.brainEmbeddingModel)
    throw createError({
      statusCode: 503,
      statusMessage: 'Nastavi ključ in model pomenskega iskanja.',
    })
  const service = brainService(event)
  const { data: mixed } = await service
    .from('brain_sources')
    .select('id')
    .not('embedding', 'is', null)
    .neq('embedding_model', config.brainEmbeddingModel)
    .limit(1)
  if (mixed?.length)
    throw createError({
      statusCode: 409,
      statusMessage:
        'V zbirki je drug model vektorjev. Pred zamenjavo modela je potrebna načrtovana ponovna izdelava indeksa.',
    })
  const { data: rows, error } = await service
    .from('brain_sources')
    .select('id,title,excerpt')
    .is('embedding', null)
    .limit(15)
  brainCheck(error)
  let processed = 0
  for (const row of rows || []) {
    const vector = await brainEmbedding(event, `${row.title}\n${row.excerpt}`)
    if (!vector) break
    const { error } = await service
      .from('brain_sources')
      .update({ embedding: JSON.stringify(vector), embedding_model: config.brainEmbeddingModel })
      .eq('id', row.id)
    brainCheck(error)
    processed++
  }
  const { count } = await service
    .from('brain_sources')
    .select('id', { count: 'exact', head: true })
    .is('embedding', null)
  return { processed, remaining: count || 0 }
})
