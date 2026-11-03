export const gpxDetailFile = (file: string) => file.replace(/\.json$/, '.detail.json')

export function geographicRoutePoints(route: number[][]) {
  const points = route.filter(
    (p): p is [number, number] => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]),
  )
  if (!points.length) return ''
  let south = Infinity,
    north = -Infinity,
    west = Infinity,
    east = -Infinity
  for (const [lat, lng] of points) {
    south = Math.min(south, lat)
    north = Math.max(north, lat)
    west = Math.min(west, lng)
    east = Math.max(east, lng)
  }
  const longitudeScale = Math.cos((((south + north) / 2) * Math.PI) / 180)
  const latSpan = Math.max(north - south, 0.0001),
    lngSpan = Math.max((east - west) * longitudeScale, 0.0001)
  const scale = Math.min(78 / lngSpan, 78 / latSpan)
  const left = (100 - lngSpan * scale) / 2,
    top = (100 - latSpan * scale) / 2
  return points
    .map(
      ([lat, lng]) =>
        `${(left + (lng - west) * longitudeScale * scale).toFixed(2)},${(100 - top - (lat - south) * scale).toFixed(2)}`,
    )
    .join(' ')
}

export function elevationPoints(
  profile: number[],
  width: number,
  height: number,
  top = 6,
  bottom = 4,
) {
  if (!profile.length) return ''
  let low = Infinity,
    high = -Infinity
  for (const value of profile) {
    low = Math.min(low, value)
    high = Math.max(high, value)
  }
  const span = Math.max(high - low, 1)
  return profile
    .map(
      (value, index) =>
        `${((index / Math.max(profile.length - 1, 1)) * width).toFixed(2)},${(height - bottom - ((value - low) / span) * (height - top - bottom)).toFixed(2)}`,
    )
    .join(' ')
}
