import { Buffer } from 'node:buffer'
import { publicationVariants } from '../../../utils/public-media'
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') || '',
    variant = getRouterParam(event, 'variant') || ''
  if (!/^[0-9a-f-]{36}$/.test(id) || !publicationVariants.includes(variant))
    throw createError({ statusCode: 404, statusMessage: 'Datoteka ni objavljena.' })
  const service = brainService(event)
  const record = await service.from('brain_runner_media').select('kind').eq('id', id).maybeSingle()
  if (
    record.error ||
    !record.data ||
    (record.data.kind === 'image' ? variant !== 'image.webp' : variant === 'image.webp')
  )
    throw createError({ statusCode: 404, statusMessage: 'Datoteka ni objavljena.' })
  const result = await service.storage.from('runner-publications').download(`${id}/${variant}`)
  if (result.error || !result.data)
    throw createError({ statusCode: 404, statusMessage: 'Datoteka ni na voljo.' })
  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'X-Content-Type-Options', 'nosniff')
  setResponseHeader(
    event,
    'Content-Type',
    variant.endsWith('.json')
      ? 'application/json'
      : variant.endsWith('.webp')
        ? 'image/webp'
        : 'application/gpx+xml',
  )
  setResponseHeader(
    event,
    'Content-Disposition',
    variant === 'original.gpx' ? 'attachment; filename="trasa.gpx"' : 'inline',
  )
  return Buffer.from(await result.data.arrayBuffer())
})
