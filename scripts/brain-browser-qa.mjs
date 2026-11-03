// Local-only QA bridge for a disposable synthetic account. Never deploy this script.
// No authentication credential is printed or written to disk.
import { createServer } from 'node:http'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
const ref = 'favatadzmmqsdocrstti'
if (process.env.NODE_ENV === 'production' || !process.argv.includes(`--project=${ref}`))
  throw new Error('Local explicit test project required')
const url = process.env.NUXT_PUBLIC_SUPABASE_URL,
  key = process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
if (url !== `https://${ref}.supabase.co`) throw new Error('Wrong project')
const destination = process.env.BRAIN_TEST_ORIGIN || 'http://127.0.0.1:3012'
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(destination)) throw new Error('Loopback only')
const service = createClient(url, process.env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
function data(result) {
  if (result.error) throw new Error('QA setup failed')
  return result.data
}
const email = `brain-browser-test-${randomUUID()}@example.invalid`
const user = data(
  await service.auth.admin.createUser({
    email,
    email_confirm: true,
    password: randomUUID() + 'aA9!',
    user_metadata: { display_name: 'Trail raziskovalec' },
  }),
).user
if (process.argv.includes('--admin'))
  data(await service.from('brain_admins').insert({ user_id: user.id }))
if (process.argv.includes('--runner-owner')) {
  const runners = data(await service.from('runners').select('slug'))
  const links = data(await service.from('brain_runner_links').select('runner_slug'))
  const free = runners.find((r) => !links.some((l) => l.runner_slug === r.slug))
  if (!free) {
    await service.auth.admin.deleteUser(user.id)
    throw new Error('No unlinked public runner available for private QA fixture')
  }
  data(
    await service.from('brain_runner_links').insert({ user_id: user.id, runner_slug: free.slug }),
  )
}
let closing = false
async function cleanup() {
  if (closing) return
  closing = true
  server.close()
  await service.auth.admin.signOut(session.access_token)
  const { data: objects } = await service.storage.from('brain-private').list(user.id)
  if (objects?.length)
    await service.storage.from('brain-private').remove(objects.map((o) => `${user.id}/${o.name}`))
  await service.auth.admin.deleteUser(user.id)
  console.log('Disposable browser account and private files removed.')
  process.exit(0)
}
const link = data(await service.auth.admin.generateLink({ type: 'magiclink', email }))
const cookies = []
const client = createServerClient(url, key, {
  cookieOptions: { httpOnly: true, sameSite: 'lax', secure: false },
  cookies: { getAll: () => [], setAll: (c) => cookies.push(...c) },
})
const session = data(
  await client.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'email' }),
).session
const server = createServer((req, res) => {
  if (req.method !== 'GET' || req.url !== '/enter') {
    res.writeHead(404).end()
    return
  }
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader(
    'Set-Cookie',
    cookies.map((c) => `${c.name}=${c.value}; Path=/; HttpOnly; SameSite=Lax`),
  )
  res.writeHead(303, { Location: destination + '/mozgan' }).end()
})
const bridgeHost = new URL(destination).hostname
server.listen(4399, bridgeHost, () =>
  console.log(`Disposable browser QA ready: http://${bridgeHost}:4399/enter`),
)
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)
setTimeout(cleanup, 30 * 60 * 1000).unref()
