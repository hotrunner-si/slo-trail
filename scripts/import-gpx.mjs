import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'

const [input, eventSlug, distanceId] = process.argv.slice(2)
if (!input || !eventSlug || !distanceId) {
  console.error('Uporaba: npm run gpx:import -- <datoteka.gpx> <event-slug> <distance-id>')
  process.exit(1)
}

const xml = await readFile(input, 'utf8')
const matches = [...xml.matchAll(/<trkpt[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>[\s\S]*?<ele>([^<]+)<\/ele>[\s\S]*?<\/trkpt>/g)]
const raw = matches.map(match => ({ lat:Number(match[1]), lng:Number(match[2]), ele:Number(match[3]) })).filter(point => Number.isFinite(point.lat+point.lng+point.ele))
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
const overview=sample(detail,Math.min(220,Math.max(45,Math.ceil(distanceKm*2.2))))
const route = detail.map(p=>[Number(p.lat.toFixed(6)),Number(p.lng.toFixed(6))])
const overviewRoute = overview.map(p=>[Number(p.lat.toFixed(6)),Number(p.lng.toFixed(6))])
const detailedProfile = detail.map(p=>({distanceKm:Number(p.distanceKm.toFixed(3)),elevation:Math.round(p.ele)}))
const profile = sample(detail,64).map(p=>Math.round(p.ele))
const common = { source:basename(input), eventSlug, distanceId, generatedAt:new Date().toISOString(), distanceKm:Number(distanceKm.toFixed(2)), elevationGain:Math.round(elevationGain), elevationLoss:Math.round(elevationLoss), highestPoint:Math.round(Math.max(...raw.map(p=>p.ele))), lowestPoint:Math.round(Math.min(...raw.map(p=>p.ele))), bounds:{ north:Math.max(...raw.map(p=>p.lat)), south:Math.min(...raw.map(p=>p.lat)), east:Math.max(...raw.map(p=>p.lng)), west:Math.min(...raw.map(p=>p.lng)) } }
const output = { ...common, overviewRoute, profile }
const detailOutput = { ...common, route, detailedProfile }
const dir=join(process.cwd(),'public','gpx',eventSlug); await mkdir(dir,{recursive:true}); const outputPath=join(dir,`${distanceId}.json`),detailPath=join(dir,`${distanceId}.detail.json`); await Promise.all([writeFile(outputPath,JSON.stringify(output)),writeFile(detailPath,JSON.stringify(detailOutput))]); console.log(`Ustvarjeno: ${outputPath} + detail`)
