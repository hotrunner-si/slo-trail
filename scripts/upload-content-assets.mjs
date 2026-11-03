import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { extname, join } from 'node:path'

try {
  process.loadEnvFile('.env')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const base = process.env.NUXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '')
const secret = process.env.SUPABASE_SECRET_KEY
if (base !== 'https://favatadzmmqsdocrstti.supabase.co')
  throw new Error('Unexpected Supabase target.')
if (!secret) throw new Error('Set SUPABASE_SECRET_KEY in .env before uploading assets.')
const bucket = 'site-assets'
const auth = {
  apikey: secret,
  ...(secret.startsWith('eyJ') ? { Authorization: `Bearer ${secret}` } : {}),
}
const mime = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.gpx': 'application/gpx+xml',
  '.md': 'text/markdown',
  '.txt': 'text/plain',
}
async function request(path, options = {}) {
  const result = await fetch(`${base}${path}`, {
    ...options,
    headers: { ...auth, ...options.headers },
    signal: AbortSignal.timeout(120_000),
  })
  if (!result.ok)
    throw new Error(
      `Supabase ${result.status} for ${path.split('?')[0]}: ${(await result.text()).slice(0, 250)}`,
    )
  return result
}
const buckets = await (await request('/storage/v1/bucket')).json()
if (!buckets.some((item) => item.id === bucket))
  await request('/storage/v1/bucket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: bucket, name: bucket, public: true, file_size_limit: 52_428_800 }),
  })
const assets = JSON.parse(await readFile('.data/content-assets.json', 'utf8'))
const completed = new Map()
for (let offset = 0; ; offset += 500) {
  const page = await (
    await request(
      `/rest/v1/media_assets?select=path,sha256,uploaded_at&order=path&offset=${offset}&limit=500`,
    )
  ).json()
  for (const item of page) if (item.uploaded_at) completed.set(item.path, item.sha256)
  if (page.length < 500) break
}
let next = 0,
  done = 0
const manifest = assets.map((asset) => ({
  path: asset.path,
  storage_path: asset.path,
  size_bytes: asset.bytes,
  sha256: asset.sha256,
  content_type: mime[extname(asset.path).toLowerCase()] || 'application/octet-stream',
}))
for (let start = 0; start < manifest.length; start += 100)
  await request('/rest/v1/media_assets?on_conflict=path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify(manifest.slice(start, start + 100)),
  })
async function worker() {
  while (next < assets.length) {
    const asset = assets[next++]
    if (completed.get(asset.path) !== asset.sha256) {
      const path = asset.path.split('/').map(encodeURIComponent).join('/')
      const bytes = await readFile(join('public', asset.path))
      let verified = false
      for (let attempt = 0; attempt < 3 && !verified; attempt++) {
        try {
          await request(`/storage/v1/object/${bucket}/${path}`, {
            method: 'POST',
            headers: {
              'Content-Type': mime[extname(asset.path).toLowerCase()] || 'application/octet-stream',
              'x-upsert': 'true',
              'cache-control': '3600',
            },
            body: bytes,
          })
          const remote = await (
            await request(`/storage/v1/object/public/${bucket}/${path}`)
          ).arrayBuffer()
          if (createHash('sha256').update(Buffer.from(remote)).digest('hex') !== asset.sha256)
            throw new Error(`Hash mismatch: ${asset.path}`)
          await request(`/rest/v1/media_assets?path=eq.${encodeURIComponent(asset.path)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sha256: asset.sha256,
              size_bytes: asset.bytes,
              uploaded_at: new Date().toISOString(),
            }),
          })
          verified = true
        } catch (error) {
          if (attempt === 2) throw error
        }
      }
    }
    done++
    if (done % 50 === 0 || done === assets.length)
      console.log(`Verified ${done}/${assets.length} assets`)
  }
}
await Promise.all(Array.from({ length: 4 }, worker))
// Switch asset URLs only after every asset has been uploaded and hash verified.
await request('/rest/v1/site_content?on_conflict=key', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
  body: JSON.stringify({
    key: 'assets',
    data: { ready: true, bucket, verifiedCount: assets.length },
  }),
})
await writeFile(
  '.data/asset-upload-report.json',
  JSON.stringify(
    {
      verifiedCount: assets.length,
      bytes: assets.reduce((sum, a) => sum + a.bytes, 0),
      completedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
)
console.log('All assets verified; Storage URLs enabled.')
