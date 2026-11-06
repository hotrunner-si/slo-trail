import { readFile } from 'node:fs/promises'
import { utmbRefreshSlot } from '../utils/utmbRefresh.ts'
const url = process.env.NUXT_PUBLIC_SUPABASE_URL
const key = process.env.NUXT_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY
if (!url || !key) throw new Error('Supabase server configuration is missing')
const snapshots = JSON.parse(await readFile(new URL('../data/utmb-rankings.json', import.meta.url)))
const rows = Object.entries(snapshots).map(([key, payload]) => ({
  key,
  payload,
  fetched_at: payload.fetchedAt,
  slot: utmbRefreshSlot(new Date(payload.fetchedAt)),
}))
const response = await fetch(`${url}/rest/v1/utmb_rankings_cache?on_conflict=key`, {
  method: 'POST',
  headers: {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'resolution=ignore-duplicates,return=minimal',
  },
  body: JSON.stringify(rows),
  signal: AbortSignal.timeout(15_000),
})
if (!response.ok) throw new Error(`Supabase seed HTTP ${response.status}`)
console.log(`Seeded ${rows.length} saved rankings; existing data preserved.`)
