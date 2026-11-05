import type { SiteContent } from '../types/content'
import type { KnowledgeEntry, KnowledgeTopic } from '../types/knowledge'

export const knowledgeKindNames: Record<string, string> = {
  race: 'Tekma',
  distance: 'Razdalja',
  runner: 'Tekač',
  route: 'Trasa',
  tour: 'Tekaška tura',
  article: 'Članek',
  edition: 'Letna izvedba',
  segment: 'Odsek',
  result: 'Rezultat',
  participation: 'Udeležba',
  source: 'Dodatni vir',
  conversation: 'Deljen pogovor',
  experience: 'Izkušnja',
  page: 'Vsebina strani',
}
export const knowledgeOriginNames: Record<string, string> = {
  site: 'S spletne strani',
  official: 'Uradni vir',
  editorial: 'Uredniški vir',
  unverified: 'Nepreverjen vir',
  community: 'Izkušnja skupnosti',
  conversation: 'Deljen pogovor',
}
export function normalizeKnowledge(text: string) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}
export function knowledgeMatches(
  entry: Pick<KnowledgeEntry, 'title' | 'excerpt' | 'sections' | 'facts'>,
  query: string,
) {
  const words = normalizeKnowledge(query).split(/\s+/).filter(Boolean)
  const haystack = normalizeKnowledge(
    [
      entry.title,
      entry.excerpt,
      ...entry.sections.map((s) => s.text),
      ...entry.facts.map((f) => f.value),
    ].join(' '),
  )
  return words.every((word) => haystack.includes(word))
}
export function knowledgeTopic(text: string, fallback: KnowledgeTopic = 'other'): KnowledgeTopic {
  const t = normalizeKnowledge(text)
  if (/prehran|hidracij|ogljik|gelov|energijsk|okrepceval/.test(t)) return 'nutrition'
  if (/oprem|copat|svetilk|palic|nahrbtn/.test(t)) return 'gear'
  if (/poskodb|regener|zdravj|bolecin/.test(t)) return 'health'
  if (/zacetnik|prvi trail|prvi ultra/.test(t)) return 'beginners'
  if (/trening|priprav|interval/.test(t)) return 'training'
  return fallback
}
const str = (value: unknown) => (value == null ? '' : String(value))
const distance = (km: number, gain?: number | null) =>
  `${km} km${gain != null ? ` · ${gain} m vzpona` : ''}`
export function safeKnowledgeUrl(url?: string | null): string | null {
  if (!url) return null
  if (/^\/(?!\/|\\)/.test(url) && !/[\\\u0000-\u0020]/.test(url)) return url
  try {
    const parsed = new URL(url)
    return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

/** Read directly from the public catalog: edits are reflected without a second copy to synchronize. */
export function siteKnowledgeEntries(content: SiteContent): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = []
  function add(value: Partial<KnowledgeEntry> & Pick<KnowledgeEntry, 'id' | 'title' | 'kind'>) {
    entries.push({
      origin: 'site',
      topic: 'other',
      excerpt: '',
      sections: [],
      facts: [],
      links: [],
      related: [],
      ...value,
    })
  }
  for (const race of content.races) {
    const id = `race:${race.slug}`
    const dates = race.date
      ? race.dateStatus === 'estimated'
        ? `${race.date.slice(0, 7)} (okviren mesec)`
        : `${race.date}${race.dateEnd ? ` – ${race.dateEnd}` : ''}`
      : 'Datum še ni objavljen'
    add({
      id,
      title: race.name,
      kind: 'race',
      topic: 'races',
      excerpt:
        race.summary || `${race.location} · ${race.distances.map((d) => d.label).join(', ')}`,
      facts: [
        { label: 'Kraj', value: `${race.location} · ${race.region}` },
        { label: 'Datum', value: dates },
        { label: 'Prijave', value: race.registrationStatus },
        { label: 'Vrsta teka', value: race.raceType || 'Trail' },
        { label: 'Država', value: race.country || 'Slovenija' },
      ],
      sections: [
        {
          title: 'Razdalje',
          text: race.distances.map((d) => `${d.label}: ${distance(d.km, d.elevation)}`).join('\n'),
        },
        ...(race.results?.length
          ? [
              {
                title: 'Objavljeni rezultati',
                text: race.results.map((r) => `${r.category}: ${r.winner} · ${r.time}`).join('\n'),
              },
            ]
          : []),
        ...(race.climbs?.length
          ? [
              {
                title: 'Vzponi',
                text: race.climbs
                  .map((c) => `${c.name}: ${c.distance}, ${c.gain}, ${c.grade}`)
                  .join('\n'),
              },
            ]
          : []),
      ],
      verifiedAt: race.verifiedAt,
      links: [
        { label: 'Stran tekme', url: `/races/${race.slug}` },
        ...(safeKnowledgeUrl(race.sourceUrl)
          ? [{ label: race.sourceName || 'Navedeni vir organizatorja', url: race.sourceUrl! }]
          : []),
      ],
      related: [
        ...race.distances.map((d, i) => `distance:${race.slug}:${d.id || i}`),
        ...(race.entrants || []).map((e) => `runner:${e.runnerSlug}`),
      ],
    })
    race.distances.forEach((d, i) =>
      add({
        id: `distance:${race.slug}:${d.id || i}`,
        title: `${race.name} · ${d.label}`,
        kind: 'distance',
        topic: 'races',
        excerpt: `${d.name || d.label} · ${distance(d.km, d.elevation)}`,
        related: [id],
        verifiedAt: race.verifiedAt,
        facts: [
          { label: 'Dolžina', value: `${d.km} km` },
          { label: 'Vzpon', value: d.elevation ? `${d.elevation} m` : 'Ni podatka' },
          { label: 'Zahtevnost', value: d.technicality || 'Ni podatka' },
          {
            label: 'Start',
            value: [d.startDate, d.startTime].filter(Boolean).join(' · ') || 'Ni podatka',
          },
          { label: 'ITRA', value: str(d.itra) || 'Ni podatka' },
          { label: 'UTMB kategorija', value: d.utmbIndexCategory || 'Ni podatka' },
        ],
        links: [
          { label: 'Stran tekme in profil trase', url: `/races/${race.slug}` },
          ...(safeKnowledgeUrl(d.gpx?.rawFile)
            ? [{ label: 'Izvorni GPX', url: d.gpx!.rawFile! }]
            : []),
        ],
      }),
    )
  }
  for (const runner of content.runners)
    add({
      id: `runner:${runner.slug}`,
      title: runner.name,
      kind: 'runner',
      topic: 'people',
      excerpt: runner.bio,
      facts: [
        { label: 'Kraj', value: runner.location },
        { label: 'Klub', value: runner.club || 'Ni podatka' },
        { label: 'Najljubša razdalja', value: runner.favouriteDistance || 'Ni podatka' },
        { label: 'UTMB indeks', value: str(runner.utmbIndex) || 'Ni podatka' },
      ],
      sections: [
        { title: 'Predstavitev', text: runner.longDescription },
        { title: 'Misli tekača', text: runner.quote },
      ].filter((s) => s.text),
      related: [
        ...runner.favouriteRouteSlugs.map((s) => `route:${s}`),
        ...content.races
          .filter((r) => r.entrants?.some((e) => e.runnerSlug === runner.slug))
          .map((r) => `race:${r.slug}`),
      ],
      links: [
        { label: 'Profil tekača', url: `/runners/${runner.slug}` },
        ...[
          ['UTMB', runner.utmbUrl],
          ['Strava', runner.stravaUrl],
          ['Spletna stran', runner.websiteUrl],
        ]
          .filter(([, url]) => safeKnowledgeUrl(url))
          .map(([label, url]) => ({ label: label!, url: url! })),
      ],
    })
  for (const route of content.trailRoutes || [])
    add({
      id: `route:${route.slug}`,
      title: route.name,
      kind: 'route',
      topic: 'routes',
      excerpt: route.description,
      facts: [
        { label: 'Območje', value: route.region },
        { label: 'Dolžina in vzpon', value: distance(route.distance, route.elevationGain) },
        { label: 'Spust', value: `${route.elevationLoss} m` },
        { label: 'Najvišja točka', value: `${route.highPoint} m` },
        { label: 'Zahtevnost', value: route.difficulty },
        { label: 'Predviden čas', value: route.estimatedTime },
        { label: 'Priporoča', value: route.recommendedBy },
      ],
      sections: route.quote ? [{ title: 'Priporočilo', text: route.quote }] : [],
      related: [`runner:${route.runnerSlug}`],
      links: [{ label: 'Trasa, zemljevid in GPX', url: `/routes/${route.slug}` }],
    })
  for (const [slug, tours] of Object.entries(content.runnerGpxRoutes || {}))
    for (const tour of tours)
      add({
        id: `tour:${slug}:${tour.id}`,
        title: tour.title,
        kind: 'tour',
        topic: 'routes',
        excerpt: tour.description,
        facts: [
          { label: 'Kraj', value: tour.location },
          { label: 'Datum', value: tour.dateIso || 'Ni podatka' },
          { label: 'Dolžina in vzpon', value: distance(tour.distanceKm, tour.elevationGain) },
        ],
        related: [`runner:${slug}`],
        links: [
          {
            label: 'Tura in GPX na profilu tekača',
            url: `/runners/${slug}?gpx=${encodeURIComponent(tour.id)}#runner-gpx-toggle-${encodeURIComponent(tour.id)}`,
          },
          ...(safeKnowledgeUrl(tour.downloadUrl)
            ? [{ label: 'Prenesi GPX', url: tour.downloadUrl! }]
            : []),
        ],
      })
  for (const article of content.articles)
    add({
      id: `article:${article.slug}`,
      title: article.title,
      kind: 'article',
      topic: knowledgeTopic(article.title + ' ' + article.category),
      excerpt: article.description,
      facts: [
        { label: 'Objavljeno', value: article.publishedAt },
        { label: 'Kategorija', value: article.category },
      ],
      sections: [
        { title: article.subtitle || 'Vsebina', text: article.body.join('\n\n') },
        ...(article.results || []).map((g) => ({
          title: g.heading,
          text: g.rows
            .map(
              (r) =>
                `${r.place}. ${r.name}: ${r.time}${r.utmbScore ? ` · UTMB ${r.utmbScore}` : ''}`,
            )
            .join('\n'),
        })),
        ...(article.quotes || []).map((q) => ({ title: q.attribution, text: q.text })),
        ...(article.editorialNote
          ? [{ title: 'Uredniška opomba', text: article.editorialNote }]
          : []),
      ],
      related: [
        article.relatedRace && `race:${article.relatedRace}`,
        article.relatedRunner && `runner:${article.relatedRunner}`,
        article.relatedRoute && `route:${article.relatedRoute}`,
      ].filter(Boolean) as string[],
      links: [
        { label: 'Preberi članek', url: `/journal/${article.slug}` },
        ...(article.sources || [])
          .filter((s) => safeKnowledgeUrl(s.url))
          .map((s) => ({ label: s.label, url: s.url })),
      ],
    })
  // Public site copy belongs in the collection too; operational dashboard configuration does not.
  for (const key of ['site', 'home', 'races', 'runners', 'routes', 'journal'] as const) {
    const copy = content.siteContent?.[key]
    if (!copy) continue
    const titles = {
      site: 'O Trail Slovenija',
      home: 'Vstopna stran',
      races: 'O zbirki tekem',
      runners: 'O zbirki tekačev',
      routes: 'O zbirki tras',
      journal: 'O dnevniku',
    }
    const sections = Object.entries(copy)
      .filter(
        ([key, value]) =>
          /title|description|intro|name|topics/i.test(key) &&
          (typeof value === 'string' || Array.isArray(value)),
      )
      .map(([, value]) => ({
        title: '',
        text: Array.isArray(value) ? value.join(' · ') : str(value),
      }))
    add({
      id: `page:${key}`,
      title: titles[key],
      kind: 'page',
      sections,
      excerpt: sections
        .map((s) => s.text)
        .join(' ')
        .slice(0, 200),
      links: [
        {
          label: 'Odpri stran',
          url: {
            site: '/',
            home: '/',
            races: '/races',
            runners: '/runners',
            routes: '/routes',
            journal: '/journal',
          }[key],
        },
      ],
    })
  }
  return entries
}
