// Explicit opt-in. Creates two disposable private test accounts; always removes owned fixtures.
// Does not send email, call AI or publish profiles/knowledge. Never print credentials/session data.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import sharp from 'sharp'
const ref = 'favatadzmmqsdocrstti'
if (!process.argv.includes(`--project=${ref}`)) throw new Error('Explicit --project is required')
const url = process.env.NUXT_PUBLIC_SUPABASE_URL,
  key = process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  secret = process.env.SUPABASE_SECRET_KEY
assert.equal(url, `https://${ref}.supabase.co`)
assert.ok(secret && key)
const origin =
  process.argv.find((a) => a.startsWith('--origin='))?.slice(9) ||
  process.env.BRAIN_TEST_ORIGIN ||
  'http://127.0.0.1:3012'
assert.match(
  origin,
  /^http:\/\/(127\.0\.0\.1|localhost):\d+$/,
  'Tests send sessions only to loopback',
)
const service = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const ids = [],
  objects = [],
  passed = []
function check(name) {
  passed.push(name)
  console.log(`PASS ${name}`)
}
function must(result) {
  if (result.error)
    throw new Error(
      `Supabase operation failed (${result.error.code || result.error.status || 'unknown'})`,
    )
  return result.data
}
async function account() {
  const email = `brain-test-${randomUUID()}@example.invalid`
  const password = randomUUID() + '!aA9'
  const data = must(
    await service.auth.admin.createUser({
      email,
      email_confirm: true,
      password,
    }),
  )
  ids.push(data.user.id)
  const link = must(await service.auth.admin.generateLink({ type: 'magiclink', email }))
  const jar = new Map()
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (values) => values.forEach((c) => jar.set(c.name, c.value)),
    },
  })
  must(await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'email' }))
  return { id: data.user.id, client, jar, email, password }
}
async function request(account, path, body, method = body ? 'POST' : 'GET', expected = 200) {
  const headers = {
    Origin: origin,
    ...(account ? { Cookie: [...account.jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
  }
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const result = await fetch(origin + path, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    redirect: 'manual',
  })
  for (const cookie of result.headers.getSetCookie()) {
    const [part] = cookie.split(';'),
      i = part.indexOf('=')
    if (account) account.jar.set(part.slice(0, i), part.slice(i + 1))
  }
  const text = await result.text()
  assert.equal(result.status, expected, `${path} returned ${result.status} (expected ${expected})`)
  return {
    data: result.headers.get('content-type')?.includes('json') && text ? JSON.parse(text) : text,
    headers: result.headers,
  }
}
const gpx =
  '<gpx version="1.1"><trk><trkseg><trkpt lat="46" lon="14"/><trkpt lat="46.01" lon="14.01"/></trkseg></trk></gpx>'
async function upload(a, slot, expected = '', content = gpx, filename = 'test.gpx', status = 200) {
  const form = new FormData()
  form.append('slot', String(slot))
  form.append('expected', expected)
  form.append('file', new Blob([content]), filename)
  return request(a, '/api/brain/files', form, 'POST', status)
}
try {
  const [a, b] = await Promise.all([account(), account()])
  const settings = await fetch(url + '/auth/v1/settings', { headers: { apikey: key } }).then((r) =>
    r.json(),
  )
  assert.equal(settings.external?.email, true)
  check('email provider enabled; synthetic verified login')
  const state = (await request(a, '/api/brain/session')).data
  assert.equal(state.user.id, a.id)
  assert.match(
    state ? (await request(a, '/api/brain/session')).headers.get('cache-control') : '',
    /no-store/,
  )
  await request(a, '/mozgan/baza', undefined, 'GET', 200)
  await request(null, '/api/brain/question', undefined, 'GET', 401)
  await request(null, '/api/brain/analytics', undefined, 'GET', 401)
  await request(null, '/api/brain/search', { query: '', semantic: false }, 'POST', 401)
  await request(a, '/api/brain/admin', undefined, 'GET', 403)
  await request(a, '/api/brain/admin-summary', undefined, 'GET', 403)
  await request(null, '/api/brain/admin-summary', undefined, 'GET', 401)
  const gate = await request(null, '/mozgan/baza', undefined, 'GET', 302)
  assert.match(gate.headers.get('location'), /mozgan\/racun/)
  check('guest/account/admin access and private response headers')
  await request(
    null,
    '/api/brain/email',
    { email: 'unused@example.invalid', currentPassword: 'unused' },
    'POST',
    401,
  )
  await request(
    a,
    '/api/brain/email',
    { email: 'not-an-email', currentPassword: a.password },
    'POST',
    400,
  )
  await request(
    a,
    '/api/brain/email',
    { email: 'unused@example.invalid', currentPassword: 'wrong-password' },
    'POST',
    400,
  )
  assert.equal((await request(a, '/api/brain/session')).data.user.email, a.email)
  check(
    'email change requires authentication, valid email and correct current password; no email sent',
  )
  await request(null, '/api/brain/account-name', { name: 'Testni vzdevek' }, 'POST', 401)
  await request(a, '/api/brain/account-name', { name: '   ' }, 'POST', 400)
  await request(a, '/api/brain/account-name', { name: '  Testni Vzdevek  ' })
  const named = (await request(a, '/api/brain/session')).data
  assert.equal(named.user.displayName, 'Testni Vzdevek')
  assert.equal(named.account.profile, null)
  assert.equal(named.account.admin, false)
  assert.equal((await request(b, '/api/brain/session')).data.user.displayName, '')
  await request(a, '/api/brain/account-name', { name: 'Drugo ime' })
  assert.equal((await request(a, '/api/brain/session')).data.user.displayName, 'Drugo ime')
  check(
    'private editable account name is separate from public runner profile and admin permissions',
  )
  await request(a, '/api/brain/profile', {
    name: 'Zasebni testni profil',
    bio: 'Začasni preskus dostopa.',
    region: 'Test',
  })
  const own = must(await a.client.from('brain_profiles').select('*'))
  assert.equal(own.length, 1)
  const other = must(await b.client.from('brain_profiles').select('*'))
  assert.equal(other.length, 0)
  assert.ok(
    (
      await b.client
        .from('brain_profiles')
        .insert({ user_id: b.id, display_name: 'Nedovoljeno', status: 'approved' })
    ).error,
  )
  must(await service.from('brain_admins').insert({ user_id: b.id }))
  const adminSummary = (await request(b, '/api/brain/admin-summary')).data
  assert.ok(adminSummary.profiles >= 1)
  assert.ok(Number.isInteger(adminSummary.links))
  await request(b, '/api/brain/admin', { kind: 'profile', id: a.id, action: 'approve' })
  const approved = (await request(a, '/api/brain/session')).data.account.profile
  assert.equal(approved.status, 'approved')
  assert.equal(approved.public_runner_slug, null)
  must(await service.from('brain_admins').delete().eq('user_id', b.id))
  check('RLS isolation, no self-approval, admin approval separate from public runner')
  const q = (await request(a, '/api/brain/question')).data
  assert.ok(q?.id)
  assert.equal('counts' in q, false)
  const before = must(await service.from('brain_summaries').select('id').eq('user_id', a.id)).length
  await request(a, '/api/brain/experience', {
    question: q.id,
    entity: q.entity_id,
    year: 2025,
    conditions: 'wet',
    statement: 'Zasebna testna izkušnja na kratkem odseku.',
    direct: true,
    save: false,
  })
  assert.equal(
    must(await service.from('brain_summaries').select('id').eq('user_id', a.id)).length,
    before,
  )
  assert.equal(must(await service.from('brain_answers').select('id').eq('user_id', a.id)).length, 0)
  check('storage off creates no answer, summary or extracted content')
  await request(a, '/api/brain/answer', { question: q.id, choice: 'skip', save: true })
  await request(a, '/api/brain/answer', { question: q.id, choice: 'skip', save: true }, 'POST', 409)
  assert.equal(must(await service.from('brain_answers').select('id').eq('user_id', a.id)).length, 1)
  check('duplicate account answers rejected atomically')
  const q2 = (await request(a, '/api/brain/question')).data
  await request(a, '/api/brain/experience', {
    question: q2.id,
    entity: q2.entity_id,
    year: 2025,
    conditions: 'wet',
    statement: 'Zasebni testni povzetek: na odseku je bila mokra podlaga.',
    direct: true,
    save: true,
  })
  assert.equal(
    must(await service.from('brain_pending_experiences').select('id').eq('user_id', a.id)).length,
    1,
  )
  must(
    await service.from('brain_summaries').insert(
      Array.from({ length: 6 }, (_, i) => ({
        user_id: a.id,
        summary: `Zasebni testni povzetek ${i}`,
      })),
    ),
  )
  assert.equal((await request(a, '/api/brain/session')).data.account.summaries.length, 5)
  assert.equal((await request(b, '/api/brain/session')).data.account.summaries.length, 0)
  assert.ok((await a.client.from('brain_summaries').select('*')).error)
  check('private structured summary queued; latest five only; no raw summary access')
  for (const slot of [1, 2, 3]) await upload(a, slot)
  let files = (await request(a, '/api/brain/session')).data.account.files
  assert.equal(files.filter((f) => f.kind === 'gpx').length, 3)
  const old = files.find((f) => f.slot === 1)
  const ownDownload = await request(a, `/api/brain/files/${old.id}`)
  assert.match(ownDownload.data, /<gpx/)
  assert.match(ownDownload.headers.get('content-disposition'), /attachment/)
  objects.push(old.path)
  await upload(b, 5, '', gpx, 'test.gpx', 400)
  await upload(a, 1, old.path, '<!DOCTYPE gpx>' + gpx, 'bad.gpx', 400)
  assert.equal(
    (await request(a, '/api/brain/session')).data.account.files.find((f) => f.slot === 1).path,
    old.path,
  )
  await request(b, `/api/brain/files/${old.id}`, undefined, 'GET', 404)
  const foreign = await b.client.storage.from('brain-private').download(old.path)
  assert.ok(foreign.error)
  const directUpload = await a.client.storage
    .from('brain-private')
    .upload(`${a.id}/forged.gpx`, gpx, { contentType: 'application/gpx+xml' })
  assert.ok(directUpload.error)
  await request(a, '/api/brain/route', { file: old.id, title: 'Zasebna testna trasa' })
  must(await service.from('brain_admins').insert({ user_id: b.id }))
  const review = (await request(a, '/api/brain/session')).data.account.routes[0]
  await request(b, '/api/brain/admin', { kind: 'route', id: review.id, action: 'approve' })
  assert.equal((await request(a, '/api/brain/session')).data.account.routes[0].status, 'approved')
  await request(b, `/api/brain/files/${old.id}`)
  must(await service.from('brain_admins').delete().eq('user_id', b.id))
  await request(b, `/api/brain/files/${old.id}`, undefined, 'GET', 404)
  await upload(a, 1, old.path)
  files = (await request(a, '/api/brain/session')).data.account.files
  assert.notEqual(files.find((f) => f.slot === 1).path, old.path)
  assert.ok((await service.storage.from('brain-private').download(old.path)).error)
  const stale = (await request(a, '/api/brain/session')).data.account.routes[0]
  assert.equal(stale.status, 'replaced')
  await upload(a, 1, old.path, gpx, 'test.gpx', 409)
  const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } })
    .png()
    .toBuffer()
  await upload(a, 4, '', image, 'test.png')
  await upload(b, 4, '', '<svg/>', 'test.svg', 400)
  assert.equal((await request(a, '/api/brain/session')).data.account.files.length, 4)
  check(
    'three GPX + one image; blocked direct upload; safe failure/replacement; foreign file denied',
  )
  const search = (await request(a, '/api/brain/search', { query: '', semantic: false })).data
  assert.ok(search.records.length > 0)
  assert.equal(
    search.records.some((r) => r.origin === 'official'),
    false,
  )
  assert.equal(
    search.records.some((r) => 'user_id' in r),
    false,
  )
  const distanceSearch = (
    await request(a, '/api/brain/search', { query: '', semantic: false, kind: 'distance' })
  ).data
  assert.ok(distanceSearch.records.length > 0)
  assert.ok(distanceSearch.records.every((r) => r.kind === 'distance'))
  const record = (await request(a, `/api/brain/record/${search.records[0].entity_id}`)).data
  assert.ok(record.entity.id)
  assert.equal(
    record.sources.some((s) => 'user_id' in s),
    false,
  )
  const publicContent = (await request(null, '/api/content')).data
  assert.ok(publicContent.races.length)
  assert.equal('brain_profiles' in publicContent, false)
  check('protected search has real editorial sources; public catalogue remains available')
  await request(a, '/api/brain/logout', {})
  assert.equal((await request(a, '/api/brain/session')).data.user, null)
  await request(a, '/api/brain/question', undefined, 'GET', 401)
  check('logout clears cookie session and access')
  await request(a, '/api/brain/login', { email: a.email, password: a.password })
  assert.equal((await request(a, '/api/brain/session')).data.user.id, a.id)
  const newPassword = randomUUID() + '!bB8'
  await request(
    null,
    '/api/brain/password',
    { password: newPassword, repeatPassword: newPassword },
    'POST',
    401,
  )
  await request(
    a,
    '/api/brain/password',
    { password: newPassword, repeatPassword: 'does-not-match' },
    'POST',
    400,
  )
  await request(
    a,
    '/api/brain/password',
    { password: newPassword, repeatPassword: newPassword },
    'POST',
    400,
  )
  await request(
    a,
    '/api/brain/password',
    {
      currentPassword: 'incorrect-current-password',
      password: newPassword,
      repeatPassword: newPassword,
    },
    'POST',
    400,
  )
  await request(a, '/api/brain/password', {
    currentPassword: a.password,
    password: newPassword,
    repeatPassword: newPassword,
  })
  assert.equal((await request(a, '/api/brain/session')).data.user, null)
  await request(a, '/api/brain/login', { email: a.email, password: a.password }, 'POST', 400)
  await request(a, '/api/brain/login', { email: a.email, password: newPassword })
  assert.equal((await request(a, '/api/brain/session')).data.user.id, a.id)
  await request(a, '/api/brain/logout', {})
  check(
    'password login, mismatch/unauthenticated/missing-current-password rejection, password change and old password invalidation',
  )
  console.log(`Completed ${passed.length} live groups.`)
} finally {
  for (const id of ids) {
    const list = await service.storage.from('brain-private').list(id, { limit: 100 })
    const paths = (list.data || []).map((f) => `${id}/${f.name}`)
    if (paths.length) must(await service.storage.from('brain-private').remove(paths))
    must(await service.auth.admin.deleteUser(id))
  }
  console.log('Disposable private test accounts and files removed.')
}
