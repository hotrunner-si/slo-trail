import { publicPreviewEnabled } from '../../../utils/siteAccess'

export default defineEventHandler(async (event) => {
  const identity = await brainIdentity(event, !publicPreviewEnabled)
  const client = identity.user ? identity.client : brainService(event)
  const [{ data: claims, error }, { data: sources, error: sourceError }] = await Promise.all([
    client
      .from('brain_claims')
      .select('id,year,conditions,origin')
      .eq('status', 'active')
      .in('origin', identity.user ? ['official', 'editorial', 'community', 'unverified'] : ['official', 'editorial'])
      .limit(500),
    client.from('brain_sources').select('id,origin,verified_at')
      .in('origin', identity.user ? ['official', 'editorial', 'community', 'unverified'] : ['official', 'editorial']).limit(1000),
  ])
  brainCheck(error)
  brainCheck(sourceError)
  return {
    sources: sources?.length || 0,
    verifiedSources: sources?.filter((s) => s.verified_at).length || 0,
    claims: claims?.length || 0,
    note: 'Število zapisov in sledljivost ne dokazujeta točnosti. Prikaz je omejen na prvih 1000 virov in 500 ugotovitev.',
  }
})
