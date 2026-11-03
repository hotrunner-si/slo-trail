import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inspectGpx, validateExtraction, containsContact } from '../server/utils/brain-safety.ts'
const gpx =
  '<gpx version="1.1"><trk><trkseg><trkpt lat="46" lon="14"/><trkpt lat="46.01" lon="14.01"/></trkseg></trk></gpx>'
test('GPX is parsed as inert data and a bounded preview', () => {
  assert.equal(inspectGpx(Buffer.from(gpx)).pointCount, 2)
})
test('GPX rejects DTD, entities, malformed data, deep XML and invalid coordinates', () => {
  for (const value of [
    '<!DOCTYPE gpx [<!ENTITY x SYSTEM "file:///etc/passwd">]>' + gpx,
    '<gpx><trkpt lat="999" lon="14"/></gpx>',
    '<html>hello</html>',
    '<gpx><trk>',
    '<gpx>' + '<a>'.repeat(40) + '</a>'.repeat(40) + '</gpx>',
  ])
    assert.throws(() => inspectGpx(Buffer.from(value)))
  assert.throws(() => inspectGpx(Buffer.alloc(5242881)))
})
test('AI output cannot inject unknown subjects, sources or privileged fields', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  const value = {
    answer: 'Ni dovolj dokazov.',
    clarification: 'Katerega leta?',
    summary: null,
    statement: null,
    entityId: null,
    year: null,
    conditions: 'unknown',
    directExperience: false,
    citations: [],
  }
  assert.equal(validateExtraction(value, [], []).clarification, 'Katerega leta?')
  assert.throws(() => validateExtraction({ ...value, entityId: id }, [], []))
  assert.throws(() => validateExtraction({ ...value, citations: [id] }, [], []))
  assert.throws(() => validateExtraction({ ...value, admin: true }, [], []))
  assert.throws(() =>
    validateExtraction(
      {
        ...value,
        statement: 'Izkušnja iz prihodnosti.',
        entityId: id,
        year: 2200,
        directExperience: true,
      },
      [id],
      [],
    ),
  )
  assert.throws(() =>
    validateExtraction({ ...value, statement: 'Moja izkušnja', entityId: id }, [id], []),
  )
  assert.throws(() =>
    validateExtraction({ ...value, summary: 'kontakt: test@example.invalid' }, [], []),
  )
  assert.equal(containsContact('telefon +386 40 123 456'), true)
})
