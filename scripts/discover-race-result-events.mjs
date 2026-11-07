import {readFile,writeFile} from 'node:fs/promises'
const dir='docs/knowledge/races-2026-11-07/'
const archive=process.argv.includes('--archive')
const terms=[['k24-ultra-trail','K24'],['ultra-trail-vipava-valley','Vipava'],['podbrdo-trail-running-festival','Podbrdo'],['kocevsko-outdoor-festival','KOČEVSKO'],['knap-trail','Knap'],['kriska-gora-trail','Kriška'],['soca-outdoor-festival','Soča'],['obala-ultra-trail','Obala'],['julian-alps-trail-run-by-utmb','Julian'],['haloze-trail','Haloze'],['hg-trail-idrija','Hg'],['ponikva4trail','Ponikva'],['ribnica-trail','Ribn'],['velenje-trail','Velenje'],['slovenski-gozdarski-trail','gozdarski'],['loncarija-tece','Lončarija'],['triglav-trail-run','Triglav'],['8-ur-sv-ane','Ane']]
const out=[];let next=0
await Promise.all(Array.from({length:3},async()=>{while(next<terms.length){const [slug,term]=terms[next++];try{
 const url=`https://protime.si/${archive?'Backup/':''}wp-json/wp/v2/mec-events?per_page=100&search=`+encodeURIComponent(term)
 const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(r.status)
 const j=await r.json()
 for(const e of j){const h=e.content.rendered;const ids=[...h.matchAll(/new\s+RRPublish\([\s\S]{0,150}?,\s*(\d{5,7})\s*,/g)].map(x=>+x[1]);out.push({slug,title:e.title.rendered,url:e.link,date:e.date,ids:[...new Set(ids)],content:h})}
 console.log(slug,j.map(e=>e.title.rendered).join(' | '))
}catch(e){console.log(slug,e.message)}}}))
await writeFile(dir+(archive?'archive-result-events.json':'result-events.json'),JSON.stringify(out,null,2))
console.log('events',out.length,'with results',out.filter(x=>x.ids.length).length)
