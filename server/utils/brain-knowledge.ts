import type { H3Event } from 'h3'
import type { SiteContent } from '../../types/content'
import type { BrainSource } from '../../types/brain'
import type { BrainChatMessage } from '../../utils/brainChat'

const normalize = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
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
  return [...new Set(normalize(text).match(/[\p{L}]{3,}/gu) || [])]
    .filter((w) => !stopWords.has(w))
    .slice(-24)
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
  return sources
    .map((s) => {
      const title = normalize(s.title)
      const text = normalize(s.excerpt)
      const score = words.reduce(
        (score, w) => score + (title.includes(w) ? 8 : 0) + (text.includes(w) ? 1 : 0),
        0,
      )
      return { s, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ s }) => s)
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
      const { data, error } = await search.limit(8)
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
  const shared = results[2]
  if (shared.status === 'rejected') available = false
  const primary = [...new Map(sources.map((s) => [s.id, s])).values()]
  const discussions = shared.status === 'fulfilled' ? shared.value : []
  return {
    sources: [...primary.slice(0, discussions.length ? 9 : 12), ...discussions].slice(0, 12),
    available,
  }
}
