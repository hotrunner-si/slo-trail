import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
try {
  process.loadEnvFile('.env')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const base = process.env.NUXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const key = process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (!base || !key) throw new Error('Missing public Supabase configuration.')
const response = await fetch(`${base}/rest/v1/rpc/get_site_content`, {
  method: 'POST',
  headers: { apikey: key, 'Content-Type': 'application/json' },
  body: '{}',
})
assert.equal(response.status, 200, 'Public read RPC must be accessible')
const content = await response.json()
const snapshot = JSON.parse(await readFile('.data/content-snapshot.json', 'utf8'))
for (const [collection, original] of Object.entries(snapshot))
  assert.deepEqual(content[collection], original, `${collection} changed during migration`)
// A public key must not allow content writes, including through the REST API.
const denied = await fetch(`${base}/rest/v1/site_content`, {
  method: 'POST',
  headers: { apikey: key, 'Content-Type': 'application/json', Prefer: 'tx=rollback' },
  body: JSON.stringify({ key: '__permission_probe__', data: {} }),
})
assert.ok([401, 403].includes(denied.status), `Public writes must be denied, got ${denied.status}`)
assert.equal(content.siteContent.assets.ready, true, 'Assets must be verified before switching')
const assetManifest = JSON.parse(await readFile('.data/content-assets.json', 'utf8'))
for (const prefix of ['images/', 'gpx/runners/', 'gpx/races/']) {
  const asset = assetManifest.find(
    (item) => item.path.startsWith(prefix) && !item.path.endsWith('.md'),
  )
  assert.ok(asset, `Missing representative asset for ${prefix}`)
  const path = asset.path.split('/').map(encodeURIComponent).join('/')
  const publicAsset = await fetch(`${base}/storage/v1/object/public/site-assets/${path}`)
  assert.equal(publicAsset.status, 200, `Public asset unavailable: ${asset.path}`)
  assert.equal(
    (await publicAsset.arrayBuffer()).byteLength,
    asset.bytes,
    `Asset size changed: ${asset.path}`,
  )
}
await writeFile('.data/remote-content.json', JSON.stringify(content))
console.log(
  'PASS: all original collections match Supabase exactly; public read succeeds; public writes denied; Storage assets accessible without credentials.',
)
