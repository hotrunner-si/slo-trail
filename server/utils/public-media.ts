import type { H3Event } from 'h3'
export const publicationVariants = [
  'image.webp',
  'original.gpx',
  'preview.json',
  'detail.json',
  'route.simple.json',
  'route.full.json',
  'profile.simple.json',
  'profile.full.json',
  'map.webp',
  'map-portrait.webp',
]
export async function cleanupPublicMedia(event: H3Event) {
  const service = brainService(event)
  const { data } = await service.from('brain_public_media_cleanup').select('id').limit(100)
  for (const row of data || []) {
    if (!/^[0-9a-f-]{36}$/.test(row.id)) continue
    const active = await service
      .from('brain_runner_media')
      .select('id')
      .eq('id', row.id)
      .maybeSingle()
    if (active.error || active.data) continue
    const result = await service.storage
      .from('runner-publications')
      .remove(publicationVariants.map((v) => `${row.id}/${v}`))
    if (!result.error) await service.from('brain_public_media_cleanup').delete().eq('id', row.id)
  }
}
