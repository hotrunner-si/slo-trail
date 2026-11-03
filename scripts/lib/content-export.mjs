import ts from 'typescript'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, extname, relative } from 'node:path'

// Only used by the one-time importer, never by the website. Execute the trusted
// local catalog so schedule overrides and GPX links are included in the export.
export function readLocalContent(root = process.cwd()) {
  const cache = new Map()
  function load(input, parent = root) {
    let file = input.startsWith('~/') ? resolve(root, input.slice(2)) : resolve(parent, input)
    if (!extname(file)) file += '.ts'
    if (relative(root, file).startsWith('..') || !existsSync(file))
      throw new Error(`Unsupported catalog import: ${input}`)
    if (cache.has(file)) return cache.get(file).exports
    if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'))
    const module = { exports: {} }
    cache.set(file, module)
    const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    })
    new Function('require', 'module', 'exports', outputText)(
      (name) => load(name, dirname(file)),
      module,
      module.exports,
    )
    return module.exports
  }
  return JSON.parse(
    JSON.stringify({
      races: load('~/data/races').races,
      runners: load('~/data/runners').runners,
      trailRoutes: load('~/data/routes').trailRoutes,
      runnerGpxRoutes: load('~/data/runnerGpxRoutes').runnerGpxRoutes,
      articles: load('~/data/articles').articles,
      raceHeroPhotos: load('~/data/raceHeroPhotos.json'),
      runnerPhotos: load('~/data/runnerPhotos.json'),
    }),
  )
}

export function contentRows(content) {
  const runners = new Set(content.runners.map((r) => r.slug))
  const races = new Set(content.races.map((r) => r.slug))
  const routes = new Set(content.trailRoutes.map((r) => r.slug))
  const known = (set, value) => (set.has(value) ? value : null)
  const rows = {
    runners: [],
    races: [],
    race_distances: [],
    race_entrants: [],
    trail_routes: [],
    runner_tours: [],
    articles: [],
    article_sources: [],
    article_quotes: [],
    article_result_groups: [],
    article_result_rows: [],
    race_hero_photos: [],
    runner_photos: [],
  }
  content.runners.forEach((item, position) =>
    rows.runners.push({ slug: item.slug, position, data: item }),
  )
  content.races.forEach((item, position) => {
    const { distances, entrants, ...data } = item
    rows.races.push({ slug: item.slug, position, data })
    distances.forEach((distance, index) =>
      rows.race_distances.push({
        race_slug: item.slug,
        id: distance.id || `distance-${index}`,
        position: index,
        data: distance,
      }),
    )
    ;(entrants || []).forEach((entry) =>
      rows.race_entrants.push({
        race_slug: item.slug,
        runner_slug: entry.runnerSlug,
        distance_id: entry.distanceId,
      }),
    )
  })
  content.trailRoutes.forEach((item, position) =>
    rows.trail_routes.push({
      slug: item.slug,
      runner_slug: item.runnerSlug,
      position,
      is_demo: true,
      data: item,
    }),
  )
  Object.entries(content.runnerGpxRoutes).forEach(([runner_slug, tours]) =>
    tours.forEach((item, position) =>
      rows.runner_tours.push({ runner_slug, id: item.id, position, data: item }),
    ),
  )
  content.articles.forEach((item, position) => {
    const { sources, quotes, results, ...data } = item
    rows.articles.push({
      slug: item.slug,
      position,
      related_race: known(races, item.relatedRace),
      related_runner: known(runners, item.relatedRunner),
      related_route: known(routes, item.relatedRoute),
      contains_demo: (quotes || []).some((q) => /demo|izmišljen/i.test(q.attribution)),
      data,
    })
    ;(sources || []).forEach((source, index) =>
      rows.article_sources.push({ article_slug: item.slug, position: index, data: source }),
    )
    ;(quotes || []).forEach((quote, index) =>
      rows.article_quotes.push({
        article_slug: item.slug,
        position: index,
        runner_slug: known(runners, quote.runnerSlug),
        is_demo: /demo|izmišljen/i.test(quote.attribution),
        data: quote,
      }),
    )
    ;(results || []).forEach((group, index) => {
      const { rows: results, ...data } = group
      rows.article_result_groups.push({ article_slug: item.slug, position: index, data })
      results.forEach((result, rowIndex) =>
        rows.article_result_rows.push({
          article_slug: item.slug,
          group_position: index,
          position: rowIndex,
          runner_slug: content.runners.find((r) => r.name === result.name)?.slug || null,
          data: result,
        }),
      )
    })
  })
  Object.entries(content.raceHeroPhotos).forEach(([race_slug, data]) =>
    rows.race_hero_photos.push({ race_slug, data }),
  )
  content.runnerPhotos.forEach((data, position) =>
    rows.runner_photos.push({ runner_slug: data.runner, file: data.file, position, data }),
  )
  return rows
}
