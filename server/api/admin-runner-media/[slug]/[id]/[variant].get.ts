import { publicationVariants } from '../../../../utils/public-media'
export default defineEventHandler(async (event) => {
  const slug = adminRunnerParam(event)
  const id = getRouterParam(event, 'id') || ''
  const variant = getRouterParam(event, 'variant') || ''
  if (!/^[0-9a-f-]{36}$/.test(id) || !publicationVariants.includes(variant))
    throw createError({ statusCode: 404, statusMessage: 'Datoteka ni objavljena.' })
  const service = brainService(event)
  const base = `/api/admin-runner-media/${slug}/${id}`
  let published = false
  if (variant === 'image.webp') {
    const runner = await service.from('runners').select('data').eq('slug', slug).maybeSingle()
    published = !runner.error && runner.data?.data?.image === `${base}/image.webp`
  } else {
    const tour = await service
      .from('runner_tours')
      .select('data')
      .eq('runner_slug', slug)
      .eq('id', id)
      .maybeSingle()
    published = !tour.error && tour.data?.data?.downloadUrl === `${base}/original.gpx`
  }
  if (!published) throw createError({ statusCode: 404, statusMessage: 'Datoteka ni objavljena.' })
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
