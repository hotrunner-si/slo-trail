import { readRaceCatalog } from './lib/catalog.mjs'
import { importPreview } from './lib/gpx.mjs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative } from 'node:path'

const [input, eventSlug, distanceId] = process.argv.slice(2)
async function importRunnerTracks() {
  const root = join(process.cwd(), 'data', 'gpx')
  for (const runner of (await readdir(root, { withFileTypes: true })).filter((entry) =>
    entry.isDirectory(),
  )) {
    for (const entry of await readdir(join(root, runner.name))) {
      if (!entry.endsWith('.json')) continue
      const preview = JSON.parse(await readFile(join(root, runner.name, entry), 'utf8'))
      await importPreview(
        join(process.cwd(), 'public', 'gpx', 'runners', runner.name, preview.source),
        `runners/${runner.name}`,
        preview.distanceId,
      )
    }
  }
}
if (input === '--runners') {
  await importRunnerTracks()
  process.exit(0)
}
if (input === '--all') {
  const races = await readRaceCatalog()
  const slugify = (value) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  const aliases = {
    'roznik-trail': {
      'roznik-5.8.gpx': 'trasa-krajsi-trail',
      'roznik-8.8.gpx': 'trasa-srednji-trail',
      'roznik-17.6.gpx': 'trasa-daljsii-trail',
    },
    'triglav-trail-run': {
      'triglav-trail-14km.gpx': 'slovenian-alpine-museum-run',
      'triglav-trail-26km.gpx': 'vrata-valley-race',
      'triglav-trail-44km.gpx': 'triglav-lakes-race',
      'triglav-trail-101km.gpx': 'triglav-trail-race',
    },
    'velenje-trail': { 'velenje-trail-druzinski-10km.gpx': 'druzinski-trail' },
    'trail-tek-zelene-doline': { 'golte-hribar-22km.gpx': 'hribar' },
    '6-ur-crete': { '6ur-crete.gpx': 'ponavljajoca-trasa' },
    '6-ur-spanovega-vrha': { '6ur-spanov-vrh.gpx': 'ponavljajoca-trasa' },
    '7-ur-slivnice': { '7ur_slivnice.gpx': 'ponavljajoca-trasa' },
    '8-ur-sv-ane': { '8ur-svete-ane.gpx': 'ponavljajoca-trasa' },
    go4trail: {
      'go4trail-13-2026.gpx': 'go-trim',
      'go4trail_28km_2026.gpx': 'go-3v',
      'go4trail_ultra_2026.gpx': 'go-ultra',
    },
    'haloze-trail': {
      'Haloze_Trail_2025_dolga_final.gpx': 'trasa-2',
      'Haloze_Trail_2025_kratka_final.gpx': 'trasa-1',
    },
    'hrastnik-trail': {
      'HrastnikTrail-Razglednih-12.gpx': 'r12-razglednih-12',
      'HrastnikTrail-Turisticnih-6.gpx': 't6-turisticnih-6',
    },
    'julian-alps-trail-run-by-utmb': {
      'JAT_10_km_2026.gpx': 'funny-10k',
      'JAT_15_km_2026.gpx': 'intersport-speed-15k',
      'JAT_25_km_2026.gpx': 'kranjska-gora-25k',
      'JAT_50_km_2026.gpx': 'sky-trail-50k',
      'JAT_80_km_2026.gpx': 'lake-bled-80k',
      'JAT_120_km_2026.gpx': 'i-feel-slovenia-120k',
    },
    'k24-ultra-trail': {
      'K24-10km.gpx': 'friday-shorty-10km',
      'K24_24km.gpx': 'k24-trail-24km',
      'K24_50km.gpx': 'gorski-maraton-50km',
      'K24-100km.gpx': 'k24-trail-100km',
    },
    'kbk-trail': { 'KBK2026-nova.gpx': 'proga' },
    'knap-trail': {
      'Knap_Trail_TKratka_16km_GPX.gpx': 't-kratka',
      'Knap_Trail_T_SREDNA_2024.gpx': 't-sredna',
      'Knap_Trail_T_DOUGA_2024.gpx': 't-douga',
    },
    'kocevsko-outdoor-festival': {
      'KOF_5_km.gpx': 'bambi-trail',
      'KOF_10_km.gpx': 'fox-trail',
      'KOF_15_km.gpx': 'lynx-trail',
      'KOF_25_km.gpx': 'deer-trail',
      'KOF_30_km.gpx': 'wolf-trail',
      'KOF_50_km.gpx': 'bear-trail',
      'KOF-vertikal.gpx': 'vertikal-fridrihstajn',
    },
    'kras-trail': {
      'kras-trail-10km.gpx': 'kratka-razdalja',
      'KRAS TRAIL 29K 2027.gpx': 'srednja-razdalja',
      'KRAS TRAIL ULTRA 2027.gpx': 'dolga-razdalja',
    },
    'kriska-gora-trail': { 'KGT-Vertikal-KM.gpx': 'vertikala' },
    'lahinja-trail': {
      'lahinja_trail_2026_10km.gpx': 'duma',
      'lahinja_trail_2026_18km.gpx': 'velikobukovska',
      'lahinja_trail_2025_31km.gpx': 'republikanka',
    },
    'loncarija-tece': { 'Poticnica-loncarija.gpx': 'poticnica' },
    'obala-ultra-trail': {
      'obala-ultra-trail-2026-11-km.gpx': 'obala-trail-11km',
      'obala-ultra-trail-2026-17-km.gpx': 'obala-trail-17km',
      'obala-ultra-trail-2026-35-km.gpx': 'obala-trail-35km',
      'obala-ultra-trail-2026-64-km.gpx': 'obala-ultra-trail-64km',
      'obala-ultra-trail-2026-108-km.gpx': 'obala-ultra-trail-108km',
    },
    'podbrdo-trail-running-festival': {
      'RT10_ptrf.gpx': 'rapallo-trail',
      'podbrdo-trail-running-festival-2026-gt-20-km.gpx': 'graparski-trail',
      'podbrdo-trail-running-festival-2026-gm4o-40-km.gpx': 'gorski-maraton-4-obcin-gm40',
      'podbrdo-trail-running-festival-2026-utp-70-km.gpx': 'ultra-trail-puseljc-70-utp-70',
      'podbrdo-trail-running-festival-2026-utp-100-km.gpx': 'ultra-trail-puseljc-100-utp-100',
    },
    'pol-sihta-na-farbanco': { 'Farbanca.gpx': 'ponavljajoca-trasa' },
    ponikva4trail: { 'ponikva-23km-2026.gpx': 'trasa-tek' },
    'ribnica-trail': {
      'CEBULARCA.gpx': 'cebular-ca',
      'KUHAVNCA.gpx': 'kuhavn-ca',
      'RIBEZN.gpx': 'ribez-n',
    },
    'savinjski-k6-trail': { 'savinjska-trail-28km.gpx': 'k6-trasa' },
    'soca-outdoor-festival': {
      'SOF26_05KM.gpx': 'hempika-5km',
      'SOF26_10KM.gpx': 'continental-10km',
      'SOF26_15KM.gpx': 'adidas-terrex-15km',
      'SOF26_25KM.gpx': 'la-primafit-25km',
      'SOF26_35KM.gpx': 'ford-35km',
      'SOF26_50KM.gpx': 'i-feel-slovenia-50km',
      'SOF26_VERTIKAL.gpx': 'vertikal',
    },
    'trail-po-kraskih-klancih': {
      'Trail po kraških klancih 12km.gpx': 'trasa-1',
      'Trail po kraških klancih 19km.gpx': 'trasa-2',
    },
    'trail-velika-planina': {
      'vp-7.gpx': 'kratka-trasa',
      'vp-13.gpx': 'srednja-trasa',
      'vp-29.gpx': 'dolga-trasa',
    },
    'ultra-trail-vipava-valley': {
      'ultra-trail-vipava-valley-i-feel-slovenia-2026-castra-10-k_10042026.gpx': 'city-run',
    },
    'zaplana-trail': {
      'zaplana-4.gpx': 'napoleonovih-4',
      'zaplana-13.gpx': 'rimljanskih-13',
      'zaplana-26.gpx': 'cankarjevih-27',
    },
    'zimski-trail-tek-bohinj': { 'Bohinj-soriska-en-krog.gpx': 'kratka-trasa-1-krog' },
  }
  const files = async (dir) =>
    (await readdir(dir, { withFileTypes: true })).flatMap((entry) =>
      entry.isDirectory()
        ? []
        : entry.name.toLowerCase().endsWith('.gpx')
          ? [join(dir, entry.name)]
          : [],
    )
  const roots = await readdir(join(process.cwd(), 'public', 'gpx'), { withFileTypes: true })
  let imported = 0,
    unmatched = []
  const rawFiles = {}
  for (const root of roots.filter((entry) => entry.isDirectory())) {
    const race = races.get(root.name)
    if (!race) continue
    for (const path of await files(join(process.cwd(), 'public', 'gpx', root.name))) {
      const filename = basename(path),
        normalized = slugify(basename(path, extname(path)))
      const systematic = [...race.distances.values()].filter(({ id, km }) => {
        const kmText = String(km)
        const course = id.replace(new RegExp(`-${kmText.replace('.', '\\.')}k(?:m)?$`), '')
        return km > 0
          ? filename === `${root.name}-${course}-${kmText}km.gpx`
          : filename.startsWith(`${root.name}-${id}-`) && filename.endsWith('km.gpx')
      })
      const candidates = [...race.distances.keys()].filter(
        (id) => normalized === slugify(id) || normalized.includes(slugify(id)),
      )
      const selectedId =
        systematic.length === 1
          ? systematic[0].id
          : aliases[root.name]?.[filename] || (candidates.length === 1 ? candidates[0] : undefined)
      const distance = selectedId && race.distances.get(selectedId)
      if (!distance || !selectedId) {
        unmatched.push(`${relative(process.cwd(), path)} (${race.name})`)
        continue
      }
      await importPreview(path, root.name, selectedId, distance)
      ;(rawFiles[root.name] ||= {})[selectedId] = `/gpx/${root.name}/${filename}`
      imported++
    }
  }
  console.log(`Uvoženih ${imported} tras.`)
  if (unmatched.length)
    console.log(`Brez enolične povezave (${unmatched.length}):\n${unmatched.join('\n')}`)
  await writeFile(
    join(process.cwd(), 'data', 'gpxManifest.ts'),
    `// Generated by npm run gpx:import-all.\nexport const gpxManifest: Record<string, Record<string, string>> = ${JSON.stringify(rawFiles, null, 2)}\n`,
  )
  await importRunnerTracks()
  process.exit(0)
}
if (!input || !eventSlug || !distanceId) {
  console.error('Uporaba: npm run gpx:import -- <datoteka.gpx> <event-slug> <distance-id>')
  process.exit(1)
}

await importPreview(input, eventSlug, distanceId)
