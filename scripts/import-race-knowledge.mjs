// Idempotent additive import of the reviewed research package; no schema/auth changes.
import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createClient} from '@supabase/supabase-js'
const dir='docs/knowledge/races-2026-11-07/'
const project='favatadzmmqsdocrstti'
assert.equal(process.env.NUXT_PUBLIC_SUPABASE_URL,`https://${project}.supabase.co`)
const sources=[...JSON.parse(readFileSync(dir+'curated.json','utf8')),...JSON.parse(readFileSync(dir+'result-records.json','utf8'))]
const keys=new Set()
for(const s of sources){
 assert.ok(s.title.length>=3&&s.title.length<=200&&s.excerpt.length>=10&&s.excerpt.length<=8000)
 assert.ok(/^https?:$/.test(new URL(s.url).protocol))
 assert.ok(s.year===null||(s.year>=2020&&s.year<=2027))
 assert.equal(s.origin,'official')
 const hash=s.stableKey||createHash('sha256').update(`${s.slug}:${s.year}:${s.topic}`).digest('hex').slice(0,20)
 s.legacy_key=`research:all-races:2026-11-07:${hash}`
 assert.ok(!keys.has(s.legacy_key),'Duplicate import key');keys.add(s.legacy_key)
}
if(!process.argv.includes('--write')){console.log(JSON.stringify({validated:sources.length,mode:'dry-run'}));process.exit()}
assert.ok(process.argv.includes(`--project=${project}`))
const db=createClient(process.env.NUXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const must=async p=>{const {data,error}=await p;if(error)throw new Error(error.message);return data}
const races=await must(db.from('brain_entities').select('id,race_slug,legacy_key,title').eq('kind','race'))
const entityMap=new Map(races.map(r=>[r.race_slug,r.id]))
for(const s of sources)assert.ok(entityMap.has(s.slug),`Unknown race ${s.slug}`)
const yearKeys=[...new Map(sources.filter(s=>s.year).map(s=>[`${s.slug}:${s.year}`,s])).values()]
for(const s of yearKeys){const key=`edition:${s.slug}:${s.year}`
 const [e]=await must(db.from('brain_entities').upsert({kind:'edition',title:`${races.find(r=>r.race_slug===s.slug).title} ${s.year}`,race_slug:s.slug,year:s.year,legacy_key:key},{onConflict:'legacy_key',ignoreDuplicates:true}).select('id'))
 let id=e?.id
 if(!id){const rows=await must(db.from('brain_entities').select('id').eq('legacy_key',key));id=rows[0]?.id}
 assert.ok(id);entityMap.set(`${s.slug}:${s.year}`,id)
 await must(db.from('brain_relations').upsert({subject_id:id,object_id:entityMap.get(s.slug),relation:'edition_of'},{onConflict:'subject_id,object_id,relation',ignoreDuplicates:true}))
}
let inserted=0,unchanged=0
for(let i=0;i<sources.length;i+=50){const chunk=sources.slice(i,i+50)
 const existing=await must(db.from('brain_sources').select('id,legacy_key,title,excerpt,url').in('legacy_key',chunk.map(s=>s.legacy_key)))
 const byKey=new Map(existing.map(r=>[r.legacy_key,r]))
 const rows=chunk.filter(s=>{const old=byKey.get(s.legacy_key);if(!old)return true;assert.equal(old.title,s.title);assert.equal(old.excerpt,s.excerpt);assert.equal(old.url,s.url);unchanged++;return false}).map(s=>({entity_id:entityMap.get(s.year?`${s.slug}:${s.year}`:s.slug),title:s.title,excerpt:s.excerpt,url:s.url,origin:s.origin,verified_at:'2026-11-07',valid_from:s.year?`${s.year}-01-01`:null,valid_until:s.year?`${s.year}-12-31`:null,legacy_key:s.legacy_key}))
 if(rows.length){const saved=await must(db.from('brain_sources').insert(rows).select('id'));inserted+=saved.length}
 console.log(JSON.stringify({processed:Math.min(i+50,sources.length),inserted,unchanged}))
}
const all=await must(db.from('brain_sources').select('id,legacy_key,entity_id').like('legacy_key','research:all-races:2026-11-07:%'))
assert.equal(all.length,sources.length)
const report={verifiedAt:new Date().toISOString(),inserted,unchanged,totalBatch:all.length,byRace:Object.fromEntries([...new Set(sources.map(s=>s.slug))].sort().map(slug=>[slug,sources.filter(s=>s.slug===slug).length]))}
writeFileSync(dir+'import-report.json',JSON.stringify(report,null,2))
console.log(JSON.stringify(report))
