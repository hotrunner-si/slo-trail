import { test } from 'node:test'
import assert from 'node:assert/strict'
import { brainShareDraft, redactBrainShare } from '../utils/brainShare.ts'
import { brainShareSchema } from '../server/utils/brain-share-policy.ts'

test('sharing requires explicit consent and refuses contacts and privileged fields', () => {
  const value = {
    title: 'Izkušnja na trasi',
    content: 'Uporabnik: Po dežju je bila pot spolzka.',
    consent: true,
  }
  assert.ok(brainShareSchema.safeParse(value).success)
  assert.equal(brainShareSchema.safeParse({ ...value, consent: false }).success, false)
  assert.equal(
    brainShareSchema.safeParse({ ...value, content: 'Piši mi na test@example.com glede trase.' })
      .success,
    false,
  )
  assert.equal(brainShareSchema.safeParse({ ...value, user_id: 'invented' }).success, false)
})
test('share previews preserve human/AI provenance, redact contacts and bound the reviewed snapshot', () => {
  const draft = brainShareDraft([
    { role: 'user', text: 'Moj kontakt je test@example.com in +386 40 123 456.' },
    { role: 'assistant', text: 'Pogovor o vzponih. '.repeat(5000) },
  ])
  assert.ok(draft.content.includes('Uporabnik:'))
  assert.ok(draft.content.includes('Možgan (odgovor AI):'))
  assert.ok(!draft.content.includes('test@example.com'))
  assert.ok(!draft.content.includes('+386 40 123 456'))
  assert.ok(draft.content.endsWith('[Preostanek pogovora ni vključen v ta posnetek.]'))
  assert.ok(draft.content.length <= 11000)
  assert.ok(new TextEncoder().encode(draft.content).length <= 32000)
  assert.equal(redactBrainShare('Datum 2026-11-04.'), 'Datum 2026-11-04.')
})
