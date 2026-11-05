import { brainEmbeddingSettings, createBrainVector } from '../../utils/brain-embeddings'

export default defineEventHandler(async (event) => {
  const deadline = Date.now() + 30_000
  brainMutation(event)
  await brainAdmin(event)
  const config = brainConfig(event)
  const settings = brainEmbeddingSettings(config)
  if (!settings)
    throw createError({
      statusCode: 503,
      statusMessage: 'Nastavi ključ in model pomenskega iskanja.',
    })
  const service = brainService(event)
  const { data: mixed, error: mixedError } = await service
    .from('brain_sources')
    .select('id')
    .not('embedding', 'is', null)
    .neq('embedding_model', settings.identity)
    .limit(1)
  brainCheck(mixedError)
  if (mixed?.length)
    throw createError({
      statusCode: 409,
      statusMessage:
        'V zbirki je drug model vektorjev. Pred zamenjavo modela je potrebna načrtovana ponovna izdelava indeksa.',
    })
  const { data: rows, error } = await service
    .from('brain_sources')
    .select('id,title,excerpt')
    .in('origin', ['official', 'editorial'])
    .is('embedding', null)
    .limit(15)
  brainCheck(error)
  let processed = 0
  for (const row of rows || []) {
    if (Date.now() >= deadline) break
    let vector: number[]
    try {
      vector = await createBrainVector(
        settings,
        `${row.title}\n${row.excerpt}`,
        'document',
        row.title,
      )
    } catch {
      throw createError({
        statusCode: 503,
        statusMessage: 'Pomensko indeksiranje trenutno ni na voljo. Že obdelani viri so shranjeni.',
      })
    }
    const { data: updated, error } = await service
      .from('brain_sources')
      .update({ embedding: JSON.stringify(vector), embedding_model: settings.identity })
      .eq('id', row.id)
      .eq('title', row.title)
      .eq('excerpt', row.excerpt)
      .select('id')
    brainCheck(error)
    processed += updated?.length || 0
  }
  const { count } = await service
    .from('brain_sources')
    .select('id', { count: 'exact', head: true })
    .in('origin', ['official', 'editorial'])
    .is('embedding', null)
  return { processed, remaining: count || 0 }
})
