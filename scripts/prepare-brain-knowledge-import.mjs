import { readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'

// Generates reviewable SQL only. Apply explicitly through the database tool.
const batches = [
  ['go4trail', 'docs/knowledge/go4trail-research-2026-11-05.json'],
  ['obala-ultra-trail', 'docs/knowledge/obala-research-2026-11-05.json'],
]
const quote = (s) => s == null ? 'null' : "'" + String(s).replaceAll("'", "''") + "'"
const statements = ['begin;']
let count = 0
for (const [slug, path] of batches) {
  const batch = JSON.parse(readFileSync(path, 'utf8'))
  assert.ok(batch.sources.length > 0)
  const raceKey = `race:${slug}`
  // Stable keys identify this first package; later editions use a separate year.
  for (const [index, source] of batch.sources.entries()) {
    assert.ok(source.editionYear === 2026 || source.editionYear === null)
    assert.equal(source.verifiedAt, '2026-11-05')
    assert.ok(source.title.length >= 3 && source.title.length <= 200)
    assert.ok(source.excerpt.length >= 10 && source.excerpt.length <= 8000)
    const url = new URL(source.url)
    assert.ok(url.protocol === 'https:')
    assert.ok(['go4trail.si', 'obalaultratrail.si', 'www.slovenia.info'].includes(url.hostname))
    const editionKey = `edition:${slug}:2026`
    if (index === 0) {
      statements.push(`insert into public.brain_entities(kind,title,race_slug,year,legacy_key,metadata)
select 'edition', title || ' 2026', race_slug, 2026, ${quote(editionKey)}, '{"research_batch":"2026-11-05"}'::jsonb
from public.brain_entities where legacy_key=${quote(raceKey)}
on conflict(legacy_key) do nothing;`)
      statements.push(`insert into public.brain_relations(subject_id,object_id,relation)
select e.id,r.id,'edition_of' from public.brain_entities e cross join public.brain_entities r
where e.legacy_key=${quote(editionKey)} and r.legacy_key=${quote(raceKey)} on conflict do nothing;`)
    }
    const origin = url.hostname === 'www.slovenia.info' ? 'editorial' : 'official'
    const entityKey = source.editionYear === null ? raceKey : editionKey
    const validUntil = source.editionYear === null ? 'null' : "'2026-12-31'::date"
    statements.push(`insert into public.brain_sources(entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until,legacy_key)
select id,${quote(source.title)},${quote(source.excerpt)},${quote(source.url)},${quote(origin)},${quote(source.verifiedAt)}::timestamptz,null,${validUntil},${quote(`research:${slug}:2026:${String(index + 1).padStart(2, '0')}`)}
from public.brain_entities where legacy_key=${quote(entityKey)}
on conflict(legacy_key) do update set title=excluded.title,excerpt=excluded.excerpt,url=excluded.url,origin=excluded.origin,verified_at=excluded.verified_at,valid_from=excluded.valid_from,valid_until=excluded.valid_until,
embedding=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding else null end,
embedding_model=case when brain_sources.excerpt=excluded.excerpt and brain_sources.title=excluded.title then brain_sources.embedding_model else null end;`)
    count++
  }
}
statements.push(`do $$ begin
if (select count(*) from public.brain_sources where legacy_key like 'research:go4trail:2026:%' or legacy_key like 'research:obala-ultra-trail:2026:%') <> ${count}
then raise exception 'Knowledge package count mismatch'; end if;
end $$;`)
statements.push('commit;')
writeFileSync('docs/knowledge/import-2026-11-05.sql', statements.join('\n\n') + '\n')
console.log(`Prepared ${count} sources; no database changes performed.`)
