import { readRaceCatalog } from './lib/catalog.mjs'
import { readFile, readdir, rename } from 'node:fs/promises'
import { join } from 'node:path'

const root = join(process.cwd(), 'public', 'gpx')
const races = new Map(
  [...(await readRaceCatalog())].map(([slug, race]) => [
    slug,
    new Map([...race.distances].map(([id, distance]) => [id, distance.km])),
  ]),
)

const moves = []
for (const folder of await readdir(root, { withFileTypes: true })) {
  if (!folder.isDirectory() || folder.name === 'runners') continue
  const distances = races.get(folder.name)
  if (!distances) throw new Error(`Neznana tekma: ${folder.name}`)
  const dir = join(root, folder.name)
  const names = await readdir(dir)
  const sources = new Map()
  for (const name of names.filter(
    (name) =>
      name.endsWith('.json') &&
      !/\.(?:detail|route\.(?:simple|full)|profile\.(?:simple|full))\.json$/.test(name),
  )) {
    const preview = JSON.parse(await readFile(join(dir, name), 'utf8'))
    if (!preview.source || !distances.has(preview.distanceId))
      throw new Error(`Manjkajoča povezava: ${folder.name}/${name}`)
    if (sources.has(preview.source))
      throw new Error(`Podvojen vir: ${folder.name}/${preview.source}`)
    sources.set(preview.source, preview)
  }
  for (const name of names.filter((name) => name.toLowerCase().endsWith('.gpx'))) {
    const preview = sources.get(name)
    if (!preview) throw new Error(`GPX brez trase: ${folder.name}/${name}`)
    const officialKm = distances.get(preview.distanceId)
    const km = officialKm > 0 ? officialKm : Number(preview.distanceKm.toFixed(1))
    const kmText = String(km)
    const course = preview.distanceId.replace(
      new RegExp(`-${kmText.replace('.', '\\.')}k(?:m)?$`),
      '',
    )
    const target = `${folder.name}-${course}-${kmText}km.gpx`
    if (target !== name)
      moves.push({
        from: join(dir, name),
        to: join(dir, target),
        label: `${folder.name}/${name} → ${target}`,
      })
  }
}
const targets = new Set(moves.map((move) => move.to.toLowerCase()))
if (targets.size !== moves.length) throw new Error('Dve GPX datoteki bi dobili isto ime.')
for (const move of moves) await rename(move.from, move.to)
console.log(`Preimenovanih ${moves.length} GPX datotek.`)
