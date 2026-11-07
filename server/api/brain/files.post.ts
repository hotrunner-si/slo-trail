import { Buffer } from 'node:buffer'
import { processGpx } from '../../utils/gpx-processing'
import { processAccountImage } from '../../utils/image-processing'

export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  const link = await client
    .from('brain_runner_links')
    .select('runner_slug')
    .eq('user_id', user!.id)
    .maybeSingle()
  brainCheck(link.error)
  if (!link.data)
    throw createError({
      statusCode: 403,
      statusMessage: 'Datoteke lahko nalagaš po povezavi računa s tekačem.',
    })
  brainLimit(event, 'upload:' + user!.id, 8)
  const length = Number(getHeader(event, 'content-length') || 0)
  if (!length || length > 5 * 1024 * 1024 + 16000)
    throw createError({ statusCode: 413, statusMessage: 'Največja velikost datoteke je 5 MB.' })
  const parts = await readMultipartFormData(event)
  const file = parts?.find((p) => p.name === 'file')
  const slot = Number(parts?.find((p) => p.name === 'slot')?.data.toString())
  const expected = parts?.find((p) => p.name === 'expected')?.data.toString() || null
  if (
    !file?.filename ||
    !Number.isInteger(slot) ||
    slot < 1 ||
    slot > 4 ||
    file.data.length > 5242880
  )
    throw createError({ statusCode: 400, statusMessage: 'Izberi veljavno datoteko in mesto.' })
  let bytes: Buffer = file.data,
    details: Record<string, unknown> = {},
    ext: string,
    mime: string
  let artifacts: Record<string, unknown> = {}
  try {
    if (slot < 4) {
      if (!/\.gpx$/i.test(file.filename)) throw new Error('Dovoljen je samo GPX.')
      const processed = processGpx(bytes)
      details = processed.details
      artifacts = processed.artifacts
      ext = 'gpx'
      mime = 'application/gpx+xml'
    } else {
      if (!/\.(png|jpe?g|webp)$/i.test(file.filename))
        throw new Error('Dovoljene so slike JPEG, PNG in WebP.')
      const processed = await processAccountImage(bytes)
      bytes = processed.bytes
      ext = 'webp'
      mime = 'image/webp'
      details = processed.details
    }
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage:
        error instanceof Error && error.message.startsWith('GPX')
          ? error.message
          : 'Datoteka ni veljaven GPX ali dovoljena slika.',
    })
  }
  const service = brainService(event)
  const path = `${user!.id}/${crypto.randomUUID()}.${ext}`
  const artifactPaths: Record<string, string> = {}
  const uploaded: string[] = []
  for (const [variant, value] of Object.entries(artifacts)) {
    const artifactPath = path.replace(/\.gpx$/, '.' + variant)
    const { error } = await service.storage
      .from('brain-private')
      .upload(artifactPath, JSON.stringify(value), {
        contentType: 'application/json',
        upsert: false,
      })
    if (error) {
      if (uploaded.length) await service.storage.from('brain-private').remove(uploaded)
      throw createError({
        statusCode: 503,
        statusMessage:
          'Obdelanih podatkov GPX ni bilo mogoče shraniti. Obstoječa datoteka je ohranjena.',
      })
    }
    uploaded.push(artifactPath)
    artifactPaths[variant] = artifactPath
  }
  if (uploaded.length) details = { ...details, artifacts: artifactPaths }
  const { error: uploadError } = await service.storage
    .from('brain-private')
    .upload(path, bytes, { contentType: mime, upsert: false })
  if (uploadError) {
    if (uploaded.length) await service.storage.from('brain-private').remove(uploaded)
    throw createError({
      statusCode: 503,
      statusMessage: 'Nalaganje ni uspelo. Obstoječa datoteka je ohranjena.',
    })
  }
  const safeName =
    file.filename
      .replace(/[^\p{L}\p{N} ._-]/gu, '')
      .replace(/\.[^.]+$/, '')
      .slice(0, 170) || 'datoteka'
  const name = `${safeName}.${ext}`
  const { error } = await service.rpc('brain_commit_file', {
    p_user: user!.id,
    p_slot: slot,
    p_path: path,
    p_expected: expected,
    p_name: name,
    p_bytes: bytes.length,
    p_details: details,
  })
  if (error) {
    await service.storage.from('brain-private').remove([path, ...uploaded])
    throw createError({
      statusCode: 409,
      statusMessage:
        'Zamenjava ni uspela. Osveži račun in poskusi znova; stara datoteka je ohranjena.',
    })
  }
  // Durable retry queue. Only paths allocated to this private bucket can be removed.
  await brainCleanupFiles(event)
  return { ok: true }
})
