import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

const haversine = (a, b) => {
  const rad = Math.PI / 180
  const x =
    Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(Math.min(1, x)))
}
const sample = (points, count) => {
  const size = Math.min(count, points.length)
  return size < 2
    ? points
    : Array.from(
        { length: size },
        (_, index) => points[Math.round((index * (points.length - 1)) / (size - 1))],
      )
}

export async function importPreview(inputPath, event, id, metadata = {}) {
  const xml = await readFile(inputPath, 'utf8')
  const matches = [
    ...xml.matchAll(
      /<(?:trkpt|rtept)\b([^>]*)>([\s\S]*?)<\/(?:trkpt|rtept)>|<(?:trkpt|rtept)\b([^>]*)\/>/g,
    ),
  ]
  const points = matches
    .map((match) => {
      const attrs = match[1] || match[3] || ''
      const lat = Number(attrs.match(/\blat=["']([^"']+)["']/)?.[1] ?? NaN)
      const lng = Number(attrs.match(/\blon=["']([^"']+)["']/)?.[1] ?? NaN)
      const elevation = match[2]?.match(/<ele>\s*([^<]+)<\/ele>/)?.[1]
      const ele =
        elevation == null || !Number.isFinite(Number(elevation)) ? null : Number(elevation)
      return { lat, lng, ele, distanceKm: 0 }
    })
    .filter(
      (point) =>
        Number.isFinite(point.lat) &&
        Number.isFinite(point.lng) &&
        Math.abs(point.lat) <= 90 &&
        Math.abs(point.lng) <= 180,
    )
  if (points.length < 2) throw new Error(`GPX nima dovolj veljavnih točk: ${inputPath}`)
  let distanceKm = 0,
    elevationGain = 0,
    elevationLoss = 0
  const bounds = { north: -90, south: 90, east: -180, west: 180 }
  let highestPoint = null,
    lowestPoint = null
  for (let index = 0; index < points.length; index++) {
    const point = points[index],
      previous = points[index - 1]
    if (previous) distanceKm += haversine(previous, point)
    point.distanceKm = distanceKm
    bounds.north = Math.max(bounds.north, point.lat)
    bounds.south = Math.min(bounds.south, point.lat)
    bounds.east = Math.max(bounds.east, point.lng)
    bounds.west = Math.min(bounds.west, point.lng)
    if (point.ele != null) {
      highestPoint = highestPoint == null ? point.ele : Math.max(highestPoint, point.ele)
      lowestPoint = lowestPoint == null ? point.ele : Math.min(lowestPoint, point.ele)
      if (previous?.ele != null) {
        const difference = point.ele - previous.ele
        if (difference > 0) elevationGain += difference
        else elevationLoss -= difference
      }
    }
  }
  const elevationsComplete = points.every((point) => point.ele != null)
  // A distance-based detail view preserves aligned route/profile points for hover.
  const detail = [points[0]]
  let target = 0.075
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1],
      b = points[index]
    while (target < distanceKm && target <= b.distanceKm) {
      const ratio = (target - a.distanceKm) / (b.distanceKm - a.distanceKm || 1)
      detail.push({
        lat: a.lat + (b.lat - a.lat) * ratio,
        lng: a.lng + (b.lng - a.lng) * ratio,
        ele: a.ele != null && b.ele != null ? a.ele + (b.ele - a.ele) * ratio : null,
        distanceKm: target,
      })
      target += 0.075
    }
  }
  detail.push(points.at(-1))
  const coordinates = (entries) => entries.map((point) => [point.lat, point.lng])
  const profilePoints = (entries) =>
    entries.map((point) => ({ distanceKm: point.distanceKm, elevation: point.ele }))
  const overview = sample(detail, Math.min(80, Math.max(24, Math.ceil(distanceKm * 1.4))))
  const simpleProfile = elevationsComplete
    ? sample(detail, 64).map((point) => Math.round(point.ele))
    : []
  const common = {
    source: basename(inputPath),
    eventSlug: event,
    distanceId: id,
    ...metadata,
    generatedAt: new Date().toISOString(),
    distanceKm: Number(distanceKm.toFixed(2)),
    elevationGain: elevationsComplete ? Math.round(elevationGain) : null,
    elevationLoss: elevationsComplete ? Math.round(elevationLoss) : null,
    highestPoint: highestPoint == null ? null : Math.round(highestPoint),
    lowestPoint: lowestPoint == null ? null : Math.round(lowestPoint),
    elevationsComplete,
    bounds,
  }
  const preview = { ...common, overviewRoute: coordinates(overview), profile: simpleProfile }
  const dir = join(process.cwd(), 'public', 'gpx', event)
  const previewDir = event.startsWith('runners/')
    ? join(process.cwd(), 'data', 'gpx', event.slice(8))
    : dir
  await Promise.all([mkdir(dir, { recursive: true }), mkdir(previewDir, { recursive: true })])
  const outputs = [
    [join(previewDir, `${id}.json`), preview],
    [
      join(dir, `${id}.detail.json`),
      {
        ...common,
        route: coordinates(detail),
        detailedProfile: elevationsComplete ? profilePoints(detail) : [],
      },
    ],
    [join(dir, `${id}.route.simple.json`), { route: coordinates(overview) }],
    [join(dir, `${id}.route.full.json`), { route: coordinates(points) }],
    [join(dir, `${id}.profile.simple.json`), { distanceKm, profile: simpleProfile }],
    [join(dir, `${id}.profile.full.json`), { distanceKm, detailedProfile: profilePoints(points) }],
  ]
  await Promise.all(outputs.map(([path, value]) => writeFile(path, JSON.stringify(value))))
  console.log(
    `GPX: ${event}/${id} (${points.length} izvornih točk, štirje izhodi + predogled/podrobni prikaz)`,
  )
}
