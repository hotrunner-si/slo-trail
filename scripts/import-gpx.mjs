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
for(let i=1;i<raw.length;i++){ distanceKm+=haversine(raw[i-1],raw[i]); const diff=raw[i].ele-raw[i-1].ele; if(diff>0)elevationGain+=diff; else elevationLoss-=diff }

const sample = (items, count) => Array.from({length:Math.min(count,items.length)},(_,i)=>items[Math.round(i*(items.length-1)/(Math.min(count,items.length)-1))])
const route = sample(raw, 180).map(p=>[Number(p.lat.toFixed(6)),Number(p.lng.toFixed(6))])
const profile = sample(raw, 100).map(p=>Math.round(p.ele))
const output = { source:basename(input), eventSlug, distanceId, generatedAt:new Date().toISOString(), distanceKm:Number(distanceKm.toFixed(2)), elevationGain:Math.round(elevationGain), elevationLoss:Math.round(elevationLoss), highestPoint:Math.round(Math.max(...raw.map(p=>p.ele))), lowestPoint:Math.round(Math.min(...raw.map(p=>p.ele))), bounds:{ north:Math.max(...raw.map(p=>p.lat)), south:Math.min(...raw.map(p=>p.lat)), east:Math.max(...raw.map(p=>p.lng)), west:Math.min(...raw.map(p=>p.lng)) }, route, profile }
const dir=join(process.cwd(),'public','gpx',eventSlug); await mkdir(dir,{recursive:true}); const outputPath=join(dir,`${distanceId}.json`); await writeFile(outputPath,JSON.stringify(output,null,2)); console.log(`Ustvarjeno: ${outputPath}`)
