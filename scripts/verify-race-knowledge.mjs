import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {createClient} from '@supabase/supabase-js'
import {brainEmbeddingSettings,createBrainVector} from '../server/utils/brain-embeddings.ts'
const dir='docs/knowledge/races-2026-11-07/'
const db=createClient(process.env.NUXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}})
const must=async p=>{const {data,error}=await p;if(error)throw Error(error.message);return data}
const races=JSON.parse(readFileSync(dir+'inventory.json','utf8'))
const entities=await must(db.from('brain_entities').select('id,race_slug,kind,year'))
const batch=await must(db.from('brain_sources').select('id,title,excerpt,url,origin,verified_at,entity_id,embedding_model').like('legacy_key','research:all-races:2026-11-07:%'))
const all=await must(db.from('brain_sources').select('id,url,verified_at,entity_id').not('url','is',null).not('verified_at','is',null))
const expected=[...JSON.parse(readFileSync(dir+'curated.json','utf8')),...JSON.parse(readFileSync(dir+'result-records.json','utf8'))]
assert.equal(batch.length,expected.length)
const entityMap=new Map(entities.map(e=>[e.id,e]))
const coverage=races.map(r=>({slug:r.slug,name:r.name,verified:all.filter(s=>entityMap.get(s.entity_id)?.race_slug===r.slug).length,newRecords:batch.filter(s=>entityMap.get(s.entity_id)?.race_slug===r.slug).length}))
assert.ok(coverage.every(r=>r.verified>=5))
assert.ok(batch.every(s=>s.url&&s.verified_at&&s.origin==='official'))
const duplicates=batch.filter((r,i,a)=>a.findIndex(s=>s.entity_id===r.entity_id&&s.title===r.title&&s.url===r.url)!==i)
assert.equal(duplicates.length,0)
const pending=batch.filter(s=>!s.embedding_model).length
const searches=[]
if(process.argv.includes('--search')){
 assert.equal(pending,0,'Finish embeddings before search QA')
 const settings=brainEmbeddingSettings({geminiApiKey:process.env.GEMINI_API_KEY,brainEmbeddingModel:process.env.BRAIN_EMBEDDING_MODEL});assert.ok(settings)
 for(const [query,slug]of [['Katera obvezna oprema je na Knap Trail 2027?','knap-trail'],['Soča Outdoor Festival odpoved 2020 zaradi koronavirusa','soca-outdoor-festival'],['Julian Alps 2024 25 km rezultati moški','julian-alps-trail-run-by-utmb']]){
 const vector=await createBrainVector(settings,query,'query')
 const results=await must(db.rpc('brain_nearest_sources',{p_vector:JSON.stringify(vector),p_model:settings.identity,p_kind:'',p_origin:'',p_public_only:true,p_entity:null}))
 assert.ok(results.some(r=>r.race_slug===slug),`Relevant race absent from nearest results: ${query}`)
 searches.push({query,top5:results.slice(0,5).map(r=>({title:r.title,race:r.race_slug,similarity:r.similarity}))})
 }
}
const report={checkedAt:new Date().toISOString(),newRecords:batch.length,pendingEmbeddings:pending,coverage,searches}
writeFileSync(dir+'verification.json',JSON.stringify(report,null,2))
const classes=JSON.parse(readFileSync(dir+'scope.json','utf8'))
const resultRecords=JSON.parse(readFileSync(dir+'result-records.json','utf8'))
const tableIndex=JSON.parse(readFileSync(dir+'result-table-index.json','utf8'))
const md=[
 '# Razširitev baze znanja vseh tekem — 7. november 2026','',
 `V živo potrjenih **${batch.length} novih zapisov**: ${batch.length-resultRecords.length} vsebinskih in ${resultRecords.length} zapisov rezultatov. Vsaka od ${races.length} tekem ima skupaj najmanj 5 zapisov z virom in datumom preverjanja. GO4Trail je bil že dovolj pokrit; novega osnovnega opisa nismo podvajali.`,
 '',`Manjkajoči vektorji tega uvoza ob preverjanju: **${pending}**.`,
 '', '## Obseg in metoda','',
 '- Razreda S in A sta uporabnikova uredniška razdelitev; zapis v scope.json. Javnega kataloga priljubljenosti nismo spreminjali.',
 '- S/A: do prvih 10 po spolu in trasi; ostale: do prvih 3. En zapis vsebuje celotno preverjeno razvrstitev ene trase, leta in spola. Uradna deljena mesta so ohranjena.',
 '- Prijavni seznami, DNS, DNF, diskvalifikacije in še neizvedene tekme niso uvoženi kot uvrstitve. Otroške in netekmovalne razvrstitve so izpuščene.',
 '- Vsi novi zapisi imajo URL, datum preverjanja in izvor official. Povzetki so uredniško parafrazirani; oznaka official pomeni izvor dokazila, ne dobesednega citata.',
 '- Letni zapisi so povezani z entitetami edition in relacijo edition_of ter letnim intervalom veljavnosti. Datumi 2027 so napovedi organizatorja, ne že izvedene tekme.',
 '- Številke v imenih rezultatnih tras so uradne oznake; niso samodejno obravnavane kot natančne GPX meritve. Npr. Kočevsko ima v starih imenih rezultatnih tabel tudi očitno neskladne podatke.',
 '- Shranjeni so pregledani izvlečki dokazil in surove javne rezultatne tabele. Ključi legacy_key omogočajo ponovljiv dodaten uvoz brez prepisovanja drugih zapisov.',
 '', '## Pokritost','', '| Tekma | Razred | Novi zapisi | Vsi preverjeni zapisi | Leta novih rezultatov |', '| --- | --- | ---: | ---: | --- |',
 ...coverage.map(r=>`| ${r.name} | ${classes.S.includes(r.slug)?'S':classes.A.includes(r.slug)?'A':'ostale'} | ${r.newRecords} | ${r.verified} | ${[...new Set(resultRecords.filter(x=>x.slug===r.slug).map(x=>x.year))].sort().join(', ')||'—'} |`),
 '', '## Vrzeli in neskladja','',
 '- Cilj raziskave je obdobje od 2020 dalje, vendar popolna zgodovinska pokritost ni dosežena. Leta brez dostopnega dokaza niso zapolnjena z ugibanjem. Preglednica zgoraj izrecno kaže najdena leta rezultatov.',
 '- Soča in Julian Alps 2020: potrjena odpoved zaradi covida-19. Julian Alps 170 km 2022: potrjena odpoved zaradi poplav in plazov. Soča 50 km 2026: potrjena odpoved zaradi vročine.',
 '- K24 2023: najden časomerilski dogodek, vendar brez prepoznane objavljene končne razvrstitve. To samo po sebi ne dokazuje razloga odpovedi.',
 '- Za K24 2020–2022, Knap pred 2025, Kriško goro pred 2025 in Podbrdo pred 2024 popolne top 10 razvrstitve še niso vključene. Pri Podbrdu so ohranjene povezave do PDF arhiva 2021 v evidence-index.json.',
 '- Obala 2026 in Lahinja 2026: ob raziskavi še nista bili potrjeni kot zaključeni končni razvrstitvi; rezultati niso uvoženi.',
 '- Nekateri stari prikazi pri časomerilcu vrnejo 404 ali imajo drugačno strukturo stolpcev. Izpuščeni primeri in vzroki so v result-table-index.json ter result-review.json. Brez jasnega končnega časa in razvrstitve po spolu ni samodejnega uvoza.',
 '- Nekatere uradne strani mešajo različne letnice in podatke: K24 100 km proti 94,5 km v časovnici, UTVV različni vzponi na karticah in v pravilniku, stare oznake Ribnice ter prestavljeni Čaven. Uvoz uporablja imenovani vir in leto ter ne spreminja javnega kataloga.',
 '- Polni podatki o opremi niso prepisani za vsako tekmo; kratki povzetki povezujejo na pravila. Pred nastopom je treba preveriti aktualno izdajo.',
 '', '## Preverjanje','',
 '- V živi bazi preverjeni število uvoženih vrstic, vsi URL-ji in datumi, povezave na tekme in minimalna pokritost 39/39. Brez natančnih dvojnikov znotraj uvoza.',
 ...(searches.length?['- Tri žive poizvedbe pomenskega iskanja so vrnile relevantno tekmo med najbližjimi zapisi; podrobnosti v verification.json.']:[]),
 '- Google prijava, pravice in shema podatkovne baze v tem delu niso spreminjani.',
 '', '## Ponovitev in nadaljevanje','',
 '1. Raziskava: scripts/research-race-knowledge.mjs in evidence-index.json.',
 '2. Pregled in priprava: curated.mjs ter scripts/prepare-race-result-records.mjs.',
 '3. Dodaten uvoz: node --env-file=.env scripts/import-race-knowledge.mjs --write --project=favatadzmmqsdocrstti.',
 '4. Vektorji: node --env-file=.env scripts/index-race-knowledge-batch.mjs --write --project=favatadzmmqsdocrstti.',
 '5. Preverjanje: node --env-file=.env scripts/verify-race-knowledge.mjs --search.',
 '', 'Podrobni JSON zapisi in dokazila so v isti mapi. API skrivnosti niso del raziskovalnih datotek.',''
].join('\n')
writeFileSync(dir+'README.md',md)
console.log(JSON.stringify({newRecords:batch.length,covered:coverage.length,pendingEmbeddings:pending,searches:searches.length}))
