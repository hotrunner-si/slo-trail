import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import vm from 'node:vm'
import sharp from 'sharp'
import { z } from 'zod'
import { processGpx } from '../server/utils/gpx-processing.ts'
import { processAccountImage } from '../server/utils/image-processing.ts'
import { gpxThumbnails } from '../server/utils/gpx-thumbnails.ts'
import { publicationVariants } from '../server/utils/public-media.ts'

test('tour deletion requires confirmation, scopes deletion to its runner and cleans app publications', async () => {
  const id = '11111111-1111-4111-8111-111111111111'
  for (const publication of [false, true]) {
    const deletions = [],
      filters = [],
      queues = []
    let cleaned = 0
    let body = { id, confirm: false }
    const service = {
      from: (table) => {
        let deleting = false
        const query = {
          select: () => query,
          eq: (key, value) => {
            filters.push([table, key, value])
            return query
          },
          single: async () => ({
            data: { data: { downloadUrl: `/api/admin-runner-media/test/${id}/original.gpx` } },
            error: null,
          }),
          delete: () => {
            deleting = true
            deletions.push(table)
            return query
          },
          maybeSingle: async () => ({
            data: deleting || (table === 'brain_runner_media' && publication) ? { id } : null,
            error: null,
          }),
          upsert: async (value) => {
            queues.push(value.id)
            return { error: null }
          },
        }
        return query
      },
    }
    const source = readFileSync(
      new URL('../server/api/brain/admin-runners/[slug]/tour-delete.post.ts', import.meta.url),
      'utf8',
    )
      .replace(/^import .*$/gm, '')
      .replace('export default ', '')
    const handler = vm.runInNewContext(source, {
      z,
      JSON,
      defineEventHandler: (fn) => fn,
      brainMutation() {},
      brainLimit() {},
      runnerEditorAccess: async () => ({ user: { id: 'actor' }, slug: 'test' }),
      brainBody: async (_, schema) => schema.parse(body),
      brainService: () => service,
      brainCheck(error) {
        assert.equal(error, null)
      },
      cleanupPublicMedia: async () => {
        cleaned++
      },
      createError: (value) => Object.assign(new Error(value.statusMessage), value),
    })
    await assert.rejects(() => handler({}))
    assert.equal(deletions.length, 0)
    body = { id, confirm: true }
    await handler({})
    assert.deepEqual(deletions, [publication ? 'brain_runner_media' : 'runner_tours'])
    assert.ok(
      filters.some(
        ([table, key, value]) =>
          table === deletions[0] && key === 'runner_slug' && value === 'test',
      ),
    )
    assert.equal(cleaned, 1)
    if (!publication) assert.deepEqual(queues, [id])
  }
})

test('owner editor resolves the runner from authenticated ownership and rejects unlinked accounts', async () => {
  let linked = false
  const source = readFileSync(
    new URL('../server/utils/runner-editor-access.ts', import.meta.url),
    'utf8',
  )
    .replace(/^import .*$/gm, '')
    .replace('export async function', 'async function')
  const helper = vm.runInNewContext(stripTypeScriptTypes(source) + '\nrunnerEditorAccess', {
    brainIdentity: async () => ({
      user: { id: 'member' },
      client: {
        from: () => {
          const query = {
            select: () => query,
            eq: () => query,
            maybeSingle: async () => ({
              data: linked ? { runner_slug: 'owned-runner' } : null,
              error: null,
            }),
          }
          return query
        },
      },
    }),
    brainCheck(error) {
      assert.equal(error, null)
    },
    brainAdmin: async () => {
      throw new Error('Not admin')
    },
    createError: (value) => Object.assign(new Error(value.statusMessage), value),
  })
  const event = { context: { runnerEditorOwner: true }, body: { slug: 'foreign-runner' } }
  await assert.rejects(
    () => helper(event),
    (e) => e.statusCode === 403,
  )
  linked = true
  assert.equal((await helper(event)).slug, 'owned-runner')
  await assert.rejects(() => helper({ context: {} }), /Not admin/)
})

test('tour edits preserve GPX data and use manual distance and elevation as catalog totals', async () => {
  const original = {
    id: 'tour',
    title: 'Tour',
    distanceKm: 10,
    elevationGain: 500,
    preview: { distanceKm: 10 },
    detailUrl: '/original/detail.json',
  }
  let saved
  const query = {
    select: () => query,
    eq: () => query,
    single: async () => ({ data: { data: original }, error: null }),
    update: (value) => {
      saved = value.data
      return query
    },
    maybeSingle: async () => ({ data: { id: 'tour' }, error: null }),
  }
  let body = {
    id: 'tour',
    title: 'Tour',
    location: '',
    description: '',
    dateIso: '',
    distanceKm: 12.75,
    elevationGain: 0,
  }
  const source = readFileSync(
    new URL('../server/api/brain/admin-runners/[slug]/tour.post.ts', import.meta.url),
    'utf8',
  )
    .replace(/^import .*$/gm, '')
    .replace('export default ', '')
  const handler = vm.runInNewContext(source, {
    z,
    JSON,
    defineEventHandler: (fn) => fn,
    brainMutation() {},
    runnerEditorAccess: async () => ({ user: { id: 'admin' }, slug: 'test' }),
    adminRunnerParam: () => 'test',
    brainBody: async (_, schema) => schema.parse(body),
    brainService: () => ({ from: () => query }),
    brainCheck(error) {
      assert.equal(error, null)
    },
    createError: (value) => Object.assign(new Error(value.statusMessage), value),
  })
  await handler({})
  assert.equal(saved.distanceKm, 12.75)
  assert.equal(saved.elevationGain, 0)
  assert.equal(saved.preview.distanceKm, 10)
  assert.equal(saved.detailUrl, original.detailUrl)
  body = { ...body, distanceKm: -1 }
  await assert.rejects(() => handler({}))
  body = { ...body, distanceKm: 12, elevationGain: -1 }
  await assert.rejects(() => handler({}))
})

test('public admin media requires an active catalog reference before reading storage', async () => {
  const id = '11111111-1111-4111-8111-111111111111'
  let published = false,
    downloads = 0
  const service = {
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({
          error: null,
          data: published
            ? { data: { image: `/api/admin-runner-media/test/${id}/image.webp` } }
            : null,
        }),
      }
      return query
    },
    storage: {
      from: () => ({
        download: async () => {
          downloads++
          return { error: null, data: new Blob(['image']) }
        },
      }),
    },
  }
  const source = readFileSync(
    new URL('../server/api/admin-runner-media/[slug]/[id]/[variant].get.ts', import.meta.url),
    'utf8',
  )
    .replace(/^import .*$/gm, '')
    .replace('export default ', '')
  const handler = vm.runInNewContext(source, {
    Buffer,
    publicationVariants,
    defineEventHandler: (fn) => fn,
    adminRunnerParam: () => 'test',
    getRouterParam: (_, key) => (key === 'id' ? id : 'image.webp'),
    brainService: () => service,
    setResponseHeader() {},
    createError: (value) => Object.assign(new Error(value.statusMessage), value),
  })
  await assert.rejects(
    () => handler({}),
    (e) => e.statusCode === 404,
  )
  assert.equal(downloads, 0)
  published = true
  assert.equal((await handler({})).toString(), 'image')
  assert.equal(downloads, 1)
})

function mediaFixture(file, failCommit = false) {
  const uploads = new Map(),
    removed = []
  const runner = {
    data: { name: 'Test', image: '', bio: 'Preserve me', utmbIndex: 777 },
    updated_at: 'v1',
  }
  let tour, imageUpdate
  const service = {
    storage: {
      from: () => ({
        upload: async (path, bytes, options) => {
          uploads.set(path, { bytes, options })
          return { error: null }
        },
        remove: async (paths) => {
          removed.push(...paths)
          paths.forEach((path) => uploads.delete(path))
          return { error: null }
        },
      }),
    },
    from: (table) =>
      table === 'runner_tours'
        ? {
            insert: async (value) => {
              tour = value
              return { error: failCommit ? { code: 'test' } : null }
            },
          }
        : {
            update: (value) => {
              imageUpdate = value
              const chain = {
                eq: () => chain,
                select: () => chain,
                maybeSingle: async () => ({
                  error: null,
                  data: failCommit ? null : { slug: 'test' },
                }),
              }
              return chain
            },
          },
  }
  let source = readFileSync(
    new URL('../server/api/brain/admin-runners/[slug]/media.post.ts', import.meta.url),
    'utf8',
  )
  source = source.replace(/^import .*$/gm, '').replace('export default ', '')
  source = stripTypeScriptTypes(source)
  const handler = vm.runInNewContext(source, {
    Buffer,
    crypto,
    processGpx,
    processAccountImage,
    gpxThumbnails,
    defineEventHandler: (fn) => fn,
    brainMutation() {},
    brainLimit() {},
    runnerEditorAccess: async () => ({ user: { id: 'admin' }, slug: 'test' }),
    adminRunnerParam: () => 'test',
    adminRunnerRecord: async () => runner,
    getHeader: () => String(file.data.length + 1000),
    readMultipartFormData: async () => [
      { name: 'file', ...file },
      { name: 'title', data: Buffer.from('Test route') },
    ],
    brainService: () => service,
    createError: (value) => Object.assign(new Error(value.statusMessage), value),
  })
  return {
    handler,
    uploads,
    removed,
    get tour() {
      return tour
    },
    get imageUpdate() {
      return imageUpdate
    },
  }
}
const gpx = Buffer.from(
  '<gpx><trk><trkseg><trkpt lat="46" lon="14"><ele>100</ele></trkpt><trkpt lat="46.01" lon="14.01"><ele>150</ele></trkpt><trkpt lat="46.02" lon="14.02"><ele>120</ele></trkpt></trkseg></trk></gpx>',
)

test('admin GPX upload creates public geometry, elevation data, thumbnails and scoped catalog URLs', async () => {
  const fixture = mediaFixture({ filename: 'route.gpx', data: gpx })
  await fixture.handler({})
  assert.equal(fixture.tour.runner_slug, 'test')
  assert.equal(fixture.tour.data.title, 'Test route')
  assert.ok(fixture.tour.data.distanceKm > 0)
  assert.equal(fixture.tour.data.elevationGain, 50)
  assert.match(
    fixture.tour.data.downloadUrl,
    /^\/api\/admin-runner-media\/test\/[0-9a-f-]+\/original.gpx$/,
  )
  assert.ok([...fixture.uploads.keys()].some((key) => key.endsWith('/detail.json')))
  assert.ok([...fixture.uploads.keys()].some((key) => key.endsWith('/map.webp')))
  assert.ok([...fixture.uploads.keys()].some((key) => key.endsWith('/profile.full.json')))
})
test('admin photo upload re-encodes the image and preserves unrelated runner data', async () => {
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: '#315736' } })
    .png()
    .toBuffer()
  const fixture = mediaFixture({ filename: 'photo.png', data: png })
  await fixture.handler({})
  assert.equal(fixture.imageUpdate.data.utmbIndex, 777)
  assert.equal(fixture.imageUpdate.data.bio, 'Preserve me')
  const upload = [...fixture.uploads.values()][0]
  assert.equal((await sharp(upload.bytes).metadata()).format, 'webp')
  assert.match(fixture.imageUpdate.data.image, /\/image.webp$/)
})
test('failed media commit cleans uploaded assets and malformed GPX never reaches storage', async () => {
  const failed = mediaFixture({ filename: 'route.gpx', data: gpx }, true)
  await assert.rejects(
    () => failed.handler({}),
    (e) => e.statusCode === 409,
  )
  assert.equal(failed.uploads.size, 0)
  assert.ok(failed.removed.length > 1)
  const invalid = mediaFixture({ filename: 'bad.gpx', data: Buffer.from('<!DOCTYPE gpx><gpx/>') })
  await assert.rejects(
    () => invalid.handler({}),
    (e) => e.statusCode === 400,
  )
  assert.equal(invalid.uploads.size, 0)
})
