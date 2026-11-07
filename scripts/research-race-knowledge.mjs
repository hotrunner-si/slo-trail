// Public-source research snapshots. Does not write to the database.
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
const dir = 'docs/knowledge/races-2026-11-07'
await mkdir(`${dir}/evidence`, { recursive: true })
const db = createClient(process.env.NUXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {auth:{persistSession:false}})
const {data:races,error} = await db.from('races').select('slug,name,data').order('slug')
if(error) throw error
await writeFile(`${dir}/inventory.json`, JSON.stringify(races,null,2))
const decode = s => s.replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#039;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>')
const plain = h => decode(h.replace(/<(script|style|svg|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<\/(?:p|div|h[1-6]|li|tr|section)>|<br\s*\/?>/gi,'\n').replace(/<[^>]+>/g,' ')).split('\n').map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean).join('\n')
let index=[]; try{index=JSON.parse(await readFile(`${dir}/evidence-index.json`,'utf8'))}catch{}
async function grab(slug,url){
 const key=createHash('sha256').update(url).digest('hex').slice(0,16)
 if(index.some(x=>x.key===key&&x.ok))return index.find(x=>x.key===key)
 try{
 const r=await fetch(url,{signal:AbortSignal.timeout(22000),headers:{'User-Agent':'SloTrail knowledge research; public race information'}})
 if(!r.ok)throw new Error(`HTTP ${r.status}`)
 if(!/text\/html|application\/xhtml/i.test(r.headers.get('content-type')||''))throw new Error('Not an HTML source; needs document extraction')
 const html=await r.text()
 const links=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].map(m=>{try{return {url:new URL(decode(m[1]),r.url).href,text:plain(m[2])}}catch{return null}}).filter(Boolean)
 const item={key,slug,url,finalUrl:r.url,checkedAt:new Date().toISOString(),ok:true,title:plain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''),links:[...new Map(links.map(x=>[x.url,x])).values()]}
 await writeFile(`${dir}/evidence/${key}.txt`,plain(html));index=index.filter(x=>x.key!==key);index.push(item);return item
 }catch(e){const item={key,slug,url,ok:false,error:e.message};index.push(item);return item}
}
const args=process.argv.slice(2)
if(args[0]==='plan'){
 const plan=JSON.parse(await readFile(args[1],'utf8'));let next=0
 await Promise.all(Array.from({length:4},async()=>{while(next<plan.length){const x=plan[next++];const r=await grab(x.slug,x.url);console.log(x.slug,r.ok?'OK':'FAILED',x.url)}}))
}
else if(args[0]==='url'){for(let i=1;i<args.length;i+=2)await grab(args[i],args[i+1])}
else{
 let next=0
 await Promise.all(Array.from({length:4},async()=>{while(next<races.length){const r=races[next++];const root=await grab(r.slug,r.data.sourceUrl);if(root.ok&&args.includes('--children')){
 const links=root.links.filter(l=>{try{return new URL(l.url).hostname===new URL(root.finalUrl).hostname&& !/\.(jpg|png|pdf|gpx|webp)|#|mailto:/.test(l.url)&& /razpis|proga|trasa|pravila|informacij|razdalj|rezultat|trail-tek|o-nas|about|race|result|distance|equipment|zgodov/i.test(l.text+' '+l.url)}catch{return false}}).slice(0,5)
 for(const l of links)await grab(r.slug,l.url)
 }console.log(r.slug,root.ok?'OK':'FAILED')}}))
}
await writeFile(`${dir}/evidence-index.json`,JSON.stringify(index,null,2))
console.log(JSON.stringify({pages:index.filter(x=>x.ok).length,failed:index.filter(x=>!x.ok).length}))
