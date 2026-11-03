import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

try {
  process.loadEnvFile('.env')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const origin = 'http://127.0.0.1:4398'
const server = spawn(process.execPath, ['--env-file=.env', '.output/server/index.mjs'], {
  env: { ...process.env, NITRO_PORT: '4398', NITRO_HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let logs = ''
server.stdout.on('data', (chunk) => {
  logs += chunk
})
server.stderr.on('data', (chunk) => {
  logs += chunk
})
try {
  let response
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      response = await fetch(`${origin}/api/content`)
      if (response.ok) break
    } catch {}
    if (server.exitCode !== null) throw new Error('Preview server exited')
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
  assert.ok(response?.ok, 'Content endpoint must be available')
  const content = await response.json()
  const paths = [
    '/',
    '/races',
    '/runners',
    '/routes',
    '/journal',
    '/mozgan',
    '/mozgan/analitika',
    '/mozgan/racun',
    ...content.races.map((r) => `/races/${r.slug}`),
    ...content.runners.map((r) => `/runners/${r.slug}`),
    ...content.trailRoutes.map((r) => `/routes/${r.slug}`),
    ...content.articles.map((a) => `/journal/${a.slug}`),
  ]
  for (const path of paths) {
    const page = await fetch(origin + path)
    const html = await page.text()
    assert.equal(page.status, 200, `${path} returned ${page.status}`)
    assert.ok(/<h[12][\s>]/.test(html), `${path} has no rendered heading`)
    assert.ok(
      html.includes(
        'https://favatadzmmqsdocrstti.supabase.co/storage/v1/object/public/site-assets/',
      ),
      `${path} has no Storage asset links`,
    )
    assert.ok(!/src="\/(images|gpx)\//.test(html), `${path} still serves local content assets`)
    assert.ok(!html.includes('sb_secret_'), `${path} contains a secret key`)
    if (path === '/mozgan') {
      assert.ok(html.includes('dashboard-workspace'), 'Možgan dashboard must render')
      assert.ok(!html.includes('brain-hero'), 'Možgan must not contain a marketing hero')
      assert.ok(html.includes('brain-survey'), 'Knowledge question must render')
      assert.ok(html.includes('brain-session-bar'), 'Account state must render')
      assert.ok(html.includes('brain-query'), 'Assistant composer must render')
      assert.ok(!html.includes('>Newsletter '), 'Header CTA must be Možgan')
    }
    if (path.startsWith('/mozgan')) {
      assert.ok(
        html.includes('aria-label="Navigacija Možgana"'),
        'Shared workspace navigation must render',
      )
      assert.ok(
        html.includes('/mozgan/analitika') && html.includes('/mozgan/baza'),
        'All workspace pages must be reachable',
      )
      assert.ok(
        !html.includes('class="site-footer"'),
        'Workspace must not include the marketing footer',
      )
    }
  }
  const protectedPage = await fetch(origin + '/mozgan/baza', { redirect: 'manual' })
  assert.equal(protectedPage.status, 302, 'Database page requires sign-in')
  assert.match(protectedPage.headers.get('location'), /mozgan\/racun/)
  for (const path of ['/api/brain/question', '/api/brain/analytics', '/api/brain/admin'])
    assert.equal((await fetch(origin + path)).status, 401, `${path} must reject guests`)
  for (const path of [
    '/races/not-a-race',
    '/runners/not-a-runner',
    '/journal/not-an-article',
    '/routes/not-a-route',
  ])
    assert.equal((await fetch(origin + path)).status, 404, `${path} must be 404`)
  const html = await (await fetch(origin + '/')).text()
  for (const value of [process.env.SUPABASE_SECRET_KEY].filter(Boolean)) {
    assert.ok(!html.includes(value), 'Secret key present in HTML')
    async function inspect(directory) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name)
        if (entry.isDirectory()) await inspect(path)
        else if (/\.(mjs|js|json|html)$/.test(path))
          assert.ok(
            !(await readFile(path, 'utf8')).includes(value),
            `Secret key present in build: ${path}`,
          )
      }
    }
    await inspect('.output/server')
    await inspect('.output/public/_nuxt')
  }
  console.log(
    `PASS: ${paths.length} rendered pages, 4 missing-page responses, Storage links, and no secret key in HTML or build.`,
  )
} catch (error) {
  console.error(logs.slice(-2500))
  throw error
} finally {
  server.kill()
}
