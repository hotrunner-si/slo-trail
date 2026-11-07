// Uses only public result lists exposed by the race timer; never participant lists.
import {readFile,writeFile,mkdir} from 'node:fs/promises'
const dir='docs/knowledge/races-2026-11-07/'
await mkdir(dir+'results',{recursive:true})
const events=JSON.parse(await readFile(dir+'result-events.json','utf8'))
try{events.push(...JSON.parse(await readFile(dir+'supplemental-result-events.json','utf8')))}catch{}
try{events.push(...JSON.parse(await readFile(dir+'archive-result-events.json','utf8')))}catch{}
const match={
 'k24-ultra-trail':/K24/i,'ultra-trail-vipava-valley':/Vipava/i,'podbrdo-trail-running-festival':/Podbrdo/i,
 'kocevsko-outdoor-festival':/KOČEVSKO/i,'knap-trail':/Knap/i,'kriska-gora-trail':/Kriška/i,
 'soca-outdoor-festival':/Soča/i,'obala-ultra-trail':/Obala/i,'julian-alps-trail-run-by-utmb':/JULIAN/i,
 'haloze-trail':/Haloze/i,'ribnica-trail':/Ribn(?:ica|.?ca)\s*Trail/i,'slovenski-gozdarski-trail':/gozdarski trail/i,
 'velenje-trail':/Velenje trail/i,'loncarija-tece':/Lončarija/i,'triglav-trail-run':/Triglav Trail/i,'8-ur-sv-ane':/8 ur sv\. ane/i,
 'go4trail':/GO4TRAIL/i,'lahinja-trail':/Lahinja/i,'smarjeski-tek':/Šmarješki/i,
}
const plan=[...new Map(events.filter(e=>e.ids.length&&match[e.slug]?.test(e.title)&&/202[0-6]/.test(e.title)).map(e=>[e.ids[0],e])).values()]
const log=[];let next=0
await Promise.all(Array.from({length:3},async()=>{while(next<plan.length){const e=plan[next++],id=e.ids[0];try{
 let c;try{c=JSON.parse(await readFile(dir+`results/${id}-config.json`,'utf8'))}catch{c=await(await fetch(`https://my.raceresult.com/${id}/results/config?lang=en`,{signal:AbortSignal.timeout(25000)})).json()}
 await writeFile(dir+`results/${id}-config.json`,JSON.stringify(c,null,2))
 if(!c.EventOver){log.push({...e,content:undefined,status:'not-final'});continue}
 const lists=c.TabConfig.Lists.filter(l=>l.Mode!=='hidden'&&/absolut|overall|general|rezultati.*spol/i.test(l.Name+' '+l.ShowAs)&& !/kategor|ekip|štafet|dvojic|pair|team|DP |prvenstv|live|prihodi/i.test(l.Name+' '+l.ShowAs))
 const unique=[...new Map(lists.map(l=>[l.Contest,l])).values()]
 let count=0
 for(const l of unique){try{JSON.parse(await readFile(dir+`results/${id}-${l.ID}.json`,'utf8'));count++;continue}catch{}
 const p=new URLSearchParams({key:c.key,listname:l.Name,page:'results',contest:l.Contest,r:'all',l:'0',openedGroups:'{}',lang:'en'})
 const r=await fetch(`https://${c.server||'my.raceresult.com'}/${id}/results/list?${p}`,{signal:AbortSignal.timeout(25000)})
 if(!r.ok)throw Error(`list ${r.status}`)
 const j=await r.json();await writeFile(dir+`results/${id}-${l.ID}.json`,JSON.stringify(j,null,2));count++}
 log.push({slug:e.slug,title:e.title,url:e.url,id,eventname:c.eventname,year:+e.title.match(/202[0-6]/)[0],lists:unique.map(l=>({id:l.ID,name:l.Name,contest:l.Contest})),status:count?'downloaded':'no-recognized-overall-list'})
 console.log(e.title,count)
 }catch(err){log.push({slug:e.slug,id,error:err.message});console.log(e.title,err.message)}}}))
await writeFile(dir+'result-table-index.json',JSON.stringify(log,null,2))
