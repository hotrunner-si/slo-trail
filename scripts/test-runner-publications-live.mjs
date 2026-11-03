// Explicit QA: synthetic accounts, public profile and published files are always removed.
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
  process.argv.find((a) => a.startsWith('--origin='))?.slice(9) || 'http://localhost:3000'
assert.match(origin, /^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+$/)
const service = createClient(url, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const users = [],
  clients = [],
  mediaIds = new Set(),
  slug = 'publication-qa-' + randomUUID()
const must = (r) => {
  if (r.error)
    throw new Error(`QA database operation failed (${r.error.code || r.error.status || 'unknown'})`)
  return r.data
}
async function account() {
  const email = `publication-qa-${randomUUID()}@example.invalid`,
    password = randomUUID() + 'aA9!'
  const user = must(
    await service.auth.admin.createUser({ email, password, email_confirm: true }),
  ).user
  users.push(user.id)
  const jar = new Map()
  const client = createServerClient(url, process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cs) => cs.forEach((c) => jar.set(c.name, c.value)),
    },
  })
  must(await client.auth.signInWithPassword({ email, password }))
  clients.push(client)
  return { id: user.id, client, jar }
}
async function request(a, path, body, status = 200) {
  const r = await fetch(origin + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Origin: origin,
      ...(a ? { Cookie: [...a.jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    redirect: 'manual',
  })
  assert.equal(r.status, status, `Unexpected HTTP status: ${path.split('?')[0]}`)
  return r
}
const gpx = Buffer.from(
  '<gpx><trk><trkseg><trkpt lat="46" lon="14"><ele>100</ele></trkpt><trkpt lat="46.01" lon="14.01"><ele>150</ele></trkpt><trkpt lat="46.02" lon="14.02"><ele>125</ele></trkpt></trkseg></trk></gpx>',
)
async function upload(a, slot, expected, bytes, name) {
  const form = new FormData()
  form.append('slot', String(slot))
  form.append('expected', expected)
  form.append('file', new Blob([bytes]), name)
  await request(a, '/api/brain/files', form)
}
async function state(a) {
  return (await (await request(a, '/api/brain/session')).json()).account
}
async function catalog(a) {
  return (await request(a, '/api/brain/catalog')).json()
}
async function publish(a, file, extra = {}) {
  await request(a, '/api/brain/publication', {
    file: file.id,
    expected: file.path,
    consent: true,
    ...extra,
  })
  const p = (await state(a)).publications.find((p) => p.file_id === file.id)
  assert.ok(p)
  mediaIds.add(p.id)
  return p
}
try {
  const a = await account(),
    b = await account()
  must(
    await service
      .from('runners')
      .insert({
        slug,
        position: 999999,
        data: {
          id: slug,
          slug,
          name: 'Synthetic publication test',
          image: '',
          bio: 'Test',
          longDescription: 'Test',
          quote: '',
          location: 'Test',
          favouriteRouteSlugs: [],
        },
      }),
  )
  must(await service.from('brain_runner_links').insert({ user_id: a.id, runner_slug: slug }))
  const draft = {
    name: 'Updated synthetic runner',
    location: 'Test',
    club: 'Test',
    favouriteDistance: '25 km',
    bio: 'Test',
    longDescription: 'Test',
    quote: 'Synthetic quote',
    stravaUrl: 'https://www.strava.com/athletes/1',
    utmbUrl: 'https://utmb.world/runner/test',
    websiteUrl: 'https://example.org',
  }
  await request(a, `/api/brain/runner/${slug}`, draft)
  await request(b, `/api/brain/runner/${slug}`, draft, 403)
  assert.equal((await catalog(a)).runners.find((r) => r.slug === slug).websiteUrl, draft.websiteUrl)
  const entities = must(
    await service.from('brain_entities').select('title').eq('runner_slug', slug),
  )
  assert.equal(entities.length, 1)
  assert.equal(entities[0].title, draft.name)
  console.log('PASS editable links, foreign edit denial and knowledge-catalog synchronization')
  const png = await sharp({
    create: { width: 1800, height: 900, channels: 3, background: '#315736' },
  })
    .png()
    .toBuffer()
  await upload(a, 4, '', png, 'picture.png')
  let picture = (await state(a)).files.find((f) => f.slot === 4)
  await request(
    a,
    '/api/brain/publication',
    { file: picture.id, expected: picture.path, consent: false },
    400,
  )
  await request(
    b,
    '/api/brain/publication',
    { file: picture.id, expected: picture.path, consent: true },
    403,
  )
  const photo = await publish(a, picture)
  let r = await request(null, `/api/runner-media/${photo.id}/image.webp`)
  assert.equal(r.headers.get('content-type'), 'image/webp')
  assert.equal(
    (await catalog(a)).runners.find((r) => r.slug === slug).image,
    `/api/runner-media/${photo.id}/image.webp`,
  )
  console.log('PASS explicit photo publication, public read and foreign publication denial')
  await upload(a, 1, '', gpx, 'track.gpx')
  let file = (await state(a)).files.find((f) => f.slot === 1)
  const pubBody = {
    file: file.id,
    expected: file.path,
    consent: true,
    title: 'Synthetic tour',
    location: 'Synthetic area',
    description: 'Synthetic route description',
    date: '2026-11-02',
  }
  await request(a, '/api/brain/publication', pubBody, 400)
  await request(a, '/api/brain/route', { file: file.id, title: 'Synthetic tour' })
  let review = (await state(a)).routes.find((r) => r.file_path === file.path)
  must(await service.from('brain_admins').insert({ user_id: b.id }))
  await request(b, '/api/brain/admin', { kind: 'route', id: review.id, action: 'reject' })
  await request(a, '/api/brain/route', { file: file.id, title: 'Corrected synthetic tour' })
  await request(b, '/api/brain/admin', { kind: 'route', id: review.id, action: 'approve' })
  const tour = await publish(a, file, pubBody)
  const content = await catalog(a),
    routes = content.runnerGpxRoutes[slug]
  assert.equal(routes.length, 1)
  assert.equal(routes[0].id, tour.id)
  assert.equal(routes[0].elevationGain, 50)
  assert.equal(routes[0].title, pubBody.title)
  for (const variant of [
    'original.gpx',
    'preview.json',
    'detail.json',
    'route.simple.json',
    'route.full.json',
    'profile.simple.json',
    'profile.full.json',
    'map.webp',
    'map-portrait.webp',
  ]) {
    r = await request(null, `/api/runner-media/${tour.id}/${variant}`)
    if (variant.endsWith('webp'))
      assert.equal((await sharp(Buffer.from(await r.arrayBuffer())).metadata()).format, 'webp')
    else if (variant.endsWith('json')) assert.ok(await r.json())
  }
  await request(b, '/api/brain/unpublish', { id: tour.id }, 400)
  console.log(
    'PASS rejected GPX resubmission, approval gate, public tour metadata and all nine public assets',
  )
  const previous = file
  await upload(a, 1, file.path, gpx, 'replacement.gpx')
  file = (await state(a)).files.find((f) => f.slot === 1)
  assert.notEqual(file.path, previous.path)
  await request(null, `/api/runner-media/${tour.id}/detail.json`)
  await request(a, '/api/brain/publication', { ...pubBody, expected: file.path }, 400)
  await request(a, '/api/brain/route', { file: file.id, title: 'New version' })
  review = (await state(a)).routes.find((r) => r.file_path === file.path)
  await request(b, '/api/brain/admin', { kind: 'route', id: review.id, action: 'approve' })
  const updatedTour = await publish(a, file, { ...pubBody, expected: file.path })
  await request(null, `/api/runner-media/${tour.id}/detail.json`, undefined, 404)
  assert.equal((await catalog(a)).runnerGpxRoutes[slug].length, 1)
  await request(b, '/api/brain/delete-file', { id: file.id, expected: file.path }, 400)
  await request(a, '/api/brain/delete-file', { id: file.id, expected: file.path })
  await request(null, `/api/runner-media/${updatedTour.id}/detail.json`, undefined, 404)
  assert.ok(!(await catalog(a)).runnerGpxRoutes[slug]?.length)
  console.log(
    'PASS immutable published snapshot, reviewed replacement, foreign delete denial and publication cleanup',
  )
  await request(a, '/api/brain/unpublish', { id: photo.id })
  await request(null, `/api/runner-media/${photo.id}/image.webp`, undefined, 404)
  assert.equal((await catalog(a)).runners.find((r) => r.slug === slug).image, '')
  await publish(a, picture)
  await request(a, '/api/brain/unlink', {})
  assert.equal((await state(a)).link, null)
  assert.equal((await state(a)).publications.length, 0)
  assert.equal((await catalog(a)).runners.find((r) => r.slug === slug).image, '')
  await request(a, `/api/brain/runner/${slug}`, draft, 403)
  assert.ok(must(await service.from('runners').select('slug').eq('slug', slug).single()))
  console.log(
    'PASS photo retraction/restoration and unlink retracts media, preserves runner, removes edit rights',
  )
} finally {
  for (const client of clients) await client.auth.signOut({ scope: 'global' })
  const rows = must(await service.from('brain_runner_media').select('id').eq('runner_slug', slug))
  rows.forEach((r) => mediaIds.add(r.id))
  must(await service.from('brain_runner_media').delete().eq('runner_slug', slug))
  for (const id of mediaIds) {
    const objects = must(
      await service.storage.from('runner-publications').list(id, { limit: 1000 }),
    )
    if (objects.length)
      must(
        await service.storage
          .from('runner-publications')
          .remove(objects.map((o) => `${id}/${o.name}`)),
      )
    must(await service.from('brain_public_media_cleanup').delete().eq('id', id))
  }
  for (const id of users) {
    const objects = must(await service.storage.from('brain-private').list(id, { limit: 1000 }))
    if (objects.length)
      must(
        await service.storage.from('brain-private').remove(objects.map((o) => `${id}/${o.name}`)),
      )
    must(await service.auth.admin.deleteUser(id))
  }
  must(await service.from('brain_entities').delete().eq('runner_slug', slug))
  must(await service.from('runners').delete().eq('slug', slug))
  console.log('PASS synthetic accounts, public runner and all publication assets removed')
}
