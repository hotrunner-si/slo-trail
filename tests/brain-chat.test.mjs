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
import { brainCatalogSources, rankBrainSources } from '../server/utils/brain-knowledge.ts'

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
