// Public questions only; no account creation, writes or transcript persistence.
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { brainEmbeddingSettings, createBrainVector } from '../server/utils/brain-embeddings.ts'
import { brainChatRetrievalQuery } from '../utils/brainChat.ts'
const origin =
  process.argv.find((v) => v.startsWith('--origin='))?.slice(9) || 'http://localhost:3000'
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/)
const settings = brainEmbeddingSettings({
  geminiApiKey: process.env.GEMINI_API_KEY,
  brainEmbeddingModel: process.env.BRAIN_EMBEDDING_MODEL,
})
assert.ok(settings)
const service = createClient(process.env.NUXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)
const question =
  'Ali ima Triglav Trail Run 101 km točno 6200 višincev ali je to približna vrednost?'
const vector = await createBrainVector(settings, question, 'query')
const nearest = await service.rpc('brain_nearest_sources', {
  p_vector: JSON.stringify(vector),
  p_model: settings.identity,
  p_public_only: true,
})
assert.ifError(nearest.error)
assert.equal(nearest.data.length, 25)
assert.ok(
  nearest.data.some(
    (s) => /triglav/i.test(s.title) && /101/.test(s.title) && /6200/.test(s.excerpt),
  ),
)
for (let i = 1; i < nearest.data.length; i++)
  assert.ok(nearest.data[i - 1].similarity >= nearest.data[i].similarity)
console.log('PASS nearest 25 in cosine order include Triglav 101K elevation source')
if (process.argv.includes('--retrieval-only')) {
  const context = brainChatRetrievalQuery([
    { role: 'user', text: question },
    { role: 'assistant', text: 'V zbirki je navedenih 101 km in 6200 m vzpona.' },
    { role: 'user', text: 'In koliko je dolga ta razdalja?' },
  ])
  const followVector = await createBrainVector(settings, context, 'query')
  const result = await service.rpc('brain_nearest_sources', {
    p_vector: JSON.stringify(followVector),
    p_model: settings.identity,
    p_public_only: true,
  })
  assert.ifError(result.error)
  assert.equal(result.data.length, 25)
  assert.ok(result.data.some((s) => /triglav/i.test(s.title) && /101/.test(s.title)))
  console.log('PASS contextual vector retrieval resolves the follow-up to Triglav 101K')
  process.exit(0)
}
const messages = []
async function chat(text) {
  messages.push({ role: 'user', text })
  const response = await fetch(origin + '/api/brain/chat', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, save: false }),
    signal: AbortSignal.timeout(55000),
  })
  const result = await response.json()
  assert.equal(response.status, 200, result.statusMessage || 'Chat failed')
  messages.push({ role: 'assistant', text: result.answer })
  console.log(
    JSON.stringify({
      mode: result.mode,
      answer: result.answer,
      sources: result.citations.map((s) => s.title),
    }),
  )
  return result
}
const first = await chat(question)
assert.equal(first.mode, 'database')
assert.match(first.answer, /6[.\s]?200/)
assert.match(first.answer, /približ|okvir|natanč|točn/i)
assert.ok(first.citations.some((s) => /triglav/i.test(s.title)))
console.log(
  'PASS evidence-based answer distinguishes a stated elevation from measurement precision',
)
const followup = await chat('In koliko je dolga ta razdalja?')
assert.match(followup.answer, /101/)
assert.ok(followup.citations.some((s) => /triglav/i.test(s.title)))
console.log('PASS follow-up resolves the race and distance from conversation context')
