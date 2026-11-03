import sharp from 'sharp'
import type { GpxData } from '../../types/gpx'
/** Local route illustrations. No private coordinates are sent to a map provider. */
export async function gpxThumbnails(data: GpxData) {
  const route = data.route || []
  if (route.length < 2) throw new Error('GPX nima dovolj točk.')
  const south = Math.min(...route.map((p) => p[0])),
    north = Math.max(...route.map((p) => p[0]))
  const west = Math.min(...route.map((p) => p[1])),
    east = Math.max(...route.map((p) => p[1]))
  const cos = Math.max(0.05, Math.cos((((south + north) / 2) * Math.PI) / 180))
  const result: Record<string, Buffer> = {}
  for (const [name, width, height] of [
    ['map.webp', 900, 540],
    ['map-portrait.webp', 700, 900],
  ] as const) {
    const scale = Math.min(
      (width - 120) / Math.max((east - west) * cos, 0.00001),
      (height - 140) / Math.max(north - south, 0.00001),
    )
    const left = (width - (east - west) * cos * scale) / 2,
      top = (height - (north - south) * scale) / 2
    const starts = data.segmentStarts?.length ? data.segmentStarts : [0]
    const paths = starts
      .map((s, i) =>
        route
          .slice(s, starts[i + 1] ?? route.length)
          .map(
            ([lat, lon], j) =>
              `${j ? 'L' : 'M'}${(left + (lon - west) * cos * scale).toFixed(1)},${(height - top - (lat - south) * scale).toFixed(1)}`,
          )
          .join(' '),
      )
      .join(' ')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><pattern id="g" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#d9e2d1"/></pattern></defs><rect width="100%" height="100%" fill="#eef2e8"/><rect width="100%" height="100%" fill="url(#g)"/><path d="${paths}" fill="none" stroke="white" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/><path d="${paths}" fill="none" stroke="#315736" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/><text x="28" y="${height - 25}" font-family="sans-serif" font-size="16" fill="#315736">Predogled sledi GPX</text></svg>`
    result[name] = await sharp(Buffer.from(svg)).webp({ quality: 85 }).toBuffer()
  }
  return result
}
