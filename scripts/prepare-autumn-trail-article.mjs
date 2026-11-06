import fs from 'node:fs'
import assert from 'node:assert/strict'
import { XMLParser } from 'fast-xml-parser'
import { trailDescent, trailHighestPoint, trailCategory } from '../utils/trailAnalytics.ts'

const dir = 'docs/articles/jesenski-trojcek-2026'
const read = p => fs.readFileSync(p, 'utf8')
const save = (p, v) => fs.writeFileSync(`${dir}/${p}`, typeof v === 'string' ? v : JSON.stringify(v, null, 2) + '\n')
const seconds = time => time.replace(/,\d+$/, '').split(':').reverse().reduce((n, v, i) => n + Number(v) * 60 ** i, 0)
const results = []
for (const year of [2021, 2022, 2023, 2024, 2025]) {
  let route = '', gender = ''
  for (const line of read(`${dir}/sources/obala-${year}.txt`).split('\n')) {
    if (/^(?!.*REZULTATI).*\d\s*km\s*$/i.test(line.trim())) route = line.trim()
    if (/^\s*(Men|Women)\s*$/.test(line)) gender = line.trim() === 'Men' ? 'M' : 'F'
    if (!/^\s*1\.\s/.test(line)) continue
    const fields = line.trim().split(/\s{2,}/)
    const name = fields[year === 2021 ? 3 : 2]
    const time = line.match(/\b\d{1,2}:\d{2}:\d{2}\b/)?.[0]
    const km = Number(route.match(/(\d+)\s*km$/i)?.[1])
    assert.ok(name && time && km && gender)
    results.push({ event: 'obala-ultra-trail', year, route, km, distanceBasis: 'Ime trase v uradnih rezultatih; ni meritev GPX.', gender, name, time, seconds: seconds(time), sourceUrl: `https://obalaultratrail.si/wp-content/uploads/2025/12/Rezultati-absolutno_${year}.pdf` })
  }
}
for (const [id, year, contests] of [[308164, 2024, [1, 2]], [327630, 2025, [1, 2, 3]]]) {
  for (const contest of contests) {
    const data = JSON.parse(read(`${dir}/sources/rr-${id}-${contest}.json`))
    for (const [route, groups] of Object.entries(data.data)) for (const [gender, rows] of Object.entries(groups)) {
      const row = rows.find(r => r[2] === '1.')
      assert.ok(row)
      // 2025 list labels say 10/18/30, not measured 9.9/18.2/31.12.
      const km = year === 2024 ? [0, 9.9, 18.2][contest] : [0, 10, 18, 30][contest]
      results.push({ event: 'lahinja-trail', year, route: route.replace(/^#\d+_/, ''), km, distanceBasis: 'Razdalja iz naslova uradnih rezultatov; za 2025 ni potrjene natančne meritve.', gender: gender.includes('Moški') ? 'M' : 'F', name: row[4], time: row[8].replace(/,\d+$/, ''), seconds: seconds(row[8]), sourceUrl: `https://my.raceresult.com/${id}/results` })
    }
  }
}
const go = [
  [2022, 10, 'Jaka Dragoš', null, 'Lucija Krkoč', null],
  [2022, 28, 'Urh Peček', '3:00:53', 'Aja Kozinc', '3:33:02'],
  [2023, 10, 'Tadej Vehovec', '0:55:10', 'Maruša Cijan Brkič', '1:04:27'],
  [2023, 28, 'Tine Žižmond', '2:47:51', 'Ana Čufer', '3:00:52'],
  [2023, 64, 'Niko Golob', '7:18:26', 'Anna Kratki', '8:41:43'],
  [2024, 10, 'Tadej Vehovec', '0:53:57', 'Nastja Mihelič', '1:05:31'],
  [2024, 28, 'Tine Žižmond', '2:40:25', 'Aja Kozinc', '3:28:48'],
  [2024, 64, 'Anže Sobočan', '6:58:58', 'Dunja Selan', '9:28:35'],
  [2025, 10, 'Tadej Vehovec', '0:51:27', 'Nastja Mihelčič', '1:03:21'],
  [2025, 28, 'Tadej Serdinšek', '2:51:16', 'Tina Šatej', '3:38:11'],
  [2025, 64, 'Ivan Hrastovec', '6:35:15', 'Vika Koban', '7:35:29'],
]
for (const [year, km, man, mt, woman, wt] of go) for (const [gender, name, time] of [['M', man, mt], ['F', woman, wt]]) results.push({event: 'go4trail', year, route: km === 64 ? 'GO Ultra 64 km' : km === 28 ? 'GO 3V 28 km' : 'GO Trim 10 km', km, gender, name, time, seconds: time ? seconds(time) : null, distanceBasis: 'Nominalna dolžina iz poročila organizatorja.', sourceUrl: `https://go4trail.si/sl/rezultati-${year}`, note: year === 2024 && gender === 'F' && km === 10 ? 'Ime v poročilu 2024: Nastja Mihelič; 2025: Nastja Mihelčič. Zapisa nista samodejno združena.' : undefined})
for (const r of results) {
  r.paceSecondsPerKm = r.seconds ? r.seconds / r.km : null
  r.speedKmh = r.seconds ? r.km / (r.seconds / 3600) : null
}
assert.equal(results.length, 82)
assert.equal(new Set(results.map(r => `${r.event}:${r.year}:${r.route}:${r.gender}`)).size, results.length)
save('results.json', results)

const official = [
  ['go4trail', 'go-trim', 'GO Trim Škabrijel', 13.13, 814, 'https://go4trail.si/sl/proge/go-trim'],
  ['go4trail', 'go-3v', 'GO 3V', 28.02, 1626, 'https://go4trail.si/sl/proge/go-v3'],
  ['go4trail', 'go-ultra', 'GO Ultra', 63.73, 2900, 'https://go4trail.si/sl/proge/go-ultra'],
  ...[[11,200],[17,450],[35,1000],[64,2000],[108,4000]].map(([km,e])=>['obala-ultra-trail',`obala-${km<64?'trail':'ultra-trail'}-${km}km`,`Obala ${km}`,km,e,`https://obalaultratrail.si/razdalje/obala-${km<64?'trail':'ultra-trail'}-${km}-km/`]),
  ['lahinja-trail','duma','Duma',9.9,152,'https://protime.si/dogodek/lahinja-trail-2026/'],
  ['lahinja-trail','velikobukovska','Velikobukovska',18.2,298,'https://protime.si/dogodek/lahinja-trail-2026/'],
  ['lahinja-trail','republikanka','Republikanka',31.12,546,'https://protime.si/dogodek/lahinja-trail-2026/'],
]
const parser = new XMLParser({ignoreAttributes:false,attributeNamePrefix:''})
const rad = n => n*Math.PI/180
function profileFromGpx(path) {
  const doc = parser.parse(read(path)).gpx
  const tracks = [doc.trk].flat().flatMap(t => [t.trkseg].flat()).flatMap(s => [s.trkpt].flat())
  let km = 0
  const points = tracks.map((p,i) => {
    if(i) {const a=tracks[i-1]; const h=Math.sin(rad(p.lat-a.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(p.lat))*Math.sin(rad(p.lon-a.lon)/2)**2;km+=6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))}
    return [km,Number(p.ele)]
  })
  assert.ok(points.length>10 && points.every(p=>p.every(Number.isFinite)))
  const reduced=points.filter((_,i)=>i%Math.max(1,Math.floor(points.length/400))===0)
  if(reduced.at(-1)!==points.at(-1))reduced.push(points.at(-1))
  return {distanceKm:km,highestPoint:Math.max(...points.map(p=>p[1])),points:reduced}
}
const routes = official.map(([raceSlug,id,name,km,elevation,sourceUrl])=>{
  let path,profileStatus
  if(raceSlug==='go4trail'){path=`${dir}/sources/${id}-2026.gpx`;profileStatus='Uradni GPX 2026, prenesen 6. 11. 2026.'}
  else {const files=fs.readdirSync(`public/gpx/races/${raceSlug}`);path=`public/gpx/races/${raceSlug}/`+files.find(f=>f.endsWith('.gpx')&&(raceSlug==='lahinja-trail'?f.includes(id):f.endsWith(`-${km}km.gpx`)));profileStatus='Arhivski GPX projekta; skladnost s končno traso 2026 ni ponovno potrjena.'}
  const profile=profileFromGpx(path)
  const point={key:`${raceSlug}:${id}`,raceSlug,id,name,label:name,raceName:raceSlug==='go4trail'?'GO4Trail':raceSlug==='lahinja-trail'?'Lahinja Trail':'Obala Ultra Trail',km,elevation,sourceUrl,year:2026,gpx:{highestPoint:profile.highestPoint,profile:profile.points.map(p=>p[1])},profile,profileStatus}
  point.ascentPerKm=elevation/km
  point.descent=trailDescent(point)
  point.terrainPerKm=(elevation+point.descent)/km
  point.effortKm=km+elevation/100
  return point
})
save('routes.json',routes)
const quote = v => v==null?'null':"'"+String(v).replaceAll("'","''")+"'"
const sources = []
for(const event of ['obala-ultra-trail','go4trail','lahinja-trail'])for(const year of [2021,2022,2023,2024,2025]){
 const rows=results.filter(r=>r.event===event&&r.year===year)
 if(!rows.length)continue
 sources.push({key:`research:autumn-2026:results:${event}:${year}`,event,year,title:`${event} ${year} – zmagovalci po trasah in spolu`,url:rows[0].sourceUrl,origin:'official',excerpt:rows.map(r=>`${r.route}; ${r.gender==='M'?'moški':'ženske'}: ${r.name}, ${r.time||'čas ni naveden v pregledanem poročilu'}.`).join(' ')+' Razdalje so nominalne iz rezultatov/poročila tega leta, ne letošnje trase. Iz časov samih ne sledi rekord trase ali sprememba njene tehnične zahtevnosti.'})
}
for(const route of routes)sources.push({key:`research:autumn-2026:route:${route.raceSlug}:${route.id}`,event:route.raceSlug,year:2026,title:`${route.raceName} 2026 – ${route.name}: razdalja in vzpon`,url:route.sourceUrl,origin:'official',excerpt:`Organizator za izvedbo 2026 navaja ${route.km} km in ${route.elevation} m vzpona. To so objavljene uradne vrednosti, ne seštevek višin iz GPX. Preverjeno 6. novembra 2026.`})
sources.push({key:'research:autumn-2026:lahinja-history',event:'lahinja-trail',year:2024,title:'Lahinja Trail – začetek 2023 na 8,3 km',url:'https://www.belakrajina.si/sl/informacije/novice/lahinja-trail-2024-tega-nismo-pricakovali/',origin:'official',excerpt:'Poročilo organizatorja za 2024 navaja prvo izvedbo leta 2023 na eni 8,3-kilometrski trasi. Zmagovalci in njihovi časi za 2023 v pregledanem poročilu niso navedeni. Današnjih tras ni dopustno primerjati kot neprekinjen petletni niz.'})
sources.push({key:'research:autumn-2026:lahinja-30-2025',event:'lahinja-trail',year:2025,title:'Lahinja Trail – 30 km izveden že leta 2025',url:'https://www.belakrajina.si/sl/informacije/novice/odtekli-smo-tretji-lahinja-trail-s-tremi-zvezdicami-tremi-dolzinami-in-belokranjskim-pokalom/',origin:'official',excerpt:'Organizatorjevo poročilo 8. novembra 2025 in uradni rezultati potrjujejo tri razdalje: 10, 18 in 30 km. Oznaka nova 30 km v razpisu 2026 zato ni dokaz prve izvedbe leta 2026. Zmagovalcev Belokranjskega pokala ne zamenjujemo z zmagovalci posamezne tekme.'})
save('knowledge-sources.json',sources)
const sql=['begin;']
for(const source of sources){
 const key=`edition:${source.event}:${source.year}`
 sql.push(`insert into public.brain_entities(kind,title,race_slug,year,legacy_key,metadata) select 'edition',title||' ${source.year}',race_slug,${source.year},${quote(key)},'{"research_batch":"autumn-2026"}'::jsonb from public.brain_entities where legacy_key=${quote('race:'+source.event)} on conflict(legacy_key) do nothing;`)
 sql.push(`insert into public.brain_relations(subject_id,object_id,relation) select e.id,r.id,'edition_of' from public.brain_entities e cross join public.brain_entities r where e.legacy_key=${quote(key)} and r.legacy_key=${quote('race:'+source.event)} on conflict do nothing;`)
 sql.push(`insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,legacy_key) select id,${quote(source.title)},${quote(source.excerpt)},${quote(source.url)},'official','2026-11-06'::timestamptz,${quote(source.key)} from public.brain_entities where legacy_key=${quote(key)} on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,verified_at=excluded.verified_at,embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;`)
}
for(const event of ['obala-ultra-trail','go4trail','lahinja-trail'])for(const year of [2021,2022,2023,2024,2025]){
 const rows=results.filter(r=>r.event===event&&r.year===year)
 if(rows.length)sql.push(`update public.brain_entities set metadata=metadata||${quote(JSON.stringify({historicalWinners:rows,researchVerifiedAt:'2026-11-06',distanceBasis:'Nominalna razdalja izvedbe iz rezultatov; ni letošnja trasa.'}))}::jsonb where legacy_key=${quote(`edition:${event}:${year}`)};`)
}
// Correct current published distance values without touching GPX references or other metadata.
for(const r of routes.filter(r=>r.raceSlug==='go4trail'||r.id==='republikanka'))sql.push(`update public.race_distances set data=data||${quote(JSON.stringify({km:r.km,elevation:r.elevation}))}::jsonb where race_slug=${quote(r.raceSlug)} and id=${quote(r.id)};`)
sql.push(`do $$ begin if (select count(*) from brain_sources where legacy_key like 'research:autumn-2026:%') <> ${sources.length} then raise exception 'Source count mismatch'; end if; end $$;`,'commit;')
save('import.sql',sql.join('\n\n')+'\n')
console.log(JSON.stringify({results:results.length,sources:sources.length,routes:routes.length,ranking:routes.sort((a,b)=>b.ascentPerKm-a.ascentPerKm).map(r=>[r.name,r.ascentPerKm.toFixed(1),r.profile.highestPoint])},null,2))
