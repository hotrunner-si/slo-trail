// Disposable fixtures only. No emails are sent. Never print credentials, cookies or prompts.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
const project = 'favatadzmmqsdocrstti'
assert.ok(process.argv.includes(`--project=${project}`), 'Explicit test project is required')
const origin =
  process.argv.find((v) => v.startsWith('--origin='))?.slice(9) || 'http://localhost:3000'
assert.match(origin, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/)
assert.equal(process.env.NUXT_PUBLIC_SUPABASE_URL, `https://${project}.supabase.co`)
const service = createClient(
  process.env.NUXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)
const ids = [],
  threads = []
const must = (result) => {
  if (result.error) throw new Error(`Database test failed: ${result.error.code || 'unknown'}`)
  return result.data
}
async function account() {
  const email = `knowledge-test-${randomUUID()}@example.invalid`
  const user = must(
    await service.auth.admin.createUser({
      email,
      password: randomUUID() + 'aA9!',
      email_confirm: true,
      user_metadata: { display_name: 'Preizkus skupnosti' },
    }),
  ).user
  ids.push(user.id)
  const link = must(await service.auth.admin.generateLink({ type: 'magiclink', email }))
  const jar = new Map()
  const client = createServerClient(
    process.env.NUXT_PUBLIC_SUPABASE_URL,
    process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => [...jar].map(([name, value]) => ({ name, value })),
        setAll: (values) => values.forEach((v) => jar.set(v.name, v.value)),
      },
    },
  )
  must(await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'email' }))
  return { id: user.id, jar, client }
}
async function request(account, path, body, expected = 200) {
  const headers = {
    Origin: origin,
    ...(account ? { Cookie: [...account.jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  }
  const response = await fetch(origin + path, {
    method: body ? 'POST' : 'GET',
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    redirect: 'manual',
  })
  for (const cookie of response.headers.getSetCookie()) {
    const first = cookie.split(';')[0],
      i = first.indexOf('=')
    if (account) account.jar.set(first.slice(0, i), first.slice(i + 1))
  }
  assert.equal(
    response.status,
    expected,
    `${path} returned ${response.status}; expected ${expected}`,
  )
  assert.match(
    response.headers.get('cache-control') || '',
    expected < 400 ? /no-store/ : /no-store|no-cache/,
  )
  return response.headers.get('content-type')?.includes('json') ? response.json() : response.text()
}
const pass = (label) => console.log('PASS ' + label)
try {
  const [a, b] = await Promise.all([account(), account()])
  await request(null, '/api/brain/forum', undefined, 401)
  await request(null, '/api/brain/knowledge', undefined, 401)
  const library = await request(a, '/api/brain/knowledge')
  assert.ok(library.entries.length > 100)
  assert.ok(library.entries.some((e) => e.kind === 'race'))
  assert.ok(library.entries.some((e) => e.kind === 'source' && e.origin === 'official'))
  assert.ok(!JSON.stringify(library).includes('user_id'))
  const page = await request(a, '/mozgan/baza')
  assert.ok(page.includes('Baza znanja'))
  assert.ok(page.includes('Vsi zapisi'))
  pass(`authenticated SSR and full catalog (${library.entries.length} records)`)
  const value = {
    title: 'Začasni preizkus trail razprave',
    body: 'Kako se razlikujejo izkušnje na mokri in suhi trasi?',
    type: 'question',
    topic: 'routes',
    relatedKey: library.entries.find((e) => e.kind === 'race').id,
    year: 2026,
    conditions: '',
    consent: true,
  }
  await request(a, '/api/brain/forum', { ...value, consent: false }, 400)
  const thread = (await request(a, '/api/brain/forum', value)).id
  threads.push(thread)
  const post = (
    await request(b, '/api/brain/forum-reply', {
      thread,
      body: 'Po dežju je bila trasa mokra. To je moja osebna izkušnja.',
      consent: true,
    })
  ).id
  let detail = await request(a, '/api/brain/forum/' + thread)
  assert.equal(detail.posts.length, 1)
  assert.equal(detail.thread.reply_count, 1)
  assert.ok(detail.thread.unread)
  assert.equal(detail.posts[0].author_name, 'Preizkus skupnosti')
  assert.ok(!JSON.stringify(detail).includes(a.id))
  assert.ok(!JSON.stringify(detail).includes(b.id))
  await request(
    b,
    '/api/brain/forum-action',
    { thread, action: 'hide-thread', revision: detail.thread.revision },
    403,
  )
  await request(a, '/api/brain/forum-action', {
    thread,
    action: 'accept',
    post,
    revision: detail.thread.revision,
  })
  detail = await request(a, '/api/brain/forum/' + thread)
  assert.equal(detail.thread.accepted_post_id, post)
  await request(a, '/api/brain/forum-action', {
    thread,
    action: 'seen',
    revision: detail.thread.revision,
  })
  assert.equal((await request(a, '/api/brain/forum/' + thread)).thread.unread, false)
  pass('consent, reply counts, authorship isolation, useful answer and unread tracking')
  let aiSucceeded = false
  if (process.argv.includes('--ai')) {
    const response = await fetch(origin + '/api/brain/forum-summary', {
      method: 'POST',
      headers: {
        Origin: origin,
        Cookie: [...a.jar].map(([k, v]) => `${k}=${v}`).join('; '),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ thread, consent: true }),
    })
    if (response.ok) {
      aiSucceeded = true
      const result = await request(a, '/api/brain/forum/' + thread)
      assert.ok(result.summary?.overview)
      pass('live AI summary with validated contribution references')
    } else {
      assert.equal(response.status, 503)
      console.log('LIMIT live AI provider unavailable; checked graceful error response')
    }
  }
  if (!aiSucceeded) {
    const row = must(
      await service.from('brain_forum_threads').select('revision').eq('id', thread).single(),
    )
    must(
      await service
        .from('brain_forum_threads')
        .update({
          summary: {
            overview: 'Ena osebna izkušnja opisuje mokro traso.',
            agreements: [],
            differences: [],
            cautions: [{ text: 'Ena izkušnja ni uradna potrditev.', postIds: [post] }],
          },
          summary_revision: row.revision,
          summary_at: new Date().toISOString(),
        })
        .eq('id', thread),
    )
  }
  await request(b, '/api/brain/forum-action', { thread, action: 'publish' }, 403)
  must(await service.from('brain_admins').insert({ user_id: a.id }))
  detail = await request(a, '/api/brain/forum/' + thread)
  await request(a, '/api/brain/forum-action', {
    thread,
    action: 'publish',
    revision: detail.thread.revision,
  })
  assert.equal((await request(a, '/api/brain/forum/' + thread)).thread.published, true)
  let row = must(
    await service.from('brain_forum_threads').select('shared_id').eq('id', thread).single(),
  )
  const oldShared = row.shared_id
  assert.ok(oldShared)
  await request(b, '/api/brain/forum-action', {
    thread,
    action: 'edit-post',
    post,
    text: 'Dopolnjena osebna izkušnja: na suhi podlagi je bil oprijem boljši.',
    consent: true,
  })
  detail = await request(a, '/api/brain/forum/' + thread)
  assert.equal(detail.summary, null)
  assert.equal(detail.summaryStale, true)
  assert.equal(detail.thread.published, false)
  assert.equal(
    must(await service.from('brain_shared_conversations').select('id').eq('id', oldShared)).length,
    0,
  )
  pass('admin-only publication; edits withdraw stale chat snapshots atomically')
  await request(b, '/api/brain/forum-action', { thread, action: 'hide-post', post })
  detail = await request(a, '/api/brain/forum/' + thread)
  assert.equal(detail.thread.reply_count, 0)
  assert.equal(detail.thread.accepted_post_id, null)
  assert.equal((await request(b, '/api/brain/forum/' + thread)).posts[0].hidden, true)
  await request(b, '/api/brain/forum-action', { thread, action: 'restore-post', post })
  detail = await request(a, '/api/brain/forum/' + thread)
  await request(a, '/api/brain/forum-action', {
    thread,
    action: 'hide-thread',
    revision: detail.thread.revision,
  })
  await request(b, '/api/brain/forum/' + thread, undefined, 404)
  detail = await request(a, '/api/brain/forum/' + thread)
  await request(a, '/api/brain/forum-action', {
    thread,
    action: 'restore-thread',
    revision: detail.thread.revision,
  })
  assert.equal((await request(b, '/api/brain/forum/' + thread)).thread.hidden, false)
  assert.ok((await b.client.from('brain_forum_threads').select('*')).error)
  assert.ok(
    (
      await b.client.from('brain_forum_posts').insert({
        thread_id: thread,
        user_id: a.id,
        body: 'Spoofed contribution',
        author_name: 'Spoofed',
      })
    ).error,
  )
  pass('withdrawal/restoration, invalidation of accepted answer and direct Data API denial')
} finally {
  if (threads.length) must(await service.from('brain_forum_threads').delete().in('id', threads))
  for (const id of ids) {
    must(await service.from('brain_admins').delete().eq('user_id', id))
    must(await service.auth.admin.deleteUser(id))
  }
  console.log('Cleaned up disposable accounts and forum fixtures')
}
