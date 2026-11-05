// Local-only regression: disposable account, no mail, no stored conversations.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { brainEmbeddingSettings, createBrainVector } from '../server/utils/brain-embeddings.ts'

const project = 'favatadzmmqsdocrstti'
const origin = process.env.BRAIN_TEST_ORIGIN || 'http://localhost:3000'
const semantic = process.argv.includes('--semantic')
assert.ok(process.argv.includes(`--project=${project}`))
assert.ok(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))
assert.equal(process.env.NUXT_PUBLIC_SUPABASE_URL, `https://${project}.supabase.co`)
const service = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
)
const must = ({ data, error }) => {
  if (error) throw new Error('Disposable test setup failed')
  return data
}
const email = `brain-question-${randomUUID()}@example.invalid`
const user = must(
  await service.auth.admin.createUser({
    email,
    email_confirm: true,
    password: randomUUID() + 'aA9!',
  }),
).user
let session
try {
  const cookies = []
  const client = createServerClient(
    process.env.NUXT_PUBLIC_SUPABASE_URL,
    process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: { getAll: () => [], setAll: (values) => cookies.push(...values) },
    },
  )
  const link = must(await service.auth.admin.generateLink({ type: 'magiclink', email }))
  session = must(
    await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'email' }),
  ).session
  const question = 'koliko tekačev se bo udeležilo teka go4trail to leto'
  const post = async (path, body) => {
    const response = await fetch(origin + path, {
      method: 'POST',
      headers: {
        origin,
        'content-type': 'application/json',
        cookie: cookies.map((c) => `${c.name}=${c.value}`).join('; '),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(150_000),
    })
    const data = await response.json()
    assert.equal(response.status, 200, data.statusMessage || 'Request failed')
    return data
  }
  const search = await post('/api/brain/search', {
    query: question,
    semantic,
    kind: '',
    origin: '',
  })
  assert.ok(search.records.some((s) => s.title.includes('GO4Trail') && s.excerpt.includes('550')))
  if (semantic) {
    assert.equal(search.mode, 'hybrid')
    assert.ok(search.records.some((s) => typeof s.similarity === 'number'))
    assert.ok(search.records[0].excerpt.includes('550'))
    const settings = brainEmbeddingSettings({
      geminiApiKey: process.env.GEMINI_API_KEY,
      brainEmbeddingModel: process.env.BRAIN_EMBEDDING_MODEL,
    })
    const vector = await createBrainVector(settings, 'Ali potrebujem lučko pri GO3V?', 'query')
    const vectorOnly = must(
      await service.rpc('brain_hybrid_sources', {
        p_query: '',
        p_vector: JSON.stringify(vector),
        p_model: settings.identity,
      }),
    )
    assert.ok(
      vectorOnly.slice(0, 5).some((s) => s.title.includes('GO3V') && s.title.includes('oprema')),
    )
    console.log(JSON.stringify({ check: 'vector-only-no-keywords', first: vectorOnly[0]?.title }))
    const questions = [
      ['Kje in kdaj lahko dvignem številko za obalnih 108 kilometrov?', 'prevzem'],
      ['Ali potrebujem lučko pri GO3V?', 'oprema'],
      ['Koliko časa imam za 35 kilometrov na Obali?', 'limiti'],
    ]
    for (const [query, expected] of questions) {
      const result = await post('/api/brain/search', {
        query,
        semantic: true,
        kind: '',
        origin: 'official',
      })
      assert.equal(result.mode, 'hybrid')
      assert.ok(
        result.records.slice(0, 5).some((s) => s.title.toLowerCase().includes(expected)),
        `Missing semantic evidence: ${expected}`,
      )
      assert.ok(result.records.every((s) => s.origin === 'official'))
      console.log(
        JSON.stringify({ check: 'semantic-paraphrase', expected, first: result.records[0]?.title }),
      )
    }
    const anon = createClient(
      process.env.NUXT_PUBLIC_SUPABASE_URL,
      process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: false } },
    )
    const denied = await anon.rpc('brain_hybrid_sources', {
      p_query: 'test',
      p_vector: null,
      p_model: 'test',
    })
    assert.ok(denied.error, 'Anonymous direct access must be denied')
  }
  console.log(
    JSON.stringify({
      check: 'question-search',
      records: search.records.length,
      first: search.records[0]?.title,
    }),
  )
  for (let i = 0; i < (semantic ? 1 : 3); i++) {
    const result = await post('/api/brain/chat', {
      messages: [{ role: 'user', text: question }],
      save: false,
    })
    assert.ok(result.answer.includes('550'))
    assert.equal(result.mode, 'database')
    assert.ok(result.citations.some((s) => s.excerpt.includes('550')))
    if (semantic) assert.ok(result.citations.some((s) => typeof s.similarity === 'number'))
    console.log(JSON.stringify({ check: 'chat', attempt: i + 1, mode: result.mode, cited: true }))
  }
} finally {
  if (session) await service.auth.admin.signOut(session.access_token)
  const cleanup = await service.auth.admin.deleteUser(user.id)
  assert.ok(!cleanup.error, 'Disposable account cleanup failed')
  console.log('Disposable test account removed.')
}
