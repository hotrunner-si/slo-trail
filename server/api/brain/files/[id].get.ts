import { Buffer } from 'node:buffer'
export default defineEventHandler(async (event) => {
  const { client } = await brainIdentity(event)
  const id = getRouterParam(event, 'id')
  const { data, error } = await client
    .from('brain_files')
    .select('path,name,details')
    .eq('id', id)
    .maybeSingle()
  if (error || !data) throw createError({ statusCode: 404, statusMessage: 'Datoteka ni dostopna.' })
  const variant = getQuery(event).variant
  const variants = [
    'preview.json',
    'detail.json',
    'route.simple.json',
    'route.full.json',
    'profile.simple.json',
    'profile.full.json',
  ]
  let path = data.path
  if (variant !== undefined) {
    if (typeof variant !== 'string' || !variants.includes(variant))
      throw createError({ statusCode: 400, statusMessage: 'Neveljavna oblika GPX.' })
    path = (data.details as { artifacts?: Record<string, string> })?.artifacts?.[variant] || ''
    if (!path || path !== data.path.replace(/\.gpx$/, '.' + variant))
      throw createError({ statusCode: 404, statusMessage: 'GPX še ni obdelan. Ponovno ga naloži.' })
  }
  const { data: file, error: downloadError } = await brainService(event)
    .storage.from('brain-private')
    .download(path)
  if (downloadError || !file)
    throw createError({ statusCode: 503, statusMessage: 'Prenos ni uspel.' })
  setResponseHeader(
    event,
    'Content-Disposition',
    `${variant || path.endsWith('.webp') ? 'inline' : 'attachment'}; filename="trail.${variant ? 'json' : path.endsWith('.gpx') ? 'gpx' : 'webp'}"`,
  )
  setResponseHeader(
    event,
    'Content-Type',
    variant ? 'application/json' : path.endsWith('.gpx') ? 'application/gpx+xml' : 'image/webp',
  )
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  return Buffer.from(await file.arrayBuffer())
})
