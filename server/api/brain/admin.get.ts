import type { BrainAdminData } from '~/types/brain'
export default defineEventHandler(async (event): Promise<BrainAdminData> => {
  const { client } = await brainAdmin(event)
  const [profiles, links, routes, files, entities, claims] = await Promise.all([
    client.from('brain_profiles').select('*').order('created_at', { ascending: false }).limit(100),
    client.from('brain_link_requests').select('*').eq('status', 'pending').limit(100),
    client.from('brain_route_reviews').select('*').eq('status', 'pending').limit(100),
    client.from('brain_files').select('id,details').eq('kind', 'gpx').limit(300),
    client.from('brain_entities').select('id,title,kind').order('title').limit(1000),
    client
      .from('brain_claims')
      .select('id,entity_id,statement,year,conditions,origin,status')
      .order('created_at', { ascending: false })
      .limit(100),
  ])
  for (const r of [profiles, links, routes, files, entities, claims]) brainCheck(r.error)
  return {
    profiles: profiles.data,
    links: links.data,
    routes: routes.data,
    files: files.data,
    entities: entities.data,
    claims: claims.data,
  } as BrainAdminData
})
