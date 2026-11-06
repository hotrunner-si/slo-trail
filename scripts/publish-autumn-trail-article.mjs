import fs from 'node:fs'
import assert from 'node:assert/strict'
// Default: publish prepared editorial text while retaining database metadata.
// --from-preview: copy the complete private preview exactly, after final approval.
assert.ok(process.argv.includes('--write'), 'Pass --write to update the published article')
process.loadEnvFile('.env')
const base = process.env.NUXT_PUBLIC_SUPABASE_URL
assert.equal(base, 'https://favatadzmmqsdocrstti.supabase.co')
const key = process.env.SUPABASE_SECRET_KEY
assert.ok(key, 'Missing database key')
const fromPreview = process.argv.includes('--from-preview')
const local = JSON.parse(fs.readFileSync(fromPreview ? 'server/data/journal-draft.json' : 'docs/articles/jesenski-trojcek-2026/published-article.json', 'utf8'))
const headers = { apikey: key, ...(key.startsWith('eyJ') ? { Authorization: `Bearer ${key}` } : {}) }
const path = `${base}/rest/v1/articles?slug=eq.${encodeURIComponent(local.slug)}`
const get = await fetch(`${path}&select=data,updated_at`, { headers })
assert.ok(get.ok, `Read failed: ${get.status}`)
const rows = await get.json()
assert.equal(rows.length, 1, 'Expected one existing article')
const current = rows[0]
const data = fromPreview ? local : { ...current.data, title: local.title, subtitle: local.subtitle, body: local.body,
  trailAnalysis: { ...current.data.trailAnalysis, beforeChart: local.trailAnalysis.beforeChart, afterChart: local.trailAnalysis.afterChart } }
const response = await fetch(`${path}&updated_at=eq.${encodeURIComponent(current.updated_at)}`, {
  method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ data }),
})
assert.ok(response.ok, `Update failed: ${response.status}`)
const updated = await response.json()
assert.equal(updated.length, 1, 'Concurrent edit detected; reload the article before retrying')
const verify = await fetch(`${path}&select=data`, { headers })
assert.ok(verify.ok, `Verification failed: ${verify.status}`)
const [saved] = await verify.json()
assert.deepEqual(saved.data, data, 'Saved article differs from the prepared update')
if (fromPreview) fs.writeFileSync('docs/articles/jesenski-trojcek-2026/published-article.json', JSON.stringify(data, null, 2) + '\n')
console.log(JSON.stringify({ published: local.slug, title: data.title, verified: true }))
