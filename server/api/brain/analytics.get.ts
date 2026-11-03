export default defineEventHandler(async (event) => {
  const { client } = await brainIdentity(event)
  const [{ data: claims, error }, { data: sources, error: sourceError }] = await Promise.all([
    client
      .from('brain_claims')
      .select('id,year,conditions,origin')
      .eq('status', 'active')
      .limit(500),
    client.from('brain_sources').select('id,origin,verified_at').limit(1000),
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
