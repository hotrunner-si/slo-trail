import { test } from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { processGpx } from '../server/utils/gpx-processing.ts'
import { processAccountImage } from '../server/utils/image-processing.ts'
import { gpxThumbnails } from '../server/utils/gpx-thumbnails.ts'
const xml = (points) => Buffer.from(`<gpx><trk><trkseg>${points}</trkseg></trk></gpx>`)
const pt = (lat, lon, ele) =>
  `<trkpt lat="${lat}" lon="${lon}">${ele == null ? '' : `<ele>${ele}</ele>`}</trkpt>`

test('upload produces all six GPX variants with aligned profile and map', () => {
  const result = processGpx(xml(pt(46, 14, 100) + pt(46.01, 14.01, 125) + pt(46.02, 14.02, 115)))
  assert.equal(Object.keys(result.artifacts).length, 6)
  assert.equal(result.details.pointCount, 3)
  assert.equal(result.details.elevationGain, 25)
  assert.equal(result.details.elevationLoss, 10)
  assert.ok(result.details.distanceKm > 2 && result.details.distanceKm < 3)
  const detail = result.artifacts['detail.json']
  assert.equal(detail.route.length, detail.detailedProfile.length)
  assert.deepEqual(detail.route.at(-1), [46.02, 14.02])
  assert.deepEqual(result.artifacts['route.full.json'].route, detail.route)
})

test('missing elevation is never presented as zero ascent or a fabricated profile', () => {
  const r = processGpx(xml(pt(46, 14) + pt(46.01, 14.01, 120)))
  assert.equal(r.details.elevationGain, null)
  assert.equal(r.details.elevationsComplete, false)
  assert.deepEqual(r.artifacts['detail.json'].detailedProfile, [])
  assert.equal(r.artifacts['detail.json'].route.length, 2)
})

test('segments never add the distance across a gap; waypoints do not enter the track', () => {
  const input = `<gpx><wpt lat="0" lon="0"/><trk><trkseg>${pt(46, 14, 10)}${pt(46.001, 14, 20)}</trkseg><trkseg>${pt(47, 15, 10)}${pt(47.001, 15, 20)}</trkseg></trk></gpx>`
  const r = processGpx(Buffer.from(input))
  assert.equal(r.details.pointCount, 4)
  assert.ok(r.details.distanceKm < 0.3)
  assert.deepEqual(r.artifacts['detail.json'].segmentStarts, [0, 2])
  assert.equal(r.details.elevationGain, 20)
})

test('GPX accepts namespaced route points and rejects unsafe XML and coordinates', () => {
  const r = processGpx(
    Buffer.from(
      '<g:gpx xmlns:g="urn:gpx"><g:rte><g:rtept lat="46" lon="14"/><g:rtept lat="46.1" lon="14.1"/></g:rte></g:gpx>',
    ),
  )
  assert.equal(r.details.pointCount, 2)
  for (const bad of [
    '<!DOCTYPE gpx [<!ENTITY x SYSTEM "file:///bad">]><gpx/>',
    '<gpx><trk>',
    '<html/>',
    '<gpx>' + '<a>'.repeat(40) + '</a>'.repeat(40) + '</gpx>',
    xml(pt(999, 14, 100) + pt(46, 14, 100)),
    xml(pt('', 14, 100) + pt(46, 14, 100)),
    Buffer.alloc(5242881),
  ])
    assert.throws(() => processGpx(Buffer.from(bad)))
})

test('large GPX keeps full track but bounds lazy detail and preview payloads', () => {
  const r = processGpx(
    xml(Array.from({ length: 12000 }, (_, i) => pt(46 + i * 0.00001, 14, i % 100)).join('')),
  )
  assert.equal(r.artifacts['route.full.json'].route.length, 12000)
  assert.ok(r.artifacts['detail.json'].route.length < 2000)
  assert.ok(r.artifacts['preview.json'].overviewRoute.length <= 80)
  assert.ok(r.artifacts['preview.json'].profile.length <= 64)
})

test('image becomes a resized WebP with output dimensions and stripped metadata', async () => {
  const png = await sharp({
    create: { width: 2000, height: 1000, channels: 3, background: '#45804a' },
  })
    .png()
    .withMetadata()
    .toBuffer()
  const r = await processAccountImage(png)
  const metadata = await sharp(r.bytes).metadata()
  assert.equal(metadata.format, 'webp')
  assert.equal(metadata.width, 1600)
  assert.equal(metadata.height, 800)
  assert.equal(r.details.width, metadata.width)
  assert.equal(metadata.exif, undefined)
  await assert.rejects(() => processAccountImage(Buffer.from('invalid image')))
})

test('public tour gets landscape and portrait WebP previews without an external map request', async () => {
  const data = processGpx(xml(pt(46, 14, 100) + pt(46.01, 14.01, 125))).artifacts['detail.json']
  const images = await gpxThumbnails(data)
  for (const [name, width, height] of [
    ['map.webp', 900, 540],
    ['map-portrait.webp', 700, 900],
  ]) {
    const metadata = await sharp(images[name]).metadata()
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.width, width)
    assert.equal(metadata.height, height)
  }
})
