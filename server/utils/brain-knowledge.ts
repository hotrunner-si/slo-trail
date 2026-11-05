import type { H3Event } from 'h3'
import type { SiteContent } from '../../types/content'
import type { BrainSource } from '../../types/brain'
import type { BrainChatMessage } from '../../utils/brainChat'
import { brainSemanticSearch } from './brain-semantic.ts'

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/(\d)\s*k(?:m)?\b/g, '$1km')
const stopWords = new Set([
  'kako',
  'lahko',
  'kateri',
  'katera',
  'katere',
  'koliko',
  'prosim',
  'povej',
  'kaj',
  'zakaj',
  'tudi',
  'zdravo',
  'hvala',
  'where',
  'what',
  'which',
  'about',
])
export function brainKnowledgeWords(text: string) {
  return [...new Set(normalize(text).match(/[\p{L}\p{N}]{2,}/gu) || [])]
    .filter((w) => !stopWords.has(w))
    .filter((w) => w.length >= 3 || /^\d+$/.test(w))
    .slice(-24)
}

/** Keep accents for Postgres' simple dictionary; OR terms for natural-language questions. */
export function brainQuestionSearchQuery(text: string) {
  const terms = [
    ...new Set(
      text
        .toLowerCase()
        .normalize('NFC')
        .match(/[\p{L}\p{N}]{3,}/gu) || [],
    ),
  ]
    .filter((word) => !stopWords.has(normalize(word)))
    .slice(-24)
  let query = ''
  for (const term of terms) {
    const next = query ? `${query} OR ${term}` : term
    if (next.length > 300) break
    query = next
  }
  return query
}

/** Explicit public fields only: no account profiles, uploaded files, summaries or pending claims. */
export function brainCatalogSources(content: SiteContent): BrainSource[] {
  const source = (
    id: string,
    title: string,
    excerpt: unknown,
    url: string,
    date: string | null = null,
  ): BrainSource => ({
    id,
    title,
    excerpt: JSON.stringify(excerpt).slice(0, 8000),
    url,
    entity_id: '',
    origin: 'editorial',
    verified_at: date,
    valid_from: null,
    valid_until: null,
  })
  return [
    source(
      'catalog:calendar',
      'Koledar tekem Trail Slovenija',
      content.races.map((r) => ({
        name: r.name,
        date: r.date || null,
        dateEnd: r.dateEnd,
        dateStatus: r.dateStatus,
      })),
      '/races',
    ),
    ...content.races.map((r) =>
      source(
        `catalog:race:${r.slug}`,
        r.name,
        {
          name: r.name,
          location: r.location,
          region: r.region,
          country: r.country,
          date: r.date || null,
          dateEnd: r.dateEnd,
          dateStatus: r.dateStatus,
          summary: r.summary,
          registrationStatus: r.registrationStatus,
          sourceUrl: r.sourceUrl,
          distances: r.distances.map((d) => ({
            label: d.label,
            km: d.km,
            elevation: d.elevation,
            startDate: d.startDate,
            startTime: d.startTime,
            technicality: d.technicality,
            gpxAvailable: Boolean(d.gpx?.rawFile),
          })),
          results: r.results,
        },
        `/races/${r.slug}`,
        r.verifiedAt || null,
      ),
    ),
    ...content.runners.map((r) =>
      source(
        `catalog:runner:${r.slug}`,
        r.name,
        {
          name: r.name,
          location: r.location,
          club: r.club,
          bio: r.bio,
          description: r.longDescription,
          favouriteDistance: r.favouriteDistance,
          utmbIndex: r.utmbIndex,
        },
        `/runners/${r.slug}`,
      ),
    ),
    ...(content.trailRoutes || []).map((r) =>
      source(
        `catalog:route:${r.slug}`,
        r.name,
        {
          name: r.name,
          region: r.region,
          distance: r.distance,
          elevationGain: r.elevationGain,
          highPoint: r.highPoint,
          difficulty: r.difficulty,
          description: r.description,
        },
        `/routes/${r.slug}`,
      ),
    ),
    ...Object.entries(content.runnerGpxRoutes || {}).flatMap(([runnerSlug, tours]) =>
      tours.map((t) =>
        source(
          `catalog:tour:${runnerSlug}:${t.id}`,
          t.title,
          {
            title: t.title,
            runner: content.runners.find((r) => r.slug === runnerSlug)?.name,
            date: t.dateIso,
            location: t.location,
            distanceKm: t.distanceKm,
            elevationGain: t.elevationGain,
            description: t.description,
          },
          `/runners/${runnerSlug}?gpx=${encodeURIComponent(t.id)}#runner-gpx-toggle-${encodeURIComponent(t.id)}`,
        ),
      ),
    ),
    ...content.articles.map((a) =>
      source(
        `catalog:article:${a.slug}`,
        a.title,
        {
          title: a.title,
          publishedAt: a.publishedAt,
          description: a.description,
          body: a.body,
          results: a.results,
          sources: a.sources,
        },
        `/journal/${a.slug}`,
      ),
    ),
  ]
}

export function rankBrainSources(sources: BrainSource[], query: string, limit = 10) {
  const words = brainKnowledgeWords(query)
  const years = query.match(/\b(?:19|20|21)\d{2}\b/g) || []
  return sources
    .map((s) => {
      const title = normalize(s.title)
      const text = normalize(s.excerpt)
      let score = words.reduce(
        (score, w) => score + (title.includes(w) ? 8 : 0) + (text.includes(w) ? 1 : 0),
        0,
      )
      // An explicit edition in the question must outrank a newer verification date.
      if (score && years.length) {
        score += years.reduce(
          (sum, year) => sum + (title.includes(year) || text.includes(year) ? 16 : 0),
          0,
        )
      }
      return { s, score }
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.s.origin === 'official') - Number(a.s.origin === 'official') ||
        (b.s.verified_at || '').localeCompare(a.s.verified_at || ''),
    )
    .slice(0, limit)
    .map(({ s }) => s)
}

/** Fuse lexical and vector ranks without discarding semantic-only matches. */
export function rankBrainHybridSources(sources: BrainSource[], query: string, limit = 12) {
  const semantic = sources
    .filter((s) => typeof s.similarity === 'number')
    .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
  if (!semantic.length) return rankBrainSources(sources, query, limit)
  const lexical = rankBrainSources(sources, query, sources.length)
  const scores = new Map<string, number>()
  lexical.forEach((s, i) => scores.set(s.id, 1 / (20 + i + 1)))
  semantic.forEach((s, i) => scores.set(s.id, (scores.get(s.id) || 0) + 2 / (20 + i + 1)))
  const requestedYears: string[] = query.match(/\b(?:19|20|21)\d{2}\b/g) || []
  if (requestedYears.length) {
    for (const source of sources) {
      const sourceYears = `${source.title} ${source.excerpt}`.match(/\b(?:19|20|21)\d{2}\b/g) || []
      if (sourceYears.length && !sourceYears.some((year) => requestedYears.includes(year)))
        scores.set(source.id, (scores.get(source.id) || 0) * 0.2)
    }
  }
  return sources
    .filter((s) => scores.has(s.id))
    .sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0))
    .slice(0, limit)
}

export async function brainKnowledge(
  event: H3Event,
  messages: BrainChatMessage[],
  entity: string | null,
) {
  const users = messages.filter((m) => m.role === 'user')
  const query = users
    .slice(-3)
    .map((m) => m.text)
    .join(' ')
  const latest = users.at(-1)?.text || ''
  let available = true
  const sources: BrainSource[] = []
  const results = await Promise.allSettled([
    event.$fetch<SiteContent>('/api/content'),
    (async () => {
      const service = brainService(event)
      let search = service
        .from('brain_sources')
        .select('id,entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until')
        .in('origin', ['official', 'editorial'])
      if (entity) {
        const { data, error } = await service
          .from('brain_relations')
          .select('object_id')
          .eq('subject_id', entity)
          .limit(8)
        if (error) throw new Error('Knowledge relations unavailable')
        search = search.in('entity_id', [entity, ...(data || []).map((p) => p.object_id)])
      } else {
        const words = brainKnowledgeWords(query).slice(-12)
        if (!words.length) return []
        search = search.textSearch('search', words.join(' OR '), {
          type: 'websearch',
          config: 'simple',
        })
      }
      // Rank a bounded candidate pool before applying the small model-context limit.
      // Limiting to eight unordered rows here previously hid newly imported topics.
      const { data, error } = await search
        .order('verified_at', { ascending: false, nullsFirst: false })
        .order('id')
        .limit(80)
      if (error) throw new Error('Knowledge sources unavailable')
      return (data || []).map((s) => ({ ...s, excerpt: s.excerpt.slice(0, 5000) })) as BrainSource[]
    })(),
    (async () => {
      const words = brainKnowledgeWords(query).slice(-12)
      if (!words.length) return []
      const { data, error } = await brainService(event)
        .from('brain_shared_conversations')
        .select('id,title,content,created_at')
        .textSearch('search', words.join(' OR '), { type: 'websearch', config: 'simple' })
        .limit(3)
      if (error) throw new Error('Shared knowledge unavailable')
      return (data || []).map((row) => ({
        id: `conversation:${row.id}`,
        title: row.title,
        excerpt: row.content.slice(0, 5000),
        url: `/mozgan/pogovor/${row.id}`,
        origin: 'conversation',
        entity_id: '',
        verified_at: null,
        valid_from: null,
        valid_until: null,
      })) as BrainSource[]
    })(),
    brainSemanticSearch(event, query, { publicOnly: true, entity }),
  ])
  const catalog = results[0]
  if (catalog.status === 'fulfilled') {
    const documents = brainCatalogSources(catalog.value)
    sources.push(...rankBrainSources(documents, latest, 5))
    sources.push(...rankBrainSources(documents, query, 4))
    if (/tekm|koledar|prihodnj|naslednj|novembr|decembr|januar|race|calendar/i.test(latest)) {
      const calendar = documents.find((d) => d.id === 'catalog:calendar')
      if (calendar) sources.unshift(calendar)
    }
  } else available = false
  const knowledge = results[1]
  if (knowledge.status === 'fulfilled') sources.push(...knowledge.value)
  else available = false
  const semantic = results[3]
  if (semantic.status === 'fulfilled' && semantic.value) sources.push(...semantic.value)
  const shared = results[2]
  if (shared.status === 'rejected') available = false
  const primary = [...new Map(sources.map((s) => [s.id, s])).values()]
  const discussions = shared.status === 'fulfilled' ? shared.value : []
  const limit = discussions.length ? 9 : 12
  const ranked = rankBrainHybridSources(primary, latest, limit)
  // Preserve conversational context for follow-ups that omit the race name.
  const selected = [
    ...new Map(
      [...ranked, ...rankBrainHybridSources(primary, query, limit)].map((s) => [s.id, s]),
    ).values(),
  ].slice(0, limit)
  return {
    sources: [...selected, ...discussions].slice(0, 12),
    available,
  }
}
