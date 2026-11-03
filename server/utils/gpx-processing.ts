import { XMLParser, XMLValidator } from 'fast-xml-parser'
import type { Buffer } from 'node:buffer'

type Point = {
  lat: number
  lon: number
  elevation: number | null
  distanceKm: number
  segment: number
}
const list = (v: any): any[] => (v == null ? [] : Array.isArray(v) ? v : [v])
const sample = <T>(items: T[], limit: number): T[] =>
  items.length <= limit
    ? items
    : Array.from(
        { length: limit },
        (_, i) => items[Math.round((i * (items.length - 1)) / (limit - 1))]!,
      )
const distance = (a: Point, b: Point) => {
  const r = Math.PI / 180
  const h =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lon - a.lon) * r) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(Math.min(1, h)))
}

/** Inert XML only. Waypoints and extension coordinates are not track points. */
export function processGpx(buffer: Buffer) {
  if (!buffer.length || buffer.length > 5242880)
    throw new Error('GPX je prevelik ali prazen (največ 5 MB).')
  const xml = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  if (/<!\s*(DOCTYPE|ENTITY)|<\s*(script|iframe)|<\?xml-stylesheet/i.test(xml))
    throw new Error('GPX vsebuje nedovoljene elemente.')
  if (XMLValidator.validate(xml) !== true) throw new Error('GPX ni veljaven XML.')
  const tree = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    processEntities: false,
  }).parse(xml)
  if (!tree.gpx || typeof tree.gpx !== 'object')
    throw new Error('GPX nima korenskega elementa GPX.')
  let nodes = 0
  function check(value: unknown, depth = 0) {
    if (depth > 35 || ++nodes > 350000) throw new Error('GPX je preveč zapleten.')
    if (value && typeof value === 'object') Object.values(value).forEach((v) => check(v, depth + 1))
  }
  check(tree.gpx)
  const tracks = list(tree.gpx.trk).flatMap((t) => list(t.trkseg).map((s) => list(s.trkpt)))
  const segments = tracks.some((s) => s.length)
    ? tracks
    : list(tree.gpx.rte).map((r) => list(r.rtept))
  const points: Point[] = []
  let distanceKm = 0,
    gain = 0,
    loss = 0
  segments.forEach((entries, segment) =>
    entries.forEach((raw) => {
      const lat = Number(raw['@_lat'] ?? NaN),
        lon = Number(raw['@_lon'] ?? NaN)
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180 ||
        raw['@_lat'] === '' ||
        raw['@_lon'] === ''
      )
        throw new Error('GPX vsebuje neveljavne koordinate.')
      const ele = raw.ele == null || raw.ele === '' ? null : Number(raw.ele)
      const elevation =
        ele != null && Number.isFinite(ele) && ele >= -12000 && ele <= 100000 ? ele : null
      const point: Point = { lat, lon, elevation, distanceKm: 0, segment }
      const previous = points.at(-1)
      if (previous?.segment === segment) {
        distanceKm += distance(previous, point)
        if (previous.elevation != null && elevation != null) {
          const delta = elevation - previous.elevation
          gain += Math.max(0, delta)
          loss += Math.max(0, -delta)
        }
      }
      point.distanceKm = distanceKm
      points.push(point)
      if (points.length > 100000) throw new Error('GPX ima več kot 100.000 točk.')
    }),
  )
  if (points.length < 2) throw new Error('GPX potrebuje vsaj dve točki sledi ali poti.')
  const elevationsComplete = points.every((p) => p.elevation != null)
  const elevations = points.flatMap((p) => (p.elevation == null ? [] : [p.elevation]))
  const coordinates = (items: Point[]) => items.map((p) => [p.lat, p.lon] as [number, number])
  const profilePoints = (items: Point[]) =>
    items.map((p) => ({ distanceKm: p.distanceKm, elevation: p.elevation }))
  // Preserve segment boundaries, sample by travelled distance, and bound detail payloads.
  const detail: Point[] = []
  let nextDistance = 0
  const spacing = Math.max(0.025, distanceKm / 6000)
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    if (
      !i ||
      p.segment !== points[i - 1]!.segment ||
      p.segment !== points[i + 1]?.segment ||
      p.distanceKm >= nextDistance
    ) {
      detail.push(p)
      nextDistance = p.distanceKm + spacing
    }
  }
  const overview = sample(detail, 80)
  const segmentStarts = (items: Point[]) =>
    items.flatMap((p, i) => (!i || p.segment !== items[i - 1]!.segment ? [i] : []))
  const common = {
    processingVersion: 1,
    pointCount: points.length,
    distanceKm: Number(distanceKm.toFixed(3)),
    elevationGain: elevationsComplete ? Math.round(gain) : null,
    elevationLoss: elevationsComplete ? Math.round(loss) : null,
    highestPoint: elevations.length ? Math.max(...elevations) : null,
    lowestPoint: elevations.length ? Math.min(...elevations) : null,
    elevationsComplete,
    segmentCount: segments.filter((s) => s.length).length,
  }
  const profile = elevationsComplete ? sample(detail, 64).map((p) => Math.round(p.elevation!)) : []
  const preview = {
    ...common,
    overviewRoute: coordinates(overview),
    segmentStarts: segmentStarts(overview),
    profile,
  }
  const artifacts = {
    'preview.json': preview,
    'detail.json': {
      ...common,
      route: coordinates(detail),
      segmentStarts: segmentStarts(detail),
      detailedProfile: elevationsComplete ? profilePoints(detail) : [],
    },
    'route.simple.json': { route: coordinates(overview), segmentStarts: segmentStarts(overview) },
    'route.full.json': { route: coordinates(points), segmentStarts: segmentStarts(points) },
    'profile.simple.json': { distanceKm, profile },
    'profile.full.json': { distanceKm, detailedProfile: profilePoints(points) },
  }
  return { details: { ...common, preview: coordinates(overview) }, artifacts }
}
