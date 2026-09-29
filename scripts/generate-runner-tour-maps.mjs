import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const projectRoot = process.cwd()
const env = await readFile(join(projectRoot, '.env'), 'utf8').catch(() => '')
const envValue = (name) => {
  const match = env.match(new RegExp(`^\\s*${name}\\s*=\\s*["']?([^\\r\\n"']+)["']?\\s*$`, 'm'))
  return match?.[1]?.trim() || ''
}
const token = process.env.NUXT_PUBLIC_MAPBOX_TOKEN || envValue('NUXT_PUBLIC_MAPBOX_TOKEN')
const style = process.env.NUXT_PUBLIC_MAPBOX_STYLE || envValue('NUXT_PUBLIC_MAPBOX_STYLE') ||
  'mapbox://styles/geo-mont/cmubd65wo00cp01qsa01fdsfn'

if (!token) throw new Error('NUXT_PUBLIC_MAPBOX_TOKEN is required to generate tour map images.')
const stylePath = style.replace(/^mapbox:\/\/styles\//, '').replace(/^\/+|\/+$/g, '')
if (!stylePath.includes('/')) throw new Error('NUXT_PUBLIC_MAPBOX_STYLE must identify a Mapbox style.')

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
  return points.map(([latitude, longitude]) => {
    const scaledLatitude = Math.round(latitude * 1e5)
    const scaledLongitude = Math.round(longitude * 1e5)
    const pair = encodeSigned(scaledLatitude - previousLatitude) + encodeSigned(scaledLongitude - previousLongitude)
    previousLatitude = scaledLatitude
    previousLongitude = scaledLongitude
    return pair
  }).join('')
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
await mkdir(outputRoot, { recursive: true })
const runners = await readdir(dataRoot, { withFileTypes: true })
const onlyRoute = process.argv[2]
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
    const color = effortColor(preview.distanceKm, preview.elevationGain, routeKey)
    const overlay = `path-6+${color}-1(${encodePolyline(preview.overviewRoute)})`
    const imageUrl = `https://api.mapbox.com/styles/v1/${stylePath}/static/${encodeURIComponent(overlay)}/auto/900x540?padding=48&access_token=${encodeURIComponent(token)}`
    if (imageUrl.length > 8192) throw new Error(`Static map URL is too long for ${runner.name}/${distanceId}.`)

    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error(`Mapbox image generation failed for ${runner.name}/${distanceId} (HTTP ${response.status}).`)
    const image = Buffer.from(await response.arrayBuffer())
    if (!response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error(`Mapbox returned a non-image response for ${runner.name}/${distanceId}.`)
    }

    await writeFile(join(outputRoot, `${runner.name}-${distanceId}.png`), image)
    generated += 1
    console.info(`Generated map image for ${runner.name}/${distanceId}.`)
  }
}

console.info(`Generated ${generated} runner tour map image${generated === 1 ? '' : 's'}.`)
