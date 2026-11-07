// Explicit, resumable indexing of public official/editorial sources only.
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { brainEmbeddingSettings, createBrainVector } from '../server/utils/brain-embeddings.ts'

const project = 'favatadzmmqsdocrstti'
assert.ok(process.argv.includes(`--project=${project}`) && process.argv.includes('--write'))
assert.equal(process.env.NUXT_PUBLIC_SUPABASE_URL, `https://${project}.supabase.co`)
const settings = brainEmbeddingSettings({
  geminiApiKey: process.env.GEMINI_API_KEY,
  brainEmbeddingModel: process.env.BRAIN_EMBEDDING_MODEL,
})
assert.ok(settings, 'Configure the public embedding model and server key')
const service = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const must = ({ data, error }) => {
  if (error) throw new Error('Index database operation failed')
  return data
}
const mixed = must(
  await service
    .from('brain_sources')
    .select('id')
    .not('embedding', 'is', null)
    .neq('embedding_model', settings.identity)
    .limit(1),
)
assert.equal(mixed.length, 0, 'A different embedding model requires a planned rebuild')
const rows = must(
  await service
    .from('brain_sources')
    .select('id,title,excerpt')
    .in('origin', ['official', 'editorial'])
    .is('embedding', null)
    .order('id'),
)
console.log(JSON.stringify({ pending: rows.length, model: settings.identity }))
let processed = 0
for (const row of rows) {
  let vector
  for (let attempt = 1; ; attempt++) {
    try {
      vector = await createBrainVector(
        settings,
        `${row.title}\n${row.excerpt}`,
        'document',
        row.title,
      )
      break
    } catch (error) {
      if (attempt >= 6 || ![0, 408, 429, 500, 502, 503, 504].includes(error.statusCode || 0))
        throw error
      // Minute quotas need a real cooldown; a 1–3 second retry storm cannot recover.
      const delay = error.statusCode === 429 ? Math.min(60000, 15000 * attempt) : 1000 * attempt
      console.log(JSON.stringify({ retrying: true, status: error.statusCode || 0, delayMs: delay }))
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  const updated = must(
    await service
      .from('brain_sources')
      .update({ embedding: JSON.stringify(vector), embedding_model: settings.identity })
      .eq('id', row.id)
      .eq('title', row.title)
      .eq('excerpt', row.excerpt)
      .select('id'),
  )
  processed += updated.length
  if (processed % 15 === 0)
    console.log(JSON.stringify({ processed, pending: rows.length - processed }))
  await new Promise((resolve) => setTimeout(resolve, 1100))
}
console.log(JSON.stringify({ processed, completed: true }))
