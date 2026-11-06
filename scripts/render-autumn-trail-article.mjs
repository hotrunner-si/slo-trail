import fs from 'node:fs'
import assert from 'node:assert/strict'
import { trailCategory } from '../utils/trailAnalytics.ts'
import { winnerSpeedCharts, winnerSpeedCss } from './lib/winner-speed-charts.mjs'
const dir='docs/articles/jesenski-trojcek-2026'
const read=p=>fs.readFileSync(`${dir}/${p}`,'utf8')
const routes=JSON.parse(read('routes.json')), results=JSON.parse(read('results.json'))
const nf=n=>new Intl.NumberFormat('sl-SI',{maximumFractionDigits:2}).format(n)
const pace=n=>n==null?'—':`${Math.floor(Math.round(n)/60)}:${String(Math.round(n)%60).padStart(2,'0')}`
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const names={'go4trail':'GO4Trail','obala-ultra-trail':'Obala','lahinja-trail':'Lahinja'}
const table=(heads,rows)=>`<div class="table-wrap"><table><thead><tr>${heads.map(s=>`<th>${s}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(s=>`<td>${s}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
const ranking=[...routes].sort((a,b)=>b.ascentPerKm-a.ascentPerKm)
const chart=`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="750" viewBox="0 0 1100 750" role="img" aria-labelledby="title desc"><title id="title">Trase v primerjavi – 7. november 2026</title><desc id="desc">Enajst tras treh dogodkov, razvrščenih po uradnem vzponu na kilometer. GO Trim 62,0; GO 3V 58,0; GO Ultra 45,5 m/km.</desc><rect width="1100" height="750" fill="#f8faf3"/><g font-family="Arial, sans-serif" fill="#35543b"><text x="38" y="48" font-size="29" font-weight="700">Trase v primerjavi</text><text x="38" y="78" font-size="16">Obala Ultra Trail · GO4Trail · Lahinja Trail | 7. 11. 2026</text><text x="38" y="110" font-size="15">VZPON / km celotne trase · uradne objavljene vrednosti 2026</text>${ranking.map((r,i)=>{const y=155+i*48;return `<text x="38" y="${y+8}" font-size="17">${esc(r.raceSlug==='lahinja-trail'?'Lahinja · '+r.name:r.name)}</text><rect x="310" y="${y-12}" width="565" height="22" rx="3" fill="#e9eedf"/><rect x="310" y="${y-12}" width="${565*r.ascentPerKm/ranking[0].ascentPerKm}" height="22" rx="3" fill="${trailCategory(r).color}"/><text x="900" y="${y+6}" font-size="19" font-weight="700">${r.ascentPerKm.toFixed(1).replace('.',',')} m/km</text><text x="310" y="${y+29}" font-size="12" fill="#718168">${nf(r.km)} km · ${nf(r.elevation)} m+</text>`}).join('')}<text x="38" y="713" font-size="13">Vir: organizatorji · Izračun: vzpon ÷ razdalja · Ni naklon posameznega vzpona ali ocena tehničnosti.</text></g></svg>`
fs.writeFileSync(`${dir}/trase-v-primerjavi.svg`,chart)
const profileRoutes=[...routes].sort((a,b)=>b.km-a.km)
const profileMaxKm=Math.max(...profileRoutes.map(r=>r.profile.distanceKm))
const profileMaxElevation=Math.ceil(Math.max(...profileRoutes.flatMap(r=>r.profile.points.map(p=>p[1])))/200)*200
const profileX=km=>60+km/profileMaxKm*970
const profileY=e=>180-e/profileMaxElevation*150
const profiles=profileRoutes.map(r=>{
 const pts=r.profile.points
 const endX=profileX(r.profile.distanceKm)
 const d=pts.map(([km,e],i)=>`${i?'L':'M'}${profileX(km).toFixed(1)},${profileY(e).toFixed(1)}`).join(' ')
 const ticks=[0,20,40,60,80,100]
 return `<figure class="profile profile-distance"><h3>${esc(names[r.raceSlug]+' · '+r.name)} · ${nf(r.km)} km</h3><div class="profile-chart"><svg viewBox="0 0 1100 220" role="img" aria-label="Višinski profil ${esc(r.name)} na skupni razdaljni in višinski osi"><g stroke="#d8e0ce" stroke-dasharray="3 5">${ticks.map(km=>`<path d="M${profileX(km)} 30V180"/>`).join('')}</g><path d="M60 30V180H1030" stroke="#a6b39a" fill="none"/><path d="${d} L${endX.toFixed(1)},180 L60,180 Z" fill="${trailCategory(r).color}" fill-opacity=".13"/><path d="${d}" stroke="${trailCategory(r).color}" stroke-width="2" fill="none"/><path d="M${endX.toFixed(1)} 30V180" stroke="${trailCategory(r).color}" stroke-dasharray="4 4"/><g font-size="12" font-family="Arial" fill="#52654c"><text x="4" y="35">${profileMaxElevation} m</text><text x="37" y="184">0</text>${ticks.map(km=>`<text x="${profileX(km)}" y="204" text-anchor="middle">${km}</text>`).join('')}<text x="1080" y="204" text-anchor="end">km</text><text x="${Math.min(1030,endX+8)}" y="50" text-anchor="${endX>980?'end':'start'}">cilj · ${nf(r.profile.distanceKm)} km</text></g></svg></div><figcaption>${esc(r.profileStatus)}</figcaption></figure>`
}).join('')
const historical=results.filter(r=>r.event==='go4trail'&&r.km===64||r.event==='obala-ultra-trail'&&r.km>=63&&r.km<=65)
const paired=rows=>{
 const groups=new Map();for(const r of rows){const key=`${r.event}:${r.year}:${r.route}`;if(!groups.has(key))groups.set(key,{});groups.get(key)[r.gender]=r}
 return [...groups.values()].map(({M,F})=>[names[M.event],M.year,esc(M.route),`${esc(M.name)} · ${M.time||'čas ni potrjen'}`,pace(M.paceSecondsPerKm),`${esc(F.name)} · ${F.time||'čas ni potrjen'}`,pace(F.paceSecondsPerKm),`<a href="${M.sourceUrl}">Vir</a>`])
}
const heads=['Dogodek','Leto','Trasa','Zmagovalec','M min/km','Zmagovalka','Ž min/km','Vir']
const comparison=results.filter(r=>r.year===2025&&r.km===64&&['obala-ultra-trail','go4trail'].includes(r.event))
const inserts={routes:table(['Dogodek','Trasa','km','Vzpon m+','Vzpon m/km'],routes.map(r=>[names[r.raceSlug],`<a href="${r.sourceUrl}">${r.name}</a>`,nf(r.km),nf(r.elevation),r.ascentPerKm.toFixed(1).replace('.',',')])),ranking:`<figure class="ranking-static"><img src="trase-v-primerjavi.svg" alt="Trase v primerjavi: vzpon na kilometer za 11 tras"/><figcaption>Enako merilo in barve kategorij kot v analitiki; samo trase teh treh dogodkov.</figcaption></figure>`,profiles:`<details><summary>Odpri 11 višinskih profilov GPX</summary><p class="profile-scale-note">Vsi profili imajo skupno razdaljno in višinsko merilo. Črtkana barvna črta označuje cilj trase; razdalje na osi so iz GPX, naslovi pa navajajo uradno dolžino.</p><div class="profiles profiles-distance">${profiles}</div></details>`,history:table(heads,paired(historical)),comparison:table(['Trasa 2025','Spol','Zmagovalec/-ka','Čas','Tempo min/km','km/h'],comparison.map(r=>[`${names[r.event]} ${r.km}`,r.gender==='M'?'M':'Ž',esc(r.name),r.time,pace(r.paceSecondsPerKm),nf(r.speedKmh)])),'all-results':`<details><summary>Odpri celoten arhiv: 82 zapisov, 80 potrjenih časov</summary>${table(heads,paired(results))}</details>`}
// Small local Markdown renderer for this controlled editorial draft only.
inserts['winner-speeds']=winnerSpeedCharts(routes,results)
fs.writeFileSync('assets/css/winner-speed-charts.css',winnerSpeedCss)
function inline(s){return s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/(?!\/))[^)]+)\)/g,'<a href="$2">$1</a>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>')}
const md=read('article.md').replaceAll('\r\n','\n').trim()
assert.ok(!/^\s*\|/m.test(md),'Raw Markdown table rows found in article.md; use the generated table markers instead')
assert.equal([...md.matchAll(/<!-- ranking -->/g)].length,1,'Exactly one comparison chart marker is required')
let html=md.split(/\n\s*\n/).map(p=>{
 const marker=p.match(/^<!-- ([\w-]+) -->$/);if(marker)return `<!-- ${marker[1]} -->`
 if(/^#{1,3} /.test(p)){const m=p.match(/^(#+) (.*)/s);const section=m[2]==='Kako so se spreminjali zmagovalni časi?'?' class="runner-section-heading"':'';return `<h${m[1].length}${section}>${inline(m[2])}</h${m[1].length}>`}
 if(p.startsWith('- '))return `<ul>${p.split('\n').map(l=>`<li>${inline(l.replace(/^- /,''))}</li>`).join('')}</ul>`
 return `<p>${inline(p.replaceAll('\n',' '))}</p>`
}).join('\n')
const [beforeRanking,afterRanking]=html.split('<!-- ranking -->')
const replace=(s,exclude=[])=>s.replace(/<!-- ([\w-]+) -->/g,(all,k)=>exclude.includes(k)?all:inserts[k]||all)
fs.writeFileSync(`${dir}/article-view.json`,JSON.stringify({beforeRanking:replace(beforeRanking),afterRanking:replace(afterRanking)},null,2)+'\n')
html=replace(html)
let css=`:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f4f6ee;color:#263e2c;font:17px/1.7 Georgia,serif}main{max-width:1160px;margin:auto;padding:54px 40px 90px}h1{font-size:clamp(32px,5vw,58px);line-height:1.13;max-width:950px;margin:14px 0 28px}h2{font:700 28px/1.3 Arial,sans-serif;margin:52px 0 22px}h3{font:700 17px Arial}p,li{max-width:850px}a{color:#356749;text-underline-offset:3px}figure{margin:24px 0}img{display:block;width:100%;height:auto}figcaption{font:13px/1.5 Arial;color:#63735b;margin-top:12px}.table-wrap{overflow-x:auto;margin:25px 0}table{border-collapse:collapse;width:100%;font:14px/1.5 Arial;text-align:left}th,td{padding:14px 12px;border-bottom:1px solid #d8e0ce}th{background:#35543b;color:white}td{vertical-align:top}tr:nth-child(even){background:#eaf0e2}details{background:#fff;padding:22px;border:1px solid #d2ddc8;margin:30px 0}summary{cursor:pointer;font:700 17px Arial}.profiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.profile svg{width:100%}.profiles-distance{grid-template-columns:1fr}.profile-chart{overflow-x:auto}.profile-chart svg{display:block;min-width:720px}.profile{min-width:0}.tag{font:12px Arial;letter-spacing:.15em;text-transform:uppercase;color:#63735b}.editor{border-left:4px solid #9baf76;padding:12px 20px;background:#eaf0e2;font:14px/1.5 Arial}@media(max-width:650px){main{padding:28px 18px 50px}.profiles{grid-template-columns:1fr}td,th{padding:10px 8px}h2{font-size:24px}}`
css+=winnerSpeedCss
fs.writeFileSync(`${dir}/preview.html`,`<!doctype html><html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Tri sobotne tekme – uredniški osnutek</title><style>${css}</style></head><body><main><div class="tag">Slo Trail / Analiza pred tekmo</div>${html}</main></body></html>`)
// Export full Markdown with tables and a static chart for copy editing / publishing.
const mdTable=(heads,rows)=>'| '+heads.join(' | ')+' |\n| '+heads.map(()=> '---').join(' | ')+' |\n'+rows.map(row=>'| '+row.join(' | ')+' |').join('\n')
const textRows=paired(results).map(row=>row.map(v=>String(v).replace(/<a href="([^"]+)">Vir<\/a>/,'[Vir]($1)')))
let full=md.replace('<!-- routes -->',mdTable(['Dogodek','Trasa','km','m+','m+/km'],routes.map(r=>[names[r.raceSlug],r.name,nf(r.km),nf(r.elevation),r.ascentPerKm.toFixed(1).replace('.',',')]))).replace('<!-- ranking -->','![Trase v primerjavi – 11 tras](trase-v-primerjavi.svg)').replace('<!-- winner-speeds -->','Diagrami hitrosti zmagovalcev za vseh 11 tras so v HTML-predogledu.').replace('<!-- profiles -->','Višinski profili vseh 11 tras so v priloženem HTML-predogledu.').replace('<!-- history -->',mdTable(heads,paired(historical).map(row=>row.map(v=>String(v).replace(/<a href="([^"]+)">Vir<\/a>/,'[Vir]($1)'))))).replace('<!-- comparison -->',mdTable(['Trasa 2025','Spol','Ime','Čas','min/km','km/h'],comparison.map(r=>[`${names[r.event]} ${r.km}`,r.gender==='M'?'M':'Ž',r.name,r.time,pace(r.paceSecondsPerKm),nf(r.speedKmh)]))).replace('<!-- all-results -->',mdTable(heads,textRows))
assert.ok(!full.includes('<!--'))
fs.writeFileSync(`${dir}/clanek.md`,full+'\n')
console.log('Rendered HTML, full Markdown, reusable article view and SVG chart.')
