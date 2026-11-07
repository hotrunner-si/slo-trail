// Explicit local QA. No public runners or knowledge records are created or changed.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
process.loadEnvFile('.env')
assert.ok(process.argv.includes('--project=favatadzmmqsdocrstti'))
const origin = 'http://localhost:3000'
const url = process.env.NUXT_PUBLIC_SUPABASE_URL
assert.equal(url, 'https://favatadzmmqsdocrstti.supabase.co')
const service = createClient(url, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const accounts = []
function must(result) {
  if (result.error) throw new Error(`QA operation failed (${result.error.code})`)
  return result.data
}
async function account(admin) {
  const email = `runner-admin-qa-${randomUUID()}@example.invalid`,
    password = randomUUID() + 'Aa9!'
  const user = must(
    await service.auth.admin.createUser({ email, password, email_confirm: true }),
  ).user
  const jar = new Map()
  const client = createServerClient(url, process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => cookies.forEach((c) => jar.set(c.name, c.value)),
    },
  })
  const result = { user, client, jar }
  accounts.push(result)
  if (admin) must(await service.from('brain_admins').insert({ user_id: user.id }))
  must(await client.auth.signInWithPassword({ email, password }))
  return result
}
async function request(account, path, body, expected = 200) {
  const response = await fetch(origin + path, {
    method: body ? 'POST' : 'GET',
    redirect: 'manual',
    headers: {
      Origin: origin,
      ...(account ? { Cookie: [...account.jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  })
  assert.equal(
    response.status,
    expected,
    `${path}: ${response.status} ${expected === response.status ? '' : await response.text()}`,
  )
  return response
}
try {
  const admin = await account(true),
    member = await account(false)
  await request(null, '/api/brain/admin-runners', null, 401)
  await request(member, '/api/brain/admin-runners', null, 403)
  await request(member, '/skrbnik/tekaci', null, 403)
  await request(member, '/api/brain/profile', { name: 'Test', bio: '', region: '' }, 403)
  await request(member, '/api/brain/files', {}, 403)
  await request(member, '/api/brain/my-runner', null, 403)
  await request(null, '/api/brain/my-runner', null, 401)
  const rpc = await member.client.rpc('brain_profile_save', {
    p_name: 'QA',
    p_bio: '',
    p_region: '',
  })
  assert.ok(rpc.error, 'Member must not create profiles via direct RPC')
  const html = await (await request(member, '/profil')).text()
  assert.ok(html.includes('Profil tekača'))
  const unlinkedEditor = await (await request(member, '/profil?view=runner')).text()
  assert.ok(unlinkedEditor.includes('Še nimate profila tekača na strani Tekači?'))
  assert.ok(unlinkedEditor.includes('mailto:team.slotrail@gmail.com'))
  assert.ok(!html.includes('Tvoje datoteke'))
  assert.ok(!html.includes('Tvoj profil tekača'))
  assert.ok(!html.includes('Zasebne datoteke'))
  console.log('PASS member profile, upload gate, admin route and direct RPC authorization')
  const list = await (await request(admin, '/api/brain/admin-runners')).json()
  assert.ok(list.runners.length)
  const linked = must(await service.from('brain_runner_links').select('runner_slug'))
  const first = list.runners.find((r) => !linked.some((l) => l.runner_slug === r.slug))
  assert.ok(first, 'Need an unlinked runner for the temporary request')
  await request(member, '/api/brain/link', { runner: first.slug })
  const adminQueue = await (await request(admin, '/api/brain/admin')).json()
  assert.ok(
    adminQueue.links.some(
      (link) => link.user_id === member.user.id && link.runner_slug === first.slug,
    ),
  )
  const pendingHtml = await (await request(member, '/profil?view=runner')).text()
  assert.ok(pendingHtml.includes('čaka na pregled skrbnika'))
  const queueHtml = await (await request(admin, '/mozgan/skrbnik?tab=links')).text()
  assert.ok(queueHtml.includes('Prošnje za povezave'))
  const pending = adminQueue.links.find((link) => link.user_id === member.user.id)
  await request(admin, '/api/brain/admin', { kind: 'link', id: pending.id, action: 'approve' })
  const linkedHtml = await (await request(member, '/profil')).text()
  assert.ok(linkedHtml.includes('Povezavo z obstoječim profilom že imaš.'))
  assert.ok(!linkedHtml.includes('Tvoje datoteke'))
  assert.ok(linkedHtml.includes('Tvoj profil tekača'))
  const ownerEditor = await (await request(member, '/profil?view=runner')).text()
  assert.ok(ownerEditor.includes('Slika in GPX'))
  assert.ok(ownerEditor.includes('GPX ture'))
  assert.ok(!ownerEditor.includes('Ustvari in objavi profil'))
  const owned = await (await request(member, '/api/brain/my-runner?slug=foreign-profile')).json()
  assert.equal(owned.slug, first.slug)
  const publicPage = await (await request(member, '/runners/' + first.slug)).text()
  assert.ok(!publicPage.includes('runner-owner-editor'))
  assert.ok(!publicPage.includes('Uredi profil'))
  await request(
    member,
    '/api/brain/my-runner/tour-delete',
    { id: 'missing-tour', confirm: false },
    400,
  )
  await request(
    member,
    '/api/brain/my-runner/tour-delete',
    { id: 'missing-tour', confirm: true },
    404,
  )
  await request(
    member,
    '/api/brain/admin-runners/' + first.slug + '/tour-delete',
    { id: 'missing-tour', confirm: true },
    403,
  )
  console.log(
    'PASS owner tab, own-profile authorization, removal of public editor and confirmed delete guard',
  )

  console.log('PASS link request, admin approval, linked profile text and file visibility')
  const record = await (await request(admin, '/api/brain/admin-runners/' + first.slug)).json()
  assert.equal(record.slug, first.slug)
  const keys = [
    'name',
    'location',
    'club',
    'favouriteDistance',
    'bio',
    'longDescription',
    'quote',
    'stravaUrl',
    'utmbUrl',
    'websiteUrl',
  ]
  const fields = Object.fromEntries(keys.map((key) => [key, record.data[key] || '']))
  await request(admin, '/api/brain/admin-runners', { slug: first.slug, data: fields }, 409)
  await request(
    admin,
    '/api/brain/admin-runners/' + first.slug,
    { data: fields, updatedAt: '2000-01-01T00:00:00Z' },
    409,
  )
  const unchanged = await (await request(admin, '/api/brain/admin-runners/' + first.slug)).json()
  assert.equal(unchanged.updated_at, record.updated_at)
  await request(admin, '/api/brain/admin-runners', { slug: '../bad', data: fields }, 400)
  const badFile = new FormData()
  badFile.append('file', new Blob(['invalid']), 'bad.gpx')
  badFile.append('title', 'Invalid test')
  await request(admin, '/api/brain/admin-runners/' + first.slug + '/media', badFile, 400)
  const adminHtml = await (await request(admin, '/profil')).text()
  for (const label of [
    'Ustvari nov profil tekača',
    'Urejanje profilov tekačev',
    'Prošnje za povezave',
  ])
    assert.ok(adminHtml.includes(label))
  await request(admin, '/skrbnik/tekaci')
  await request(admin, '/skrbnik/tekaci?nov=1')
  console.log(
    'PASS admin list/editor, create form, duplicate slug, stale save and invalid file checks',
  )
} finally {
  for (const a of accounts) {
    await a.client.auth.signOut({ scope: 'global' })
    must(await service.auth.admin.deleteUser(a.user.id))
  }
  console.log('PASS disposable QA accounts removed; public runners unchanged')
}
