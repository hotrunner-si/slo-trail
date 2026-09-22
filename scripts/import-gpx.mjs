import { readFile, mkdir, readdir, writeFile } from 'node:fs/promises'
import { basename, extname, join, relative } from 'node:path'

const [input, eventSlug, distanceId] = process.argv.slice(2)
if (input === '--all') {
  const catalog = await readFile(join(process.cwd(), 'data', 'races.ts'), 'utf8')
  const raceBlocks = [...catalog.matchAll(/\{ id:'[^']+', slug:'([^']+)', name:'([^']+)'[\s\S]*?distances:\[([\s\S]*?)\] \}/g)]
  const races = new Map(raceBlocks.map(([, slug, name, distances]) => [slug, {
    name,
    distances: new Map([...distances.matchAll(/\{ id:'([^']+)'[\s\S]*?km:([\d.]+)/g)].map(([, id, km]) => [id, { id, km:Number(km) }]))
  }]))
  const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const aliases = {
    '6-ur-crete': { '6ur-crete.gpx':'ponavljajoca-trasa' }, '6-ur-spanovega-vrha': { '6ur-spanov-vrh.gpx':'ponavljajoca-trasa' },
    '7-ur-slivnice': { '7ur_slivnice.gpx':'ponavljajoca-trasa' }, '8-ur-sv-ane': { '8ur-svete-ane.gpx':'ponavljajoca-trasa' },
    'go4trail': { 'go4trail-13-2026.gpx':'go-trim','go4trail_28km_2026.gpx':'go-3v','go4trail_ultra_2026.gpx':'go-ultra' },
    'haloze-trail': { 'Haloze_Trail_2025_dolga_final.gpx':'trasa-2','Haloze_Trail_2025_kratka_final.gpx':'trasa-1' },
    'hrastnik-trail': { 'HrastnikTrail-Razglednih-12.gpx':'r12-razglednih-12','HrastnikTrail-Turisticnih-6.gpx':'t6-turisticnih-6' },
    'julian-alps-trail-run-by-utmb': { 'JAT_10_km_2026.gpx':'funny-10k','JAT_15_km_2026.gpx':'intersport-speed-15k','JAT_25_km_2026.gpx':'kranjska-gora-25k','JAT_50_km_2026.gpx':'sky-trail-50k','JAT_80_km_2026.gpx':'lake-bled-80k','JAT_120_km_2026.gpx':'i-feel-slovenia-120k' },
    'k24-ultra-trail': { 'K24-10km.gpx':'friday-shorty-10km','K24_24km.gpx':'k24-trail-24km','K24_50km.gpx':'gorski-maraton-50km','K24-100km.gpx':'k24-trail-100km' },
    'kbk-trail': { 'KBK2026-nova.gpx':'proga' }, 'knap-trail': { 'Knap_Trail_TKratka_16km_GPX.gpx':'t-kratka','Knap_Trail_T_SREDNA_2024.gpx':'t-sredna','Knap_Trail_T_DOUGA_2024.gpx':'t-douga' },
    'kocevsko-outdoor-festival': { 'KOF_5_km.gpx':'bambi-trail','KOF_10_km.gpx':'fox-trail','KOF_15_km.gpx':'lynx-trail','KOF_25_km.gpx':'deer-trail','KOF_30_km.gpx':'wolf-trail','KOF_50_km.gpx':'bear-trail','KOF-vertikal.gpx':'vertikal-fridrihstajn' },
    'kras-trail': { 'kras-trail-10km.gpx':'kratka-razdalja','KRAS TRAIL 29K 2027.gpx':'srednja-razdalja','KRAS TRAIL ULTRA 2027.gpx':'dolga-razdalja' },
    'kriska-gora-trail': { 'KGT-Vertikal-KM.gpx':'vertikala' },
    'lahinja-trail': { 'lahinja_trail_2026_10km.gpx':'duma','lahinja_trail_2026_18km.gpx':'velikobukovska','lahinja_trail_2025_31km.gpx':'republikanka' },
    'loncarija-tece': { 'Poticnica-loncarija.gpx':'poticnica' },
    'obala-ultra-trail': { 'obala-ultra-trail-2026-11-km.gpx':'obala-trail-11km','obala-ultra-trail-2026-17-km.gpx':'obala-trail-17km','obala-ultra-trail-2026-35-km.gpx':'obala-trail-35km','obala-ultra-trail-2026-64-km.gpx':'obala-ultra-trail-64km','obala-ultra-trail-2026-108-km.gpx':'obala-ultra-trail-108km' },
    'podbrdo-trail-running-festival': { 'RT10_ptrf.gpx':'rapallo-trail','podbrdo-trail-running-festival-2026-gt-20-km.gpx':'graparski-trail','podbrdo-trail-running-festival-2026-gm4o-40-km.gpx':'gorski-maraton-4-obcin-gm40','podbrdo-trail-running-festival-2026-utp-70-km.gpx':'ultra-trail-puseljc-70-utp-70','podbrdo-trail-running-festival-2026-utp-100-km.gpx':'ultra-trail-puseljc-100-utp-100' },
    'pol-sihta-na-farbanco': { 'Farbanca.gpx':'ponavljajoca-trasa' }, 'ponikva4trail': { 'ponikva-23km-2026.gpx':'trasa-tek' },
    'ribnica-trail': { 'CEBULARCA.gpx':'cebular-ca','KUHAVNCA.gpx':'kuhavn-ca','RIBEZN.gpx':'ribez-n' },
    'savinjski-k6-trail': { 'savinjska-trail-28km.gpx':'k6-trasa' },
    'soca-outdoor-festival': { 'SOF26_05KM.gpx':'hempika-5km','SOF26_10KM.gpx':'continental-10km','SOF26_15KM.gpx':'adidas-terrex-15km','SOF26_25KM.gpx':'la-primafit-25km','SOF26_35KM.gpx':'ford-35km','SOF26_50KM.gpx':'i-feel-slovenia-50km','SOF26_VERTIKAL.gpx':'vertikal' },
    'trail-po-kraskih-klancih': { 'Trail po kraških klancih 12km.gpx':'trasa-1','Trail po kraških klancih 19km.gpx':'trasa-2' },
    'trail-velika-planina': { 'vp-7.gpx':'kratka-trasa','vp-13.gpx':'srednja-trasa','vp-29.gpx':'dolga-trasa' },
    'ultra-trail-vipava-valley': { 'ultra-trail-vipava-valley-i-feel-slovenia-2026-castra-10-k_10042026.gpx':'city-run' },
    'zaplana-trail': { 'zaplana-4.gpx':'napoleonovih-4','zaplana-13.gpx':'rimljanskih-13','zaplana-26.gpx':'cankarjevih-27' },
    'zimski-trail-tek-bohinj': { 'Bohinj-soriska-en-krog.gpx':'kratka-trasa-1-krog' }
  }
  const files = async dir => (await readdir(dir, { withFileTypes: true })).flatMap(entry => entry.isDirectory() ? [] : entry.name.toLowerCase().endsWith('.gpx') ? [join(dir, entry.name)] : [])
  const roots = await readdir(join(process.cwd(), 'public', 'gpx'), { withFileTypes: true })
  let imported = 0, unmatched = []
  const rawFiles = {}
  for (const root of roots.filter(entry => entry.isDirectory())) {
    const race = races.get(root.name)
    if (!race) continue
    for (const path of await files(join(process.cwd(), 'public', 'gpx', root.name))) {
      const filename = basename(path), normalized = slugify(basename(path, extname(path)))
      const systematic = [...race.distances.values()].filter(({id,km}) => {
        const kmText=String(km)
        const course=id.replace(new RegExp(`-${kmText.replace('.', '\\.')}k(?:m)?$`),'')
        return km > 0 ? filename === `${root.name}-${course}-${kmText}km.gpx` : filename.startsWith(`${root.name}-${id}-`) && filename.endsWith('km.gpx')
      })
      const candidates = [...race.distances.keys()].filter(id => normalized === slugify(id) || normalized.includes(slugify(id)))
      const selectedId = systematic.length === 1 ? systematic[0].id : aliases[root.name]?.[filename] || (candidates.length === 1 ? candidates[0] : undefined)
      const distance = selectedId && race.distances.get(selectedId)
      if (!distance || !selectedId) { unmatched.push(`${relative(process.cwd(), path)} (${race.name})`); continue }
      await importPreview(path, root.name, selectedId, distance)
      ;(rawFiles[root.name] ||= {})[selectedId] = `/gpx/${root.name}/${filename}`
      imported++
    }
  }
  console.log(`Uvoženih ${imported} tras.`)
  if (unmatched.length) console.log(`Brez enolične povezave (${unmatched.length}):\n${unmatched.join('\n')}`)
  await writeFile(join(process.cwd(), 'data', 'gpxManifest.ts'), `// Generated by npm run gpx:import-all.\nexport const gpxManifest: Record<string, Record<string, string>> = ${JSON.stringify(rawFiles, null, 2)}\n`)
  process.exit(0)
}
if (!input || !eventSlug || !distanceId) {
  console.error('Uporaba: npm run gpx:import -- <datoteka.gpx> <event-slug> <distance-id>')
  process.exit(1)
}

await importPreview(input, eventSlug, distanceId)

async function importPreview(inputPath, event, id, metadata = {}) {
const xml = await readFile(inputPath, 'utf8')
const matches = [...xml.matchAll(/<(?:trkpt|rtept)\b([^>]*)>([\s\S]*?)<\/(?:trkpt|rtept)>|<(?:trkpt|rtept)\b([^>]*)\/>/g)]
const raw = matches.map(match => { const attrs=match[1]||match[3]||'', lat=attrs.match(/\blat="([^"]+)"/)?.[1], lng=attrs.match(/\blon="([^"]+)"/)?.[1], ele=match[2]?.match(/<ele>([^<]+)<\/ele>/)?.[1]??0; return {lat:Number(lat),lng:Number(lng),ele:Number(ele)} }).filter(point => Number.isFinite(point.lat+point.lng+point.ele))
if (raw.length < 2) throw new Error('GPX ne vsebuje dovolj veljavnih <trkpt> točk z višino.')

const haversine = (a,b) => { const r=6371, rad=Math.PI/180, dLat=(b.lat-a.lat)*rad, dLng=(b.lng-a.lng)*rad; const x=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLng/2)**2; return 2*r*Math.asin(Math.sqrt(x)) }
let distanceKm=0, elevationGain=0, elevationLoss=0
const measured=[{...raw[0],distanceKm:0}]
for(let i=1;i<raw.length;i++){ distanceKm+=haversine(raw[i-1],raw[i]); measured.push({...raw[i],distanceKm}); const diff=raw[i].ele-raw[i-1].ele; if(diff>0)elevationGain+=diff; else elevationLoss-=diff }

const sampleByDistance = (items, spacingKm) => {
  const result=[items[0]]; let target=spacingKm; let cursor=1
  while(target<distanceKm && cursor<items.length){
    while(cursor<items.length && items[cursor].distanceKm<target)cursor++
    if(cursor>=items.length)break
    const a=items[cursor-1],b=items[cursor],span=b.distanceKm-a.distanceKm||1,t=(target-a.distanceKm)/span
    result.push({lat:a.lat+(b.lat-a.lat)*t,lng:a.lng+(b.lng-a.lng)*t,ele:a.ele+(b.ele-a.ele)*t,distanceKm:target});target+=spacingKm
  }
  result.push(items.at(-1)); return result
}
const sample = (items, count) => Array.from({length:Math.min(count,items.length)},(_,i)=>items[Math.round(i*(items.length-1)/(Math.min(count,items.length)-1))])
// Detail keeps a point at least every 100 m; the overview remains cheap enough for 200+ simultaneous routes.
const detail=sampleByDistance(measured,.075)
const overview=sample(detail,Math.min(80,Math.max(24,Math.ceil(distanceKm*1.4))))
const route = detail.map(p=>[Number(p.lat.toFixed(6)),Number(p.lng.toFixed(6))])
const overviewRoute = overview.map(p=>[Number(p.lat.toFixed(6)),Number(p.lng.toFixed(6))])
const detailedProfile = detail.map(p=>({distanceKm:Number(p.distanceKm.toFixed(3)),elevation:Math.round(p.ele)}))
const profile = sample(detail,64).map(p=>Math.round(p.ele))
const common = { source:basename(inputPath), eventSlug:event, distanceId:id, ...metadata, generatedAt:new Date().toISOString(), distanceKm:Number(distanceKm.toFixed(2)), elevationGain:Math.round(elevationGain), elevationLoss:Math.round(elevationLoss), highestPoint:Math.round(Math.max(...raw.map(p=>p.ele))), lowestPoint:Math.round(Math.min(...raw.map(p=>p.ele))), bounds:{ north:Math.max(...raw.map(p=>p.lat)), south:Math.min(...raw.map(p=>p.lat)), east:Math.max(...raw.map(p=>p.lng)), west:Math.min(...raw.map(p=>p.lng)) } }
const output = { ...common, overviewRoute, profile }
const detailOutput = { ...common, route, detailedProfile }
const dir=join(process.cwd(),'public','gpx',event); await mkdir(dir,{recursive:true}); const outputPath=join(dir,`${id}.json`),detailPath=join(dir,`${id}.detail.json`); await Promise.all([writeFile(outputPath,JSON.stringify(output)),writeFile(detailPath,JSON.stringify(detailOutput))]); console.log(`Ustvarjeno: ${outputPath} + detail`)
}
