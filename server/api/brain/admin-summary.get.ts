export default defineEventHandler(async (event) => {
  const { client } = await brainAdmin(event)
  const results = await Promise.all([
    client
      .from('brain_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client
      .from('brain_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'approved')
      .is('public_runner_slug', null),
    client
      .from('brain_link_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client
      .from('brain_route_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    client.from('brain_sources').select('id', { count: 'exact', head: true }),
  ])
  results.forEach((result) => brainCheck(result.error))
  return {
    profiles: results[0]!.count || 0,
    publish: results[1]!.count || 0,
    links: results[2]!.count || 0,
    routes: results[3]!.count || 0,
    sources: results[4]!.count || 0,
  }
})
