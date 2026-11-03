import { effortCategory, type EffortCategory } from './raceCategories.ts'

export interface TrailPoint {
  key: string
  km: number
  elevation: number
  raceName: string
  raceSlug?: string
  label: string
  date?: string
  dateConfirmed?: boolean
}

/** Keep category milestones at their real coordinates; add readable round subdivisions. */
export function trailAxisTicks(
  maximum: number,
  milestones: number[],
  minimumGap = 0.085,
): number[] {
  if (!Number.isFinite(maximum) || maximum <= 0) return [0]
  const rawStep = maximum / 5
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 5, 10].find((n) => n * magnitude >= rawStep)! * magnitude
  const fixed = [0, ...milestones.filter((value) => value > 0 && value <= maximum)]
  const ticks = new Set(fixed)
  for (let i = 1; i * step <= maximum + maximum * 1e-10; i++) {
    const value = Number((i * step).toPrecision(12))
    if (
      value <= maximum &&
      fixed.every((anchor) => Math.abs(anchor - value) >= maximum * minimumGap)
    )
      ticks.add(value)
  }
  return [...ticks].sort((a, b) => a - b)
}
export const trailCategories: {
  id: EffortCategory
  label: string
  min: number
  max: number
  background: string
  color: string
}[] = [
  { id: 'short', label: '<20', min: 0, max: 20, background: '#edf0f1', color: '#64727a' },
  { id: '20K', label: '20K', min: 20, max: 50, background: '#fff0ae', color: '#aa8109' },
  { id: '50K', label: '50K', min: 50, max: 100, background: '#ffdbb5', color: '#b65c20' },
  { id: '100K', label: '100K', min: 100, max: 160, background: '#d4ebd7', color: '#2c7851' },
  { id: '100M', label: '100M', min: 160, max: Infinity, background: '#f4d1d7', color: '#a73f50' },
]
export const trailCategory = (p: Pick<TrailPoint, 'km' | 'elevation'>) =>
  trailCategories.find((c) => c.id === effortCategory(p))!

/** Clip the plotting rectangle to km + elevation/100 category boundaries. */
export function effortBandPolygon(
  maxKm: number,
  maxElevation: number,
  min: number,
  max: number,
): [number, number][] {
  let polygon: [number, number][] = [
    [0, 0],
    [maxKm, 0],
    [maxKm, maxElevation],
    [0, maxElevation],
  ]
  for (const [limit, lower] of [
    [min, true],
    [max, false],
  ] as const) {
    if (!Number.isFinite(limit)) continue
    const output: [number, number][] = []
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i]!,
        b = polygon[(i + 1) % polygon.length]!
      const av = a[0] + a[1] / 100 - limit,
        bv = b[0] + b[1] / 100 - limit
      const insideA = lower ? av >= 0 : av <= 0,
        insideB = lower ? bv >= 0 : bv <= 0
      if (insideA) output.push(a)
      if (insideA !== insideB) {
        const t = av / (av - bv)
        output.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
      }
    }
    polygon = output
  }
  return polygon
}
export interface TrailBin {
  label: string
  count: number
  categories: number[]
}
/** Half-open bins with a final overflow bin: every valid point counts once. */
export function trailHistogram(
  points: TrailPoint[],
  edges: number[],
  value: (p: TrailPoint) => number,
): TrailBin[] {
  return edges.map((start, i) => {
    const end = edges[i + 1] ?? Infinity
    const selected = points.filter(
      (p) => Number.isFinite(value(p)) && value(p) >= start && value(p) < end,
    )
    return {
      label: Number.isFinite(end) ? `${start}–${end}` : `${start}+`,
      count: selected.length,
      categories: trailCategories.map(
        (c) => selected.filter((p) => trailCategory(p).id === c.id).length,
      ),
    }
  })
}
export function trailMonths(points: TrailPoint[]): TrailBin[] {
  const dates = points.filter((p) => p.dateConfirmed && /^\d{4}-\d{2}-\d{2}$/.test(p.date || ''))
  const months = [...new Set(dates.map((p) => p.date!.slice(0, 7)))].sort()
  return months.map((month) => {
    const selected = dates.filter((p) => p.date!.startsWith(month))
    return {
      label: month,
      count: selected.length,
      categories: trailCategories.map(
        (c) => selected.filter((p) => trailCategory(p).id === c.id).length,
      ),
    }
  })
}
