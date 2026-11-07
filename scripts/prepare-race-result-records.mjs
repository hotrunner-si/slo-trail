import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
const dir='docs/knowledge/races-2026-11-07/'
const ix=JSON.parse(readFileSync(dir+'result-table-index.json','utf8'))
const inventory=JSON.parse(readFileSync(dir+'inventory.json','utf8'))
const classes=JSON.parse(readFileSync(dir+'scope.json','utf8'))
const records=new Map(),issues=[],preview=[]
function leaves(v,path=[]){if(Array.isArray(v)){if(Array.isArray(v[0]))return [{path,rows:v}];return []}if(!v||typeof v!=='object')return [];return Object.entries(v).flatMap(([k,val])=>leaves(val,[...path,k.replace(/^#\d+_/, '')]))}
const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim()
for(const e of ix.filter(e=>e.status==='downloaded'))for(const l of e.lists){
 const j=JSON.parse(readFileSync(dir+`results/${e.id}-${l.id}.json`,'utf8'))
 const fields=j.list.Fields
 const col=f=>j.DataFields.indexOf(f?.Expression)
 const name=col(fields.find(f=>/DisplayName|LASTNAME/i.test(f.Expression)))
 const rank=col(fields.find(f=>/^(Pl\.|Uvr\.?|Rank|Pos\.)$/i.test(f.Label)))
 const time=col(fields.find(f=>/^timeorstatus$/i.test(f.Expression)))
 if([name,rank,time].some(x=>x<0)){issues.push({id:e.id,list:l.id,reason:'No unambiguous name/rank/final-time fields'});continue}
 for(const group of leaves(j.data)){
 const path=group.path.join(' / ')
 if(/Mini|Kids|Otro|Žvrgol|Konjiček|U1[24689]|pohod|hike|nordij|dvojic|pair|štafet|team|PARAFESTIVAL/i.test(path))continue
 const sex=/Women|Ženske|Female/i.test(path)?'ženske':/\bMen\b|Moški|\bMale\b/i.test(path)?'moški':null
 if(!sex){issues.push({id:e.id,list:l.id,path,reason:'No unambiguous gender grouping'});continue}
 const route=group.path.filter(p=> !/^(?:Women|Men|Ženske|Moški|Female|Male)$/i.test(p)).join(' / ').replace(/\{EN:[^|]*\|SI:([^}]+)\}/g,'$1')
 if(!route){issues.push({id:e.id,list:l.id,path,reason:'No course grouping'});continue}
 const max=classes.S.includes(e.slug)||classes.A.includes(e.slug)?10:3
 const rows=group.rows.map(r=>({rank:clean(r[rank]).replace(/^\[img:gold\.png\]$/,'1').replace(/^\[img:silver\.png\]$/,'2').replace(/^\[img:bronze\.png\]$/,'3'),name:clean(r[name]),time:clean(r[time])})).filter(r=>/^\d+\.?$/.test(r.rank)&&/^\d{1,3}:\d{2}(?::\d{2})?(?:[,.]\d+)?$/.test(r.time)).map(r=>({...r,rank:parseInt(r.rank)})).filter(r=>r.rank<=max).sort((a,b)=>a.rank-b.rank)
 if(!rows.length)continue
 // Competition ranking can include ties (1,2,3,3,5). Preserve the official ranks.
 if(rows[0].rank!==1||rows.some((r,i)=>i>0 && (r.rank===rows[i-1].rank ? r.time!==rows[i-1].time : r.rank!==i+1))){issues.push({id:e.id,list:l.id,path,reason:'Unexplained gap or inconsistent tie in top ranks'});continue}
 if(rows.some(r=>!r.name||/\[img:|\{|\}/.test(r.name))){issues.push({id:e.id,list:l.id,path,reason:'Unresolved display markup'});continue}
 const race=inventory.find(x=>x.slug===e.slug)
 const topic=`rezultati ${route} – ${sex}`
 const excerpt=`${race.name}, izvedba ${e.year}, uradna trasa ${route}. Absolutna razvrstitev po spolu: ${sex}. ${rows.length<max?'V preverjeni tabeli je na voljo '+rows.length+' uvrščenih. ':''}${rows.map(r=>`${r.rank}. ${r.name} – ${r.time}`).join('; ')}. Časi so zapisani v obliki ur:minut:sekund oziroma minut:sekund, kot v uradnem rezultatu. DNS, DNF in diskvalificirani niso vključeni.`
 const url=`https://my.raceresult.com/${e.id}/results#${l.Contest}_${l.id}`
 const hash=createHash('sha256').update(`${e.id}:${route}:${sex}`).digest('hex').slice(0,16)
 const record={slug:e.slug,year:e.year,topic,title:`${race.name} ${e.year} – ${route} – top ${Math.min(max,rows.length)} ${sex}`.slice(0,200),excerpt,url,origin:'official',verifiedAt:'2026-11-07',evidenceKey:`results/${e.id}-${l.id}.json`,stableKey:`results:${hash}`,results:rows,course:route,sex,eventId:e.id}
 const previous=records.get(hash)
 if(previous&&JSON.stringify(previous.results)!==JSON.stringify(rows)){issues.push({id:e.id,list:l.id,path,reason:'Conflicting overall tables'});records.delete(hash);continue}
 records.set(hash,record);preview.push({event:e.title,route,sex,count:rows.length,winner:rows[0]})
 }
}
writeFileSync(dir+'result-records.json',JSON.stringify([...records.values()],null,2))
writeFileSync(dir+'result-review.json',JSON.stringify({records:records.size,preview,issues},null,2))
console.log(JSON.stringify({records:records.size,issues:issues.length,byRace:Object.fromEntries(inventory.map(x=>[x.slug,[...records.values()].filter(r=>r.slug===x.slug).length]).filter(x=>x[1]))}))
