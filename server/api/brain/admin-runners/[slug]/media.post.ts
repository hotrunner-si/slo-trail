import { processGpx } from '../../../../utils/gpx-processing'
import { processAccountImage } from '../../../../utils/image-processing'
import { gpxThumbnails } from '../../../../utils/gpx-thumbnails'

export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { user, slug } = await runnerEditorAccess(event)
  brainLimit(event, 'admin-runner-upload:' + user.id, 15)
  const runner = await adminRunnerRecord(event, slug)
  const length = Number(getHeader(event, 'content-length') || 0)
  if (!length || length > 5 * 1024 * 1024 + 16000)
    throw createError({ statusCode: 413, statusMessage: 'Največja velikost datoteke je 5 MB.' })
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file')
  const title =
    parts
      ?.find((p) => p.name === 'title')
      ?.data.toString()
      .trim() || ''
  if (!file?.filename || !file.data.length || file.data.length > 5242880 || title.length > 150)
    throw createError({ statusCode: 400, statusMessage: 'Izberi veljavno datoteko.' })
  const id = crypto.randomUUID()
  const base = `/api/admin-runner-media/${slug}/${id}`
  const assets: Record<string, { bytes: Buffer; type: string }> = {}
  let tour: Record<string, unknown> | null = null
  try {
    if (/\.gpx$/i.test(file.filename)) {
      if (title.length < 2) throw new Error('Missing title')
      const processed = processGpx(file.data)
      assets['original.gpx'] = { bytes: file.data, type: 'application/gpx+xml' }
      for (const [name, data] of Object.entries(processed.artifacts))
        assets[name] = { bytes: Buffer.from(JSON.stringify(data)), type: 'application/json' }
      for (const [name, bytes] of Object.entries(
        await gpxThumbnails(processed.artifacts['detail.json']),
      ))
        assets[name] = { bytes, type: 'image/webp' }
      tour = {
        id,
        title,
        location: '',
        description: '',
        distanceKm: processed.details.distanceKm,
        elevationGain: processed.details.elevationGain,
        preview: { ...processed.artifacts['preview.json'], source: 'original.gpx' },
        detailUrl: `${base}/detail.json`,
        downloadUrl: `${base}/original.gpx`,
        mapImage: `${base}/map.webp`,
        portraitMapImage: `${base}/map-portrait.webp`,
      }
    } else if (/\.(png|jpe?g|webp)$/i.test(file.filename)) {
      const image = await processAccountImage(file.data)
      assets['image.webp'] = { bytes: image.bytes, type: 'image/webp' }
    } else throw new Error('Invalid file')
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'Izberi veljaven GPX z naslovom ture ali sliko JPEG, PNG oziroma WebP.',
    })
  }
  const service = brainService(event)
  const paths = Object.keys(assets).map((name) => `${id}/${name}`)
  try {
    for (const [name, asset] of Object.entries(assets)) {
      const uploaded = await service.storage
        .from('runner-publications')
        .upload(`${id}/${name}`, asset.bytes, { contentType: asset.type, upsert: false })
      if (uploaded.error) throw new Error('Upload failed')
    }
    if (tour) {
      const saved = await service
        .from('runner_tours')
        .insert({ runner_slug: slug, id, position: 10000, data: tour })
      if (saved.error) throw new Error('Tour save failed')
    } else {
      const saved = await service
        .from('runners')
        .update({
          data: { ...runner.data, image: `${base}/image.webp` },
          updated_at: new Date().toISOString(),
        })
        .eq('slug', slug)
        .eq('updated_at', runner.updated_at)
        .select('slug')
        .maybeSingle()
      if (saved.error || !saved.data) throw new Error('Image save failed')
    }
  } catch {
    await service.storage.from('runner-publications').remove(paths)
    throw createError({
      statusCode: 409,
      statusMessage: 'Objava datoteke ni uspela. Osveži profil in poskusi znova.',
    })
  }
  // Only remove images allocated by this editor; never remove imported or member-owned assets.
  const oldImage = String(runner.data.image || '')
  const prefix = `/api/admin-runner-media/${slug}/`
  if (!tour && oldImage.startsWith(prefix)) {
    const oldId = oldImage.slice(prefix.length).split('/')[0]
    if (/^[0-9a-f-]{36}$/.test(oldId || ''))
      await service.storage.from('runner-publications').remove([`${oldId}/image.webp`])
  }
  return { ok: true }
})
