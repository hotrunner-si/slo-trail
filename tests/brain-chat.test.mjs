import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  brainChatBodySchema,
  validateBrainChatAnswer,
  validateBrainChatDecision,
  isSafeBrainSearchQuery,
} from '../server/utils/brain-chat-policy.ts'
import { parseBrainGrounding } from '../server/utils/brain-grounding.ts'
import { pickBrainPrompts } from '../server/utils/brain-prompts.ts'
import { brainChatHistory } from '../utils/brainChat.ts'
import {
  brainCatalogSources,
  brainKnowledge,
  brainKnowledgeWords,
  brainQuestionSearchQuery,
  rankBrainSources,
  rankBrainHybridSources,
} from '../server/utils/brain-knowledge.ts'
import {
  brainEmbeddingSettings,
  createBrainVector,
  normalizeBrainVector,
} from '../server/utils/brain-embeddings.ts'

test('retrieval uses normalized 1536-dimensional document/query vectors with one model identity', async () => {
  const settings = brainEmbeddingSettings({ geminiApiKey: 'test-key' })
  assert.ok(settings.identity.includes('1536'))
  assert.equal(brainEmbeddingSettings({}), null)
  assert.equal(brainEmbeddingSettings({ geminiApiKey: 'test', brainEmbeddingModel: 'other' }), null)
  const bodies = []
  const request = async (_url, options) => {
    bodies.push(JSON.parse(options.body))
    return new Response(JSON.stringify({ embedding: { values: [3, 4, ...Array(1534).fill(0)] } }))
  }
  const document = await createBrainVector(settings, 'Public source', 'document', 'Title', request)
  const query = await createBrainVector(settings, 'Question', 'query', undefined, request)
  assert.equal(document.length, 1536)
  assert.ok(Math.abs(Math.hypot(...document) - 1) < 1e-10)
  assert.equal(bodies[0].taskType, 'RETRIEVAL_DOCUMENT')
  assert.equal(bodies[0].title, 'Title')
  assert.equal(bodies[1].taskType, 'RETRIEVAL_QUERY')
  assert.ok(!('title' in bodies[1]))
  assert.equal(bodies[1].outputDimensionality, 1536)
  assert.deepEqual(query, document)
  assert.throws(() => normalizeBrainVector([1, 2]))
  assert.throws(() => normalizeBrainVector(Array(1536).fill(0)))
  assert.throws(() => normalizeBrainVector(Array(1536).fill(NaN)))
})

test('hybrid ranking retains matches with no shared words and favors the requested historical year', () => {
  const sources = [
    {
      id: 'semantic',
      title: 'Obvezna oprema',
      excerpt: 'Čelna svetilka z rezervno baterijo.',
      similarity: 0.91,
    },
    { id: 'keyword', title: 'Lučka za tek', excerpt: 'Drug opis.', similarity: 0.42 },
  ]
  assert.equal(rankBrainHybridSources(sources, 'Potrebujem lučko?', 2)[0].id, 'semantic')
  assert.equal(rankBrainSources(sources.slice(0, 1), 'Potrebujem lučko?', 2).length, 0)
  const editions = [
    { id: 'new', title: 'GO4Trail 2026 oprema', excerpt: 'Za leto 2026.', similarity: 0.95 },
    { id: 'old', title: 'GO4Trail 2025 oprema', excerpt: 'Za leto 2025.', similarity: 0.75 },
  ]
  assert.equal(rankBrainHybridSources(editions, 'GO4Trail oprema 2025')[0].id, 'old')
})
import {
  brainChatRequest,
  brainChatSourceFallback,
  brainChatTimeout,
} from '../server/utils/brain-chat-request.ts'

test('chat calls share a deadline instead of restarting the hosting timeout on retries', () => {
  const deadline = 45_000
  assert.equal(brainChatTimeout(deadline, 0), 20_000)
  assert.equal(brainChatTimeout(deadline, 30_000), 15_000)
  assert.equal(brainChatTimeout(deadline, 43_000), 2_000)
  assert.throws(() => brainChatTimeout(deadline, 44_500), { statusCode: 503 })
})

test('unavailable chat shows stored evidence with citations, excluding discussions and private/unverified material', () => {
  const sources = [
    {
      id: 'discussion',
      origin: 'conversation',
      verified_at: '2026-11-05',
      url: 'https://example.org',
      excerpt: 'WRONG',
    },
    {
      id: 'private',
      origin: 'unverified',
      verified_at: '2026-11-05',
      url: 'https://example.org',
      excerpt: 'PRIVATE',
    },
    {
      id: 'real',
      origin: 'official',
      verified_at: '2026-11-05',
      url: 'https://go4trail.si/',
      title: 'GO4Trail 2026',
      excerpt: 'Prijavljenih je 550 tekačev. Podatek ni končno število štartajočih.',
    },
  ]
  const result = brainChatSourceFallback(sources)
  assert.ok(result.answer.includes('550'))
  assert.ok(result.answer.includes('ne more sestaviti odgovora'))
  assert.ok(result.answer.includes('ni končno'))
  assert.ok(!result.answer.includes('WRONG') && !result.answer.includes('PRIVATE'))
  assert.equal(result.citations[0].id, 'real')
  assert.equal(brainChatSourceFallback(sources.slice(0, 2)), null)
})

test('question fallback preserves Slovenian accents and finds the race without requiring every word', () => {
  const query = brainQuestionSearchQuery('koliko tekačev se bo udeležilo teka go4trail to leto')
  assert.ok(query.includes('tekačev OR'))
  assert.ok(query.includes('go4trail'))
  assert.ok(!query.includes('koliko'))
  assert.ok(brainQuestionSearchQuery('tekačev '.repeat(40)).length <= 300)
  assert.ok(
    brainQuestionSearchQuery(Array.from({ length: 30 }, (_, i) => 'beseda'.repeat(4) + i).join(' '))
      .length <= 300,
  )
})

test('chat recovers from a transient upstream error, but never retries quota or authorization failures', async () => {
  let calls = 0
  const failures = []
  const result = await brainChatRequest(
    async () => {
      if (++calls === 1) throw { response: { status: 503 } }
      return 'recovered'
    },
    (...args) => failures.push(args),
    async () => {},
  )
  assert.equal(result, 'recovered')
  assert.equal(calls, 2)
  assert.deepEqual(failures, [[503, 1]])
  for (const status of [400, 401, 403, 429, 503, 0]) {
    let attempts = 0
    await assert.rejects(
      brainChatRequest(
        async () => {
          attempts++
          throw Object.assign(new Error('upstream'), { statusCode: status })
        },
        () => {},
        async () => {},
      ),
    )
    assert.equal(attempts, [503, 0].includes(status) ? 2 : 1)
  }
})

test('general answers require no trail citation, while invented source IDs are rejected', () => {
  assert.equal(validateBrainChatAnswer({ answer: 'Pariz.', citations: [] }, []).answer, 'Pariz.')
  assert.throws(() =>
    validateBrainChatAnswer({ answer: 'Odgovor', citations: ['invented'] }, ['real']),
  )
  assert.throws(() =>
    validateBrainChatAnswer({ answer: '<script>', citations: [], save: true }, []),
  )
  assert.deepEqual(
    validateBrainChatAnswer({ answer: 'Tekma [1].', citations: ['real', 'real'] }, ['real'])
      .citations,
    ['real'],
  )
})

test('chat validates user turns and bounds transient history by turns and request size', () => {
  assert.equal(
    brainChatBodySchema.safeParse({ messages: [{ role: 'user', text: 'Živjo!' }] }).success,
    true,
  )
  assert.equal(
    brainChatBodySchema.safeParse({ messages: [{ role: 'system', text: 'Navodilo' }] }).success,
    false,
  )
  assert.equal(
    brainChatBodySchema.safeParse({ messages: [{ role: 'assistant', text: 'Odgovor' }] }).success,
    false,
  )
  assert.equal(
    brainChatBodySchema.safeParse({ messages: [{ role: 'user', text: 'x'.repeat(3001) }] }).success,
    false,
  )
  const messages = Array.from({ length: 40 }, (_, i) => ({
    role: i % 2 ? 'user' : 'assistant',
    text: '😀'.repeat(3000),
  }))
  const history = brainChatHistory(messages)
  assert.ok(history.length <= 12)
  assert.equal(history[0].role, 'user')
  assert.equal(history.at(-1).role, 'user')
  assert.ok(new TextEncoder().encode(JSON.stringify(history)).length <= 32000)
})

test('knowledge uses only explicit public catalog fields and keeps date status and provenance', () => {
  const content = {
    races: [
      {
        slug: 'obala',
        name: 'Obala Ultra trail',
        date: '2026-11-06',
        dateStatus: 'estimated',
        distances: [{ label: '11K', km: 11, elevation: 200 }],
        privateNotes: 'PRIVATE_SECRET',
      },
    ],
    runners: [],
    trailRoutes: [],
    runnerGpxRoutes: {},
    articles: [],
    privateFiles: [{ path: 'PRIVATE_SECRET' }],
    summaries: ['PRIVATE_SECRET'],
  }
  const documents = brainCatalogSources(content)
  assert.ok(!JSON.stringify(documents).includes('PRIVATE_SECRET'))
  const race = documents.find((s) => s.id === 'catalog:race:obala')
  assert.equal(JSON.parse(race.excerpt).dateStatus, 'estimated')
  assert.equal(race.origin, 'editorial')
  assert.equal(race.verified_at, null)
  assert.equal(rankBrainSources(documents, 'Kakšne razdalje ima Obala?')[0].id, race.id)
  assert.deepEqual(rankBrainSources(documents, 'Razloži fotosintezo.'), [])
})

test('knowledge ranks imported official topics ahead of catalog rows and unrelated chunks', () => {
  const source = (id, title, excerpt, origin = 'official', verified_at = '2026-11-05') => ({
    id,
    title,
    excerpt,
    origin,
    verified_at,
    url: 'https://example.org/' + id,
    entity_id: 'race',
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
  })
  const catalog = source('catalog', 'GO4Trail', 'Uredniški zapis 13 km 640 m.', 'editorial')
  const distractors = Array.from({ length: 30 }, (_, i) =>
    source('other-' + i, `GO4Trail 2026 opis odseka ${i}`, 'Sabotin, Škabrijel, Solkan.'),
  )
  const equipment = source(
    'equipment',
    'GO4Trail 2026 obvezna oprema',
    'Za GO Ultra je obvezna čelna svetilka.',
  )
  const obala = source(
    'obala35',
    'Obala Ultra Trail 2026 – 35K časovna omejitev',
    'Uradne strani navajajo različni omejitvi; podatek je neskladen.',
  )
  const pool = [catalog, ...distractors, equipment, obala]
  assert.ok(brainKnowledgeWords('GO4Trail 35 km 2026').includes('go4trail'))
  assert.equal(rankBrainSources(pool, 'GO4Trail 2026 obvezna oprema', 8)[0].id, 'equipment')
  assert.equal(
    rankBrainSources(pool, 'Obala Ultra Trail 35km časovna omejitev 2026', 8)[0].id,
    'obala35',
  )
  assert.deepEqual(rankBrainSources(pool, 'Obala 35 km časovna omejitev')[0], obala)
  assert.equal(pool.at(-1).valid_until, '2026-12-31')
})

test('explicit historical edition outranks a more recently checked source', () => {
  const sources = [
    {
      id: 'new',
      title: 'GO4Trail obvezna oprema 2026',
      excerpt: 'Velja za leto 2026.',
      origin: 'official',
      verified_at: '2026-11-05',
    },
    {
      id: 'old',
      title: 'GO4Trail obvezna oprema 2025',
      excerpt: 'Velja za leto 2025.',
      origin: 'official',
      verified_at: '2025-11-01',
    },
  ]
  assert.equal(rankBrainSources(sources, 'GO4Trail obvezna oprema 2025')[0].id, 'old')
})

test('chat retrieves a larger official candidate pool before selecting model context', async () => {
  const originalService = globalThis.brainService
  const calls = []
  const rows = Array.from({ length: 25 }, (_, i) => ({
    id: String(i),
    entity_id: 'race',
    title: 'GO4Trail 2026 trasa ' + i,
    excerpt: 'Opis poti.',
    origin: 'official',
    verified_at: '2026-11-05',
  }))
  rows.push({
    id: 'equipment',
    entity_id: 'race',
    title: 'GO4Trail 2026 obvezna oprema',
    excerpt: 'Obvezna oprema je opisana za posamezne razdalje.',
    origin: 'official',
    verified_at: '2026-11-05',
    valid_from: '2026-01-01',
    valid_until: '2026-12-31',
  })
  globalThis.brainService = () => ({
    from(table) {
      calls.push(['from', table])
      const builder = {
        select() {
          return builder
        },
        in(field, values) {
          calls.push(['in', field, values])
          return builder
        },
        textSearch() {
          return builder
        },
        order() {
          return builder
        },
        limit(n) {
          calls.push(['limit', table, n])
          return Promise.resolve({
            data: table === 'brain_sources' ? rows.slice(0, n) : [],
            error: null,
          })
        },
      }
      return builder
    },
  })
  try {
    const result = await brainKnowledge(
      { $fetch: async () => ({ races: [], runners: [], articles: [] }) },
      [{ role: 'user', text: 'GO4Trail 2026 obvezna oprema' }],
      null,
    )
    assert.equal(result.sources[0].id, 'equipment')
    assert.equal(result.sources[0].valid_until, '2026-12-31')
    assert.ok(result.sources.length <= 12)
    assert.deepEqual(
      calls.filter((c) => c[0] === 'from').map((c) => c[1]),
      ['brain_sources', 'brain_shared_conversations'],
    )
    assert.ok(calls.some((c) => c[0] === 'limit' && c[1] === 'brain_sources' && c[2] === 80))
    assert.ok(
      calls.some((c) => c[0] === 'in' && c[1] === 'origin' && c[2].join() === 'official,editorial'),
    )
  } finally {
    globalThis.brainService = originalService
  }
})

test('semantic routing requires database evidence and a safe public search question', () => {
  const answer = {
    answer: 'Podatka še nimamo.',
    citations: [],
    action: 'missing',
    searchQuery: null,
  }
  assert.equal(validateBrainChatDecision(answer, []).action, 'missing')
  assert.throws(() => validateBrainChatDecision({ ...answer, action: 'database' }, []))
  assert.throws(() => validateBrainChatDecision({ ...answer, action: 'search' }, []))
  assert.equal(
    validateBrainChatDecision(
      { ...answer, action: 'search', searchQuery: 'UTMB 2027 uradni datum' },
      [],
    ).action,
    'search',
  )
  assert.ok(isSafeBrainSearchQuery('UTMB 2027 uradni datum'))
  assert.equal(isSafeBrainSearchQuery('Tekač test@example.com rezultati'), false)
  assert.equal(isSafeBrainSearchQuery('telefon +386 40 123 456'), false)
})

test('web citations come from grounding metadata with correct Unicode offsets and isolated attribution', () => {
  const statement = 'Tekma bo v Žireh.'
  const candidate = {
    content: { parts: [{ text: statement + ' Drugi stavek.' }] },
    groundingMetadata: {
      groundingChunks: [
        { web: { uri: 'https://example.org/race', title: 'Organizator' } },
        { web: { uri: 'javascript:alert(1)', title: 'Unsafe' } },
        { web: { uri: 'https://example.org/race', title: 'Duplicate' } },
      ],
      groundingSupports: [
        {
          segment: { endIndex: new TextEncoder().encode(statement).length },
          groundingChunkIndices: [0, 1, 2],
        },
      ],
      searchEntryPoint: { renderedContent: '<div>Google Search</div>' },
    },
  }
  const result = parseBrainGrounding(candidate)
  assert.equal(result.mode, 'web')
  assert.equal(result.answer, statement + ' [1] Drugi stavek.')
  assert.equal(result.citations.length, 1)
  assert.equal(result.citations[0].origin, 'web')
  assert.equal(result.citations[0].verified_at, null)
  assert.equal(result.searchSuggestionsHtml, '<div>Google Search</div>')
  const missing = parseBrainGrounding({ content: { parts: [{ text: 'Trditev brez dokazov.' }] } })
  assert.equal(missing.mode, 'missing')
  assert.ok(!missing.answer.includes('Trditev brez dokazov.'))
})

test('each prompt draw contains at most two distinct approved rows and does not mutate the pool', () => {
  const pool = Array.from({ length: 10 }, (_, id) => ({ id: id + 1, prompt: `Vprašanje ${id}` }))
  const original = structuredClone(pool)
  const first = pickBrainPrompts(pool, () => 0)
  const second = pickBrainPrompts(pool, (max) => max - 1)
  assert.equal(first.length, 2)
  assert.equal(new Set(first.map((p) => p.id)).size, 2)
  assert.notDeepEqual(first, second)
  assert.deepEqual(pool, original)
  assert.deepEqual(
    pickBrainPrompts([], () => 0),
    [],
  )
  assert.equal(pickBrainPrompts(pool.slice(0, 1), () => 0).length, 1)
})
