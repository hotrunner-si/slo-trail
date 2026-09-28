import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const dir = join(process.cwd(), 'public/gpx/zimski-trail-tek-bohinj')
const source = 'zimski-trail-tek-bohinj-kratka-trasa-1-krog-6km.gpx'
const xml = await readFile(join(dir, source), 'utf8')
const points = [...xml.matchAll(/<trkpt\b[^>]*>[\s\S]*?<\/trkpt>/g)].map((match) =>
  match[0].replace(/<time>[^<]*<\/time>/g, ''),
)
if (points.length < 2) throw new Error('Kratka trasa nima dovolj točk za ponavljanje.')

for (const [laps, id, title, km] of [
  [2, 'srednja-trasa-2-kroga', 'Srednja trasa (2 kroga)', 12],
  [3, 'dolga-trasa-3-krogi', 'Dolga trasa (3 krogi)', 18],
]) {
  const name = `Zimski trail tek Bohinj — ${title}`
  const repeated = Array.from({ length: laps }, () => points).flat().join('\n')
  const result = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Trail Slovenija" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>
    <desc>Izpeljana trasa: ${laps} ponovitve kratke trase iz ${source}. Koordinate in višine so ohranjene iz izvorne datoteke.</desc>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${repeated}
    </trkseg>
  </trk>
</gpx>
`
  const file = `zimski-trail-tek-bohinj-${id}-${km}km.gpx`
  await writeFile(join(dir, file), result)
  console.log(`${file}: ${laps} krogi, ${points.length * laps} točk`)
}
