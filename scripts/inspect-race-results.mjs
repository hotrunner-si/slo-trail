import {readFile,writeFile} from 'node:fs/promises'
const ix=JSON.parse(await readFile('docs/knowledge/races-2026-11-07/evidence-index.json','utf8'))
for(const url of process.argv.slice(2)){
 try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});const h=await r.text();console.log('\nURL',url,r.status)
 await writeFile('docs/knowledge/races-2026-11-07/evidence/'+Buffer.from(url).toString('base64url').slice(-90)+'.html',h)
 console.log([...h.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map(x=>x[1]).filter(x=>/raceresult|protime|my[0-9]|\.pdf|live|iframe|\.js|\.json/.test(x)).join('\n'))
 console.log(h.split('\n').filter(l=>/eventid|eventId|event_id|RRPublish|RRReg|raceresult|protime|iframe|api\./i.test(l)).map(l=>l.slice(0,2000)).join('\n').slice(0,9000))
 }catch(e){console.log(e.message)}
}
