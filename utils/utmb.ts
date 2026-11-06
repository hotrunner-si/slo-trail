export const utmbCategories = ['general', '20k', '50k', '100k', '100m'] as const
export type UtmbCategory = (typeof utmbCategories)[number]
export type UtmbSex = 'H' | 'F'
export type UtmbScope = 'world' | 'slovenia'
export interface UtmbRunner {
  id: number
  name: string
  country: string
  uri: string
  indices: Record<UtmbCategory, number | null>
}
export interface UtmbRanking {
  scope: UtmbScope
  sex: UtmbSex
  category: UtmbCategory
  fetchedAt: string
  source: string
  runners: UtmbRunner[]
}
interface SearchRunner {
  id: number
  fullname: string
  nationality: string
  uri: string
  sex: string
  ip: number
}
export interface UtmbProfile {
  performanceIndexes: { piCategory: string; index: number | null }[]
}

export function sortUtmbRunners(runners: UtmbRunner[], category: UtmbCategory) {
  return [...runners].sort(
    (a, b) =>
      (b.indices[category] ?? 0) - (a.indices[category] ?? 0) || a.name.localeCompare(b.name, 'sl'),
  )
}

export async function fetchUtmb<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`https://api.utmb.world${path}`, {
    headers: { 'x-tenant-id': 'worldseries', Accept: 'application/json' },
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(15_000)])
      : AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`UTMB HTTP ${response.status}`)
  return response.json() as Promise<T>
}

export async function fetchUtmbRanking(
  scope: UtmbScope,
  sex: UtmbSex,
  category: UtmbCategory,
  profile: (uri: string, signal?: AbortSignal) => Promise<UtmbProfile> = (uri, signal) =>
    fetchUtmb<UtmbProfile>(`/runners/${encodeURIComponent(uri)}`, signal),
): Promise<UtmbRanking> {
  const deadline = AbortSignal.timeout(25_000)
  const limit = scope === 'world' ? 25 : 100
  const params = new URLSearchParams({
    category: scope === 'slovenia' ? 'general' : category,
    sex,
    limit: String(limit),
    offset: '0',
  })
  if (scope === 'slovenia') params.set('nationality', 'SI')
  const result = await fetchUtmb<{ nbHits: number; runners: SearchRunner[] }>(
    `/search/runners?${params}`,
    deadline,
  )
  if (
    !Array.isArray(result.runners) ||
    result.runners.length !== Math.min(limit, result.nbHits) ||
    !result.runners.length ||
    result.runners.some((r) => r.sex !== sex || (scope === 'slovenia' && r.nationality !== 'SI'))
  )
    throw new Error('Incomplete UTMB ranking')
  const runners: UtmbRunner[] = []
  // Keep load on the official source bounded, including the 100-runner national lists.
  for (let start = 0; start < result.runners.length; start += 5) {
    deadline.throwIfAborted()
    runners.push(
      ...(await Promise.all(
        result.runners.slice(start, start + 5).map(async (runner) => {
          const data = await profile(runner.uri, deadline)
          if (
            !Array.isArray(data.performanceIndexes) ||
            !data.performanceIndexes.some((i) => i.piCategory === 'general')
          )
            throw new Error('Incomplete UTMB profile')
          const indices = Object.fromEntries(
            utmbCategories.map((key) => {
              const value = data.performanceIndexes.find((i) => i.piCategory === key)?.index
              return [
                key,
                typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null,
              ]
            }),
          ) as UtmbRunner['indices']
          indices[scope === 'slovenia' ? 'general' : category] = runner.ip
          return {
            id: runner.id,
            name: runner.fullname,
            country: runner.nationality,
            uri: runner.uri,
            indices,
          }
        }),
      )),
    )
  }
  return {
    scope,
    sex,
    category: scope === 'slovenia' ? 'general' : category,
    fetchedAt: new Date().toISOString(),
    source: 'https://utmb.world/utmb-index',
    runners,
  }
}
