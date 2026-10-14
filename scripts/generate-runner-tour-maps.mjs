import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()
const env = await readFile(join(projectRoot, '.env'), 'utf8').catch(() => '')
const envValue = (name) => {
  const match = env.match(new RegExp(`^\\s*${name}\\s*=\\s*["']?([^\\r\\n"']+)["']?\\s*$`, 'm'))
  return match?.[1]?.trim() || ''
}
const token = process.env.NUXT_PUBLIC_MAPBOX_TOKEN || envValue('NUXT_PUBLIC_MAPBOX_TOKEN')
const style =
  process.env.NUXT_PUBLIC_MAPBOX_STYLE ||
  envValue('NUXT_PUBLIC_MAPBOX_STYLE') ||
  'mapbox://styles/geo-mont/cmubd65wo00cp01qsa01fdsfn'

if (!token) throw new Error('NUXT_PUBLIC_MAPBOX_TOKEN is required to generate tour map images.')
const stylePath = style.replace(/^mapbox:\/\/styles\//, '').replace(/^\/+|\/+$/g, '')
if (!stylePath.includes('/'))
  throw new Error('NUXT_PUBLIC_MAPBOX_STYLE must identify a Mapbox style.')

function encodeSigned(value) {
  let encoded = value < 0 ? ~(value << 1) : value << 1
  let result = ''
  while (encoded >= 0x20) {
    result += String.fromCharCode((0x20 | (encoded & 0x1f)) + 63)
    encoded >>= 5
  }
  return result + String.fromCharCode(encoded + 63)
}

function encodePolyline(points) {
  let previousLatitude = 0
  let previousLongitude = 0
  return points
    .map(([latitude, longitude]) => {
      const scaledLatitude = Math.round(latitude * 1e5)
      const scaledLongitude = Math.round(longitude * 1e5)
      const pair =
        encodeSigned(scaledLatitude - previousLatitude) +
        encodeSigned(scaledLongitude - previousLongitude)
      previousLatitude = scaledLatitude
      previousLongitude = scaledLongitude
      return pair
    })
    .join('')
}

// Ramer-Douglas-Peucker retains bends from the full GPX rather than sampling
// every nth point, which can cut across switchbacks.
function simplifyRoute(points, tolerance) {
  const projected = points.map(([latitude, longitude]) => [
    longitude,
    Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360)) * (180 / Math.PI),
  ])
  const keep = new Uint8Array(points.length)
  keep[0] = keep[points.length - 1] = 1
  const stack = [[0, points.length - 1]]
  const toleranceSquared = tolerance * tolerance
  while (stack.length) {
    const [start, end] = stack.pop()
    const [ax, ay] = projected[start]
    const [bx, by] = projected[end]
    const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2
    let greatest = 0
    let selected = -1
    for (let index = start + 1; index < end; index++) {
      const [px, py] = projected[index]
      const fraction = lengthSquared
        ? Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lengthSquared))
        : 0
      const distanceSquared =
        (px - ax - fraction * (bx - ax)) ** 2 + (py - ay - fraction * (by - ay)) ** 2
      if (distanceSquared > greatest) {
        greatest = distanceSquared
        selected = index
      }
    }
    if (selected !== -1 && greatest > toleranceSquared) {
      keep[selected] = 1
      stack.push([start, selected], [selected, end])
    }
  }
  return points.filter((_, index) => keep[index])
}

function encodeDetailedRoute(points) {
  const maxEncodedLength = 6500
  const encoded = (tolerance) => encodePolyline(simplifyRoute(points, tolerance))
  const fits = (route) => encodeURIComponent(route).length <= maxEncodedLength
  const complete = encoded(0)
  if (fits(complete)) return complete
  let lower = 0
  let upper = 0.00001
  while (!fits(encoded(upper))) upper *= 2
  for (let attempt = 0; attempt < 14; attempt++) {
    const middle = (lower + upper) / 2
    if (fits(encoded(middle))) upper = middle
    else lower = middle
  }
  return encoded(upper)
}

// The Julian Alps route is classified from the published race data used by the
// card, which is slightly lower than the raw GPX preview measurements.
const categoryOverrides = new Map([['nejc-ursic/julian-alps-trail-run', '20K']])

function effortColor(distanceKm, elevationGain, routeKey) {
  const override = categoryOverrides.get(routeKey)
  if (override === '20K') return 'd6b529'
  const effort = Math.round((distanceKm + elevationGain / 100) * 10) / 10
  if (effort < 20) return '89939b'
  if (effort < 50) return 'd6b529'
  if (effort < 100) return 'd8792c'
  if (effort < 160) return '3e8d68'
  return 'ba4b4f'
}

const dataRoot = join(projectRoot, 'data', 'gpx')
const outputRoot = join(projectRoot, 'public', 'images', 'tour-maps')
const mapVariants = [
  { suffix: '', size: '900x540', padding: 50 },
  { suffix: '-portrait', size: '700x900', padding: '100,85,180,85' },
]
await mkdir(outputRoot, { recursive: true })
const runners = await readdir(dataRoot, { withFileTypes: true })
const onlyRoute = process.argv.slice(2).find((argument) => !argument.startsWith('--'))
const missingOnly = process.argv.includes('--missing')
let generated = 0

for (const runner of runners.filter((entry) => entry.isDirectory())) {
  const runnerDirectory = join(dataRoot, runner.name)
  const files = await readdir(runnerDirectory)
  for (const file of files.filter((name) => name.endsWith('.json'))) {
    const preview = JSON.parse(await readFile(join(runnerDirectory, file), 'utf8'))
    if (!Array.isArray(preview.overviewRoute) || preview.overviewRoute.length < 2) continue

    const distanceId = preview.distanceId || file.replace(/\.json$/, '')
    const routeKey = `${runner.name}/${distanceId}`
    if (onlyRoute && routeKey !== onlyRoute) continue
    const missingVariants = mapVariants.filter(
      ({ suffix }) => !existsSync(join(outputRoot, `${runner.name}-${distanceId}${suffix}.png`)),
    )
    if (missingOnly && !missingVariants.length) continue

    const fullRoute = JSON.parse(
      await readFile(
        join(projectRoot, 'public', 'gpx', 'runners', runner.name, `${distanceId}.route.full.json`),
        'utf8',
      ),
    ).route
    if (!Array.isArray(fullRoute) || fullRoute.length < 2)
      throw new Error(`Full GPX route is missing for ${routeKey}.`)
    const color = effortColor(preview.distanceKm, preview.elevationGain, routeKey)
    const overlay = `path-6+${color}-1(${encodeDetailedRoute(fullRoute)})`
    for (const { suffix, size, padding } of mapVariants) {
      const outputPath = join(outputRoot, `${runner.name}-${distanceId}${suffix}.png`)
      if (missingOnly && existsSync(outputPath)) continue
      const imageUrl = `https://api.mapbox.com/styles/v1/${stylePath}/static/${encodeURIComponent(overlay)}/auto/${size}?padding=${padding}&access_token=${encodeURIComponent(token)}`
      if (imageUrl.length > 8192) throw new Error(`Static map URL is too long for ${routeKey}.`)

      const response = await fetch(imageUrl)
      if (!response.ok)
        throw new Error(
          `Mapbox image generation failed for ${routeKey}${suffix} (HTTP ${response.status}).`,
        )
      const image = Buffer.from(await response.arrayBuffer())
      if (!response.headers.get('content-type')?.startsWith('image/')) {
        throw new Error(`Mapbox returned a non-image response for ${routeKey}${suffix}.`)
      }

      await writeFile(outputPath, image)
      generated += 1
      console.info(`Generated map image for ${routeKey}${suffix}.`)
    }
  }
}

console.info(`Generated ${generated} runner tour map image${generated === 1 ? '' : 's'}.`)
