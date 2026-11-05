import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  trailAxisTicks,
  effortBandPolygon,
  trailCategories,
  trailCategory,
  trailHistogram,
  trailMonths,
  trailDescent,
  trailHighestPoint,
} from '../utils/trailAnalytics.ts'
const point = (km, elevation, extra = {}) => ({
  key: `${km}-${elevation}`,
  km,
  elevation,
  raceName: 'Test',
  label: 'Test',
  ...extra,
})

test('terrain estimate accounts for loop and point-to-point elevation change', () => {
  const loop = point(10, 500, { gpx: { profile: [200, 700, 200] } })
  assert.equal((loop.elevation + trailDescent(loop)) / loop.km, 100)
  const open = point(15, 1500, { gpx: { profile: [200, 1700, 700] } })
  assert.equal(trailDescent(open), 1000)
  assert.equal((open.elevation + trailDescent(open)) / open.km, 2500 / 15)
  assert.equal(trailHighestPoint(open), 1700)
  assert.equal(trailDescent(point(10, 500)), null)
  assert.equal(trailHighestPoint(point(10, 500)), null)
  assert.equal(trailDescent(point(10, 500, { gpx: { elevationLoss: 450 } })), null)
  assert.equal(trailDescent(point(40.6, 3100, { gpx: { elevationLoss: 5735, profile: [532, 507] } })), 3125)
  assert.equal(trailDescent(point(10, 500, { gpx: { elevationLoss: 900, profile: [200, 700, 200] } })), 500)
  assert.equal(trailHighestPoint(point(10, 500, { gpx: { highestPoint: 1500, profile: [200, 1400] } })), 1500)
})

test('axis milestones keep their real values through zoom and leave the viewport naturally', () => {
  for (const maximum of [200, 153.8, 100, 49.9, 20, 12.5]) {
    const ticks = trailAxisTicks(maximum, [20, 50, 100, 160])
    for (const value of [20, 50, 100, 160]) assert.equal(ticks.includes(value), value <= maximum)
    assert.ok(ticks.every((value) => value >= 0 && value <= maximum))
    assert.equal(new Set(ticks).size, ticks.length)
  }
  const vertical = trailAxisTicks(8000, [2000, 5000, 10000, 16000], 0.12)
  assert.ok(vertical.includes(2000) && vertical.includes(5000) && vertical.includes(4000))
  assert.deepEqual(trailAxisTicks(1000, [2000, 5000], 0.12), [0, 200, 400, 600, 800, 1000])
})
const area = (poly) =>
  Math.abs(
    poly.reduce((sum, a, i) => {
      const b = poly[(i + 1) % poly.length]
      return sum + a[0] * b[1] - b[0] * a[1]
    }, 0) / 2,
  )

test('effort bands partition the plot at every zoom without gaps or overlap', () => {
  for (const [x, y] of [
    [200, 8000],
    [50, 2000],
    [12.5, 500],
    [350, 16000],
  ]) {
    const polygons = trailCategories.map((c) => effortBandPolygon(x, y, c.min, c.max))
    assert.ok(Math.abs(polygons.reduce((sum, p) => sum + area(p), 0) - x * y) < 0.000001)
    polygons.forEach((polygon, i) =>
      polygon.forEach(([km, e]) => {
        assert.ok(km >= -1e-9 && km <= x + 1e-9 && e >= -1e-9 && e <= y + 1e-9)
        const effort = km + e / 100,
          c = trailCategories[i]
        assert.ok(effort >= c.min - 1e-9 && effort <= c.max + 1e-9)
      }),
    )
  }
})
test('yellow band has the requested 20/2000 and 50/5000 intercepts', () => {
  const polygon = effortBandPolygon(200, 8000, 20, 50)
  for (const endpoint of [
    [20, 0],
    [0, 2000],
    [50, 0],
    [0, 5000],
  ])
    assert.ok(polygon.some((p) => p.every((v, i) => Math.abs(v - endpoint[i]) < 1e-8)))
  assert.equal(trailCategory(point(25, 1000)).id, '20K')
  assert.equal(trailCategory(point(40, 1000)).id, '50K')
})
test('histograms count each route once, including exact boundaries and overflow', () => {
  const points = [point(5, 0), point(10, 1000), point(20, 2000), point(50, 5000), point(300, 0)]
  const bins = trailHistogram(points, [0, 10, 20, 50, 100, 160], (p) => p.km)
  assert.equal(
    bins.reduce((sum, b) => sum + b.count, 0),
    points.length,
  )
  assert.deepEqual(
    bins.map((b) => b.count),
    [1, 1, 1, 1, 0, 1],
  )
  bins.forEach((b) =>
    assert.equal(
      b.categories.reduce((a, b) => a + b, 0),
      b.count,
    ),
  )
})
test('season keeps years separate and excludes unconfirmed or missing dates', () => {
  const bins = trailMonths([
    point(10, 100, { date: '2026-05-01', dateConfirmed: true }),
    point(20, 200, { date: '2027-05-01', dateConfirmed: true }),
    point(30, 300, { date: '2026-05-02', dateConfirmed: false }),
    point(10, 100, { date: '', dateConfirmed: true }),
  ])
  assert.deepEqual(
    bins.map((b) => [b.label, b.count]),
    [
      ['2026-05', 1],
      ['2027-05', 1],
    ],
  )
  assert.deepEqual(trailMonths([]), [])
})
