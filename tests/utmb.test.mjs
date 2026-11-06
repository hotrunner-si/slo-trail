import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { sortUtmbRunners, utmbCategories } from '../utils/utmb.ts'
import { utmbRefreshSlot } from '../utils/utmbRefresh.ts'

test('refresh changes only at Tuesday/Saturday 04:00 Ljubljana in winter and summer', () => {
  const cases = [
    ['2026-11-10T02:59:59Z', '2026-11-07'],
    ['2026-11-10T03:00:00Z', '2026-11-10'],
    ['2026-11-07T02:59:59Z', '2026-11-03'],
    ['2026-11-07T03:00:00Z', '2026-11-07'],
    ['2026-07-07T01:59:59Z', '2026-07-04'],
    ['2026-07-07T02:00:00Z', '2026-07-07'],
    ['2026-03-29T02:00:00Z', '2026-03-28'],
    ['2026-10-25T03:00:00Z', '2026-10-24'],
    ['2026-11-06T23:00:00Z', '2026-11-03'],
  ]
  for (const [at, expected] of cases) assert.equal(utmbRefreshSlot(new Date(at)), expected, at)
})

test('empty indices equal zero and sort below positive scores without mutating the source', () => {
  const runners = [
    { name: 'C', indices: { '20k': null } },
    { name: 'B', indices: { '20k': 850 } },
    { name: 'A', indices: { '20k': 0 } },
    { name: 'D', indices: { '20k': 900 } },
  ]
  assert.deepEqual(
    sortUtmbRunners(runners, '20k').map((r) => r.name),
    ['D', 'B', 'A', 'C'],
  )
  assert.deepEqual(
    runners.map((r) => r.name),
    ['C', 'B', 'A', 'D'],
  )
})

test('verified snapshots contain complete distinct world top 25 and Slovenian top 100 lists', async () => {
  const snapshots = JSON.parse(
    await readFile(new URL('../data/utmb-rankings.json', import.meta.url)),
  )
  assert.equal(Object.keys(snapshots).length, 12)
  for (const [key, ranking] of Object.entries(snapshots)) {
    assert.equal(ranking.runners.length, ranking.scope === 'world' ? 25 : 100, key)
    assert.equal(new Set(ranking.runners.map((r) => r.id)).size, ranking.runners.length, key)
    assert.ok(Number.isFinite(Date.parse(ranking.fetchedAt)))
    assert.equal(ranking.source, 'https://utmb.world/utmb-index')
    if (ranking.scope === 'slovenia') {
      assert.equal(ranking.category, 'general')
      assert.ok(ranking.runners.every((r) => r.country === 'SI'))
    }
    for (const runner of ranking.runners) {
      assert.deepEqual(Object.keys(runner.indices), [...utmbCategories])
      assert.ok(
        Object.values(runner.indices).every((i) => i === null || (Number.isFinite(i) && i >= 0)),
      )
    }
    const values = sortUtmbRunners(ranking.runners, ranking.category).map(
      (r) => r.indices[ranking.category] ?? 0,
    )
    assert.deepEqual(
      values,
      ranking.runners.map((r) => r.indices[ranking.category] ?? 0),
    )
  }
})
