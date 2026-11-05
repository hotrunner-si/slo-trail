import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteKnowledgeEntries, knowledgeMatches, safeKnowledgeUrl } from '../utils/knowledge.ts'
import {
  forumThreadSchema,
  forumPostSchema,
  validateForumSummary,
  forumPublicationText,
} from '../server/utils/brain-forum-policy.ts'

test('community contributions require consent, reject account/role injection and contacts', () => {
  const question = {
    title: 'Izkušnje s prvim ultra tekom',
    body: 'Kakšne izkušnje imate na tej trasi v mokrem?',
    type: 'question',
    topic: 'beginners',
    consent: true,
  }
  assert.ok(forumThreadSchema.safeParse(question).success)
  for (const value of [
    { ...question, consent: false },
    { ...question, user_id: 'admin' },
    { ...question, hidden: false },
    { ...question, body: 'Pišite mi na zasebno@example.com za izkušnje.' },
    { ...question, type: 'official' },
  ])
    assert.equal(forumThreadSchema.safeParse(value).success, false)
  assert.equal(
    forumPostSchema.safeParse({
      thread: 'a62b29ad-69df-4b06-83dd-7810487336fa',
      body: 'Leta 2026-11-05 je bila trasa mokra.',
      consent: true,
    }).success,
    true,
  )
})
test('summary references must point to actual visible contributions and preserve distinct views', () => {
  const id = 'a62b29ad-69df-4b06-83dd-7810487336fa'
  const summary = {
    overview: 'Izkušnje so različne in odvisne od razmer.',
    agreements: [],
    differences: [{ text: 'Opisani sta mokra in suha trasa.', postIds: [id] }],
    cautions: [{ text: 'Nimamo uradnega podatka o prehodnosti.', postIds: [id] }],
  }
  assert.deepEqual(validateForumSummary(summary, [id]), summary)
  assert.throws(() => validateForumSummary(summary, []))
  assert.throws(() => validateForumSummary({ ...summary, differences: [], cautions: [] }, [id]))
  assert.throws(() =>
    validateForumSummary({ ...summary, differences: [{ text: 'Neutemeljeno.', postIds: [] }] }, [
      id,
    ]),
  )
  const publication = forumPublicationText('Spust po dežju', summary, id)
  assert.ok(publication.includes('NEPREVERJENE IZKUŠNJE'))
  assert.ok(publication.includes('Različne izkušnje'))
  assert.ok(publication.includes('/mozgan/baza?thread=' + id))
})
test('catalog adapter retains long article bodies and relationships without private account data or GPX geometry', () => {
  const content = {
    races: [
      {
        slug: 'test',
        name: 'Žirovski trail',
        location: 'Žiri',
        region: 'Gorenjska',
        date: '2027-05-15',
        dateStatus: 'estimated',
        registrationStatus: 'Ni podatka',
        distances: [
          {
            id: 'long',
            label: '50K',
            km: 50,
            elevation: 2000,
            gpx: { rawFile: '/test.gpx', route: [[46, 14]] },
          },
        ],
        entrants: [{ runnerSlug: 'ana', distanceId: 'long' }],
      },
    ],
    runners: [
      {
        slug: 'ana',
        name: 'Ana',
        location: 'Žiri',
        bio: 'Tekačica',
        longDescription: 'Opis izkušenj',
        quote: '',
        favouriteRouteSlugs: [],
      },
    ],
    trailRoutes: [],
    runnerGpxRoutes: {},
    articles: [
      {
        slug: 'dolg',
        title: 'Dolg članek',
        description: 'Opis',
        category: 'Trening',
        publishedAt: '2026-11-05',
        body: ['Dolgo besedilo. '.repeat(2000)],
        relatedRace: 'test',
      },
    ],
    siteContent: {},
    privateFiles: [{ path: 'PRIVATE_SECRET' }],
    account: { email: 'PRIVATE_SECRET' },
  }
  const entries = siteKnowledgeEntries(content)
  assert.equal(entries.length, 4)
  const article = entries.find((e) => e.kind === 'article')
  assert.equal(article.sections[0].text, content.articles[0].body[0])
  assert.ok(article.related.includes('race:test'))
  assert.ok(entries.find((e) => e.kind === 'race').related.includes('runner:ana'))
  assert.ok(
    entries.find((e) => e.kind === 'race').facts.some((f) => f.value === '2027-05 (okviren mesec)'),
  )
  assert.ok(
    knowledgeMatches(
      entries.find((e) => e.kind === 'race'),
      'zirovski',
    ),
  )
  assert.ok(!JSON.stringify(entries).includes('PRIVATE_SECRET'))
  assert.ok(!JSON.stringify(entries).includes('[[46,14]]'))
})
test('source links reject script URLs, protocol-relative URLs and backslash redirects', () => {
  for (const url of [
    'javascript:alert(1)',
    '//evil.example',
    '/\\evil.example',
    'data:text/html,a',
    '/path\n',
  ])
    assert.equal(safeKnowledgeUrl(url), null)
  assert.equal(safeKnowledgeUrl('/races/test'), '/races/test')
  assert.equal(safeKnowledgeUrl('https://example.com/source'), 'https://example.com/source')
})
