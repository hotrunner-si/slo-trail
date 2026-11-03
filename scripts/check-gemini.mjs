// One bounded connectivity test using a fixed, non-personal prompt.
// Does not access Supabase, create knowledge, or print keys/provider error payloads.
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import process from 'node:process'

let values = {}
try {
  values = parseEnv(readFileSync(new URL('../.env', import.meta.url), 'utf8'))
} catch {
  console.error('Datoteke nastavitev ni mogoče prebrati.')
  process.exit(1)
}
const key = (process.env.GEMINI_API_KEY || values.GEMINI_API_KEY || '').trim()
if (!key) {
  console.error('GEMINI_API_KEY ni nastavljen.')
  process.exit(1)
}
const model = 'gemini-3.5-flash-lite'
try {
  const listing = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
    headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(15000),
  })
  if (!listing.ok) {
    console.error(`Preverjanje dostopa je vrnilo HTTP ${listing.status}. Ključ ni bil izpisan.`)
    process.exit(1)
  }
  const models = await listing.json()
  if (!models.models?.some(item => item.name === `models/${model}` && item.supportedGenerationMethods?.includes('generateContent'))) {
    console.error(`Ključ je sprejet, model ${model} pa ni med razpoložljivimi modeli. Generiranje ni bilo izvedeno.`)
    process.exit(1)
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'To je tehnični preizkus brez uporabniških podatkov. Vrni samo: Povezava deluje.' }] }],
      generationConfig: { maxOutputTokens: 256, temperature: 0 },
    }),
  })
  if (!response.ok) {
    console.error(`Preizkus generiranja je vrnil HTTP ${response.status}. Noben podatek ni bil shranjen v bazo.`)
    process.exit(1)
  }
  const result = await response.json()
  const text = (result.candidates?.[0]?.content?.parts || []).filter(part => !part.thought).map(part => part.text || '').join('').trim()
  if (!text.includes('Povezava deluje')) {
    console.error('Gemini je odgovoril, vendar rezultat ni ustrezal preizkusu. Odgovor ni bil shranjen.')
    process.exit(1)
  }
  console.log(`PASS: ključ je sprejet in ${model} je uspešno odgovoril na en neoseben testni poziv.`)
} catch {
  console.error('Povezava ni uspela ali se je iztekel čas zahteve. Ključ in vsebina napake nista bila izpisana.')
  process.exit(1)
}
