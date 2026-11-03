// Explicit local QA. No email is sent; temporary accounts and storage are removed.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import sharp from 'sharp'
try {
  process.loadEnvFile('.env')
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}
const project = 'favatadzmmqsdocrstti'
assert.ok(process.argv.includes(`--project=${project}`))
const url = process.env.NUXT_PUBLIC_SUPABASE_URL
assert.equal(url, `https://${project}.supabase.co`)
const origin =
  process.argv.find((a) => a.startsWith('--origin='))?.slice(9) || 'http://127.0.0.1:3012'
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+$/)
const service = createClient(url, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const users = []
const clients = []
const must = (r) => {
  if (r.error)
    throw new Error(`QA operation failed (${r.error.code || r.error.status || 'unknown'})`)
  return r.data
}
async function account() {
  const email = `file-qa-${randomUUID()}@example.invalid`,
    password = randomUUID() + 'aA9!'
  const user = must(
    await service.auth.admin.createUser({ email, password, email_confirm: true }),
  ).user
  users.push(user.id)
  const jar = new Map()
  const client = createServerClient(url, process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach((c) => jar.set(c.name, c.value)),
    },
  })
  must(await client.auth.signInWithPassword({ email, password }))
  clients.push(client)
  return { id: user.id, jar, client }
}
async function request(a, path, body, status = 200) {
  const r = await fetch(origin + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Origin: origin,
      ...(a ? { Cookie: [...a.jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
    },
    body,
    redirect: 'manual',
  })
  assert.equal(r.status, status, `Unexpected status for ${path.split('?')[0]}`)
  return r
}
async function upload(a, slot, expected, bytes, name, status = 200) {
  const form = new FormData()
  form.append('slot', String(slot))
  form.append('expected', expected)
  form.append('file', new Blob([bytes]), name)
  return request(a, '/api/brain/files', form, status)
}
const gpx = Buffer.from(
  '<gpx><trk><trkseg><trkpt lat="46" lon="14"><ele>100</ele></trkpt><trkpt lat="46.01" lon="14.01"><ele>125</ele></trkpt></trkseg></trk></gpx>',
)
try {
  const a = await account(),
    b = await account()
  await upload(a, 1, '', gpx, 'synthetic.gpx')
  const state = async () => (await (await request(a, '/api/brain/session')).json()).account
  let current = (await state()).files.find((f) => f.slot === 1)
  assert.equal(current.details.processingVersion, 1)
  assert.equal(Object.keys(current.details.artifacts).length, 6)
  for (const variant of Object.keys(current.details.artifacts)) {
    const r = await request(a, `/api/brain/files/${current.id}?variant=${variant}`)
    assert.equal(r.headers.get('cache-control'), 'private, no-store')
    assert.ok(await r.json())
  }
  await request(b, `/api/brain/files/${current.id}?variant=detail.json`, undefined, 404)
  await request(null, `/api/brain/files/${current.id}?variant=detail.json`, undefined, 401)
  await request(a, `/api/brain/files/${current.id}?variant=not-allowed`, undefined, 400)
  console.log('PASS six private GPX variants, owner access, foreign/guest denial')
  const previous = current
  await upload(a, 1, previous.path, Buffer.from('bad GPX'), 'bad.gpx', 400)
  assert.equal((await state()).files.find((f) => f.slot === 1).path, previous.path)
  await upload(a, 1, previous.path, gpx, 'replacement.gpx')
  current = (await state()).files.find((f) => f.slot === 1)
  assert.equal(current.id, previous.id)
  assert.notEqual(current.path, previous.path)
  const listed = must(await service.storage.from('brain-private').list(a.id, { limit: 1000 }))
  const names = new Set(listed.map((o) => `${a.id}/${o.name}`))
  for (const path of [previous.path, ...Object.values(previous.details.artifacts)])
    assert.ok(!names.has(path), 'Old artifact survived replacement')
  console.log('PASS failed upload preserves old GPX; replacement cleans all old derivatives')
  const png = await sharp({
    create: { width: 2000, height: 1000, channels: 3, background: '#315736' },
  })
    .png()
    .toBuffer()
  await upload(a, 4, '', png, 'portrait.png')
  let image = (await state()).files.find((f) => f.slot === 4)
  assert.equal(image.name, 'portrait.webp')
  const r = await request(a, `/api/brain/files/${image.id}`)
  assert.equal(r.headers.get('content-type'), 'image/webp')
  assert.ok(r.headers.get('content-disposition').startsWith('inline'))
  const metadata = await sharp(Buffer.from(await r.arrayBuffer())).metadata()
  assert.equal(metadata.width, 1600)
  assert.equal(metadata.height, 800)
  await upload(a, 4, image.path, png, 'portrait-again.jpg')
  const updated = (await state()).files.find((f) => f.slot === 4)
  assert.notEqual(updated.path, image.path)
  assert.equal(updated.id, image.id)
  console.log('PASS image conversion, output dimensions, inline preview and replacement')
} finally {
  for (const client of clients) await client.auth.signOut({ scope: 'global' })
  for (const id of users) {
    const objects = must(await service.storage.from('brain-private').list(id, { limit: 1000 }))
    if (objects.length)
      must(
        await service.storage.from('brain-private').remove(objects.map((o) => `${id}/${o.name}`)),
      )
    must(await service.auth.admin.deleteUser(id))
  }
  console.log('PASS temporary QA accounts and private objects removed')
}
