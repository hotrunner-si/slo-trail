// Same embedding identity/task/dimensions as the application's single-document writer.
// Public API reference: https://ai.google.dev/api/embeddings/batch-embed-contents
import assert from 'node:assert/strict'
import {createClient} from '@supabase/supabase-js'
import {writeFileSync} from 'node:fs'
import {brainEmbeddingSettings,normalizeBrainVector,BRAIN_VECTOR_DIMENSIONS} from '../server/utils/brain-embeddings.ts'
const project='favatadzmmqsdocrstti'
assert.ok(process.argv.includes('--write')&&process.argv.includes(`--project=${project}`))
assert.equal(process.env.NUXT_PUBLIC_SUPABASE_URL,`https://${project}.supabase.co`)
const settings=brainEmbeddingSettings({geminiApiKey:process.env.GEMINI_API_KEY,brainEmbeddingModel:process.env.BRAIN_EMBEDDING_MODEL})
assert.ok(settings)
const db=createClient(process.env.NUXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}})
const must=async p=>{const {data,error}=await p;if(error)throw Error(error.message);return data}
const rows=await must(db.from('brain_sources').select('id,title,excerpt').like('legacy_key','research:all-races:2026-11-07:%').is('embedding',null).in('origin',['official','editorial']).order('id'))
let processed=0
console.log(JSON.stringify({pending:rows.length,batchSize:16,model:settings.identity}))
for(let i=0;i<rows.length;i+=16){const chunk=rows.slice(i,i+16);let values
 for(let attempt=1;;attempt++){
 const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:batchEmbedContents`,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':settings.apiKey},body:JSON.stringify({requests:chunk.map(row=>({model:`models/${settings.model}`,content:{parts:[{text:`${row.title}\n${row.excerpt}`}]},taskType:'RETRIEVAL_DOCUMENT',title:row.title,outputDimensionality:BRAIN_VECTOR_DIMENSIONS}))}),signal:AbortSignal.timeout(30000)})
 if(response.ok){const j=await response.json();assert.equal(j.embeddings?.length,chunk.length);values=j.embeddings.map(x=>normalizeBrainVector(x.values));break}
 const error=await response.json().catch(()=>({}))
 if(attempt>=6||![408,429,500,502,503,504].includes(response.status))throw Error(`Batch embedding failed: HTTP ${response.status}`)
 const retry=error.error?.details?.find(x=>x.retryDelay)?.retryDelay
 const delay=Math.min(60000,Math.max(15000*attempt,parseFloat(retry||'0')*1000))
 console.log(JSON.stringify({retrying:true,status:response.status,delayMs:delay}));await new Promise(r=>setTimeout(r,delay))
 }
 for(let n=0;n<chunk.length;n++){const row=chunk[n];const updated=await must(db.from('brain_sources').update({embedding:JSON.stringify(values[n]),embedding_model:settings.identity}).eq('id',row.id).eq('title',row.title).eq('excerpt',row.excerpt).is('embedding',null).select('id'));processed+=updated.length}
 console.log(JSON.stringify({processed,pending:rows.length-Math.min(i+16,rows.length)}))
 await new Promise(r=>setTimeout(r,1100))
}
writeFileSync('docs/knowledge/races-2026-11-07/index-report.json',JSON.stringify({completedAt:new Date().toISOString(),processed,model:settings.identity},null,2))
console.log(JSON.stringify({processed,completed:true}))
