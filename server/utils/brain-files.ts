import type { H3Event } from 'h3'
export async function brainCleanupFiles(event: H3Event) {
  const service = brainService(event)
  const { data } = await service.from('brain_file_cleanup').select('path').limit(100)
  for (const row of data || []) {
    if (!/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(gpx|webp)$/.test(row.path)) continue
    const { data: active } = await service.from('brain_files').select('id').eq('path', row.path)
    if (active?.length) continue
    const derived = row.path.endsWith('.gpx')
      ? [
          'preview.json',
          'detail.json',
          'route.simple.json',
          'route.full.json',
          'profile.simple.json',
          'profile.full.json',
        ].map((v) => row.path.replace(/\.gpx$/, '.' + v))
      : []
    const { error } = await service.storage.from('brain-private').remove([row.path, ...derived])
    if (!error) await service.from('brain_file_cleanup').delete().eq('path', row.path)
  }
}
