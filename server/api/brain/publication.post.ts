import { z } from 'zod'
import { processGpx } from '../../utils/gpx-processing'
import { processAccountImage } from '../../utils/image-processing'
import { gpxThumbnails } from '../../utils/gpx-thumbnails'
import { cleanupPublicMedia } from '../../utils/public-media'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  brainLimit(event, 'publication:' + user!.id, 8)
  const body = await brainBody(
    event,
    z.object({
      file: z.uuid(),
      expected: z.string().max(250),
      consent: z.literal(true),
      title: z.string().trim().min(2).max(150).optional(),
      location: z.string().trim().max(150).default(''),
      description: z.string().trim().max(1500).default(''),
      date: z.union([z.literal(''), z.iso.date()]).default(''),
    }),
  )
  const f = await client
    .from('brain_files')
    .select('*')
    .eq('id', body.file)
    .eq('user_id', user!.id)
    .eq('path', body.expected)
    .single()
  const owner = await client
    .from('brain_runner_links')
    .select('runner_slug')
    .eq('user_id', user!.id)
    .maybeSingle()
  if (f.error || !f.data || !owner.data)
    throw createError({
      statusCode: 403,
      statusMessage: 'Za objavo potrebuješ svojo datoteko in potrjeno povezavo s tekačem.',
    })
  if (f.data.kind === 'gpx') {
    const review = await client
      .from('brain_route_reviews')
      .select('id')
      .eq('file_id', f.data.id)
      .eq('file_path', f.data.path)
      .eq('status', 'approved')
      .maybeSingle()
    if (review.error || !review.data)
      throw createError({
        statusCode: 400,
        statusMessage: 'GPX najprej pošlji v skrbniški pregled.',
      })
    if (!body.title) throw createError({ statusCode: 400, statusMessage: 'Vpiši naslov ture.' })
  }
  const service = brainService(event),
    id = crypto.randomUUID(),
    base = `/api/runner-media/${id}`
  const original = await service.storage.from('brain-private').download(f.data.path)
  if (original.error || !original.data)
    throw createError({
      statusCode: 503,
      statusMessage: 'Datoteke ni mogoče pripraviti za objavo.',
    })
  const bytes = Buffer.from(await original.data.arrayBuffer())
  const assets: Record<string, { bytes: Buffer; type: string }> = {}
  let payload: Record<string, unknown> = {}
  if (f.data.kind === 'image') {
    const image = await processAccountImage(bytes)
    assets['image.webp'] = { bytes: image.bytes, type: 'image/webp' }
  } else {
    const processed = processGpx(bytes)
    assets['original.gpx'] = { bytes, type: 'application/gpx+xml' }
    for (const [name, data] of Object.entries(processed.artifacts))
      assets[name] = { bytes: Buffer.from(JSON.stringify(data)), type: 'application/json' }
    for (const [name, data] of Object.entries(
      await gpxThumbnails(processed.artifacts['detail.json']),
    ))
      assets[name] = { bytes: data, type: 'image/webp' }
    payload = {
      title: body.title,
      location: body.location,
      description: body.description,
      dateIso: body.date || undefined,
      distanceKm: processed.details.distanceKm,
      elevationGain: processed.details.elevationGain,
      preview: { ...processed.artifacts['preview.json'], source: 'original.gpx' },
      detailUrl: `${base}/detail.json`,
      downloadUrl: `${base}/original.gpx`,
      mapImage: `${base}/map.webp`,
      portraitMapImage: `${base}/map-portrait.webp`,
    }
  }
  try {
    for (const [name, asset] of Object.entries(assets)) {
      const result = await service.storage
        .from('runner-publications')
        .upload(`${id}/${name}`, asset.bytes, { contentType: asset.type, upsert: false })
      if (result.error) throw new Error('Storage upload failed')
    }
    const result = await service.rpc('brain_commit_publication', {
      p_id: id,
      p_user: user!.id,
      p_file: body.file,
      p_expected: body.expected,
      p_data: payload,
    })
    if (result.error) throw new Error('Publication commit failed')
  } catch {
    await service.from('brain_public_media_cleanup').insert({ id })
    await cleanupPublicMedia(event)
    throw createError({
      statusCode: 409,
      statusMessage:
        'Objava ni uspela. Osveži račun in poskusi znova; zasebna datoteka je ohranjena.',
    })
  }
  await cleanupPublicMedia(event)
  return { ok: true }
})
