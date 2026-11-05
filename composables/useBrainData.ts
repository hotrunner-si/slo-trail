export async function useBrainData() {
  const content = await useSiteContent()
  const distances = content.races.flatMap((race) =>
    race.distances.map((distance, index) => ({
      ...distance,
      raceName: race.name,
      raceSlug: race.slug,
      country: race.country,
      date: distance.startDate || race.date,
      dateConfirmed: race.dateStatus === 'confirmed',
      key: `${race.slug}-${distance.id || index}`,
    })),
  )
  const plot = distances.filter(
    (d) =>
      (!d.country || ['Slovenija', 'Slovenia', 'SI'].includes(d.country)) &&
      Number.isFinite(d.km) &&
      d.km > 0 &&
      Number.isFinite(d.elevation) &&
      d.elevation >= 0,
  )
  const sources = content.articles.flatMap((article) =>
    (article.sources || []).map((source) => ({
      ...source,
      articleTitle: article.title,
      articleSlug: article.slug,
    })),
  )
  const knownDistances = distances.filter((d) => Number.isFinite(d.km) && d.km > 0)
  const distanceLimit = Math.max(
    20,
    Math.ceil((Math.max(0, ...knownDistances.map((d) => d.km)) + 0.01) / 20) * 20,
  )
  const buckets = Array.from({ length: distanceLimit / 2 }, (_, index) => ({
    start: index * 2,
    end: (index + 1) * 2,
    count: 0,
  }))
  for (const distance of knownDistances) buckets[Math.floor(distance.km / 2)]!.count++
  const calendar = Object.entries(
    content.races
      .filter((r) => r.dateStatus === 'confirmed' && /^\d{4}-\d{2}-\d{2}$/.test(r.date))
      .reduce<Record<string, number>>((acc, race) => {
        const month = race.date.slice(0, 7)
        acc[month] = (acc[month] || 0) + 1
        return acc
      }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, count]) => ({ label, count }))
  const coverage = [
    {
      label: 'Tekme s povezavo do vira',
      count: content.races.filter((r) => r.sourceUrl).length,
      total: content.races.length,
    },
    {
      label: 'Tekme z datumom preverjanja',
      count: content.races.filter((r) => r.verifiedAt).length,
      total: content.races.length,
    },
    {
      label: 'Razdalje z datoteko GPX',
      count: distances.filter((d) => d.gpx?.rawFile).length,
      total: distances.length,
    },
  ]
  return {
    ...content,
    copy: {
      ...content.siteContent.mozgan.workspace,
      charts: {
        ...content.siteContent.mozgan.workspace.charts,
        scatterTitle: 'Slovenske trase',
        scatterNote:
          'Vsaka točka je ena trasa z znano razdaljo in vzponom iz kataloga slovenskih tekem.',
      },
      analytics: {
        ...content.siteContent.mozgan.workspace.analytics,
        note: 'Razišči razdalje, vzpone, kategorije in sezono slovenskih tekem. Graf Slovenske trase približaj s Ctrl + drsenjem ali ščipom z dvema prstoma.',
      },
    },
    distances,
    plot,
    sources,
    buckets,
    calendar,
    coverage,
  }
}
