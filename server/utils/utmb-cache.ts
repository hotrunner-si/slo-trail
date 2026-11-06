import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import { brainService } from './brain'
import { fetchUtmb, fetchUtmbRanking } from '~/utils/utmb'
import type { UtmbCategory, UtmbProfile, UtmbRanking, UtmbScope, UtmbSex } from '~/utils/utmb'
import { utmbRefreshSlot } from '~/utils/utmbRefresh'

// Share profile requests within a process; Supabase leases coordinate separate instances.
const profiles = new Map<string, Promise<UtmbProfile>>()
let profileSlot = ''
function profile(uri: string, slot: string, signal?: AbortSignal) {
  if (profileSlot !== slot) {
    profiles.clear()
    profileSlot = slot
  }
  if (!profiles.has(uri)) {
    const request = fetchUtmb<UtmbProfile>(`/runners/${encodeURIComponent(uri)}`, signal).catch(
      (error) => {
        profiles.delete(uri)
        throw error
      },
    )
    profiles.set(uri, request)
  }
  return profiles.get(uri)!
}

export async function serveUtmbRanking(
  event: H3Event,
  scope: UtmbScope,
  sex: UtmbSex,
  category: UtmbCategory,
  snapshot?: UtmbRanking,
) {
  const client = brainService(event)
  const key = `${scope}-${sex}-${category}`
  const slot = utmbRefreshSlot()
  const read = async () => {
    const { data, error } = await client
      .from('utmb_rankings_cache')
      .select('payload,slot')
      .eq('key', key)
      .maybeSingle()
    if (error) throw error
    return data as { payload: UtmbRanking | null; slot: string | null } | null
  }
  let stored = await read()
  const response = () => {
    const payload = stored?.payload ?? snapshot
    if (!payload) throw new Error('No saved UTMB ranking')
    return {
      ...payload,
      stale: (stored?.slot ?? utmbRefreshSlot(new Date(payload.fetchedAt))) < slot,
    }
  }
  if (stored?.payload && stored.slot && stored.slot >= slot) return response()
  const token = randomUUID()
  const { data: claimed, error: claimError } = await client.rpc('claim_utmb_refresh', {
    p_key: key,
    p_token: token,
  })
  if (claimError) throw claimError
  if (!claimed) {
    stored = await read()
    return response()
  }
  try {
    const ranking = await fetchUtmbRanking(scope, sex, category, (uri, signal) =>
      profile(uri, slot, signal),
    )
    const { data: saved, error } = await client.rpc('finish_utmb_refresh', {
      p_key: key,
      p_token: token,
      p_payload: ranking,
    })
    if (error || !saved) throw error ?? new Error('UTMB refresh lease expired')
    // The lease slot is calculated by Postgres, independently of the Netlify timezone.
    stored = await read()
  } catch (error) {
    // Preserve the last complete result; the two-minute lease also limits retry storms.
    console.warn('[UTMB] Refresh failed; serving saved ranking', {
      key,
      error: error instanceof Error ? error.message : 'upstream or storage error',
    })
  }
  return response()
}
