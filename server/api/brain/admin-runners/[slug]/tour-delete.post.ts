import { z } from 'zod'
import { cleanupPublicMedia } from '../../../../utils/public-media'

export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { user, slug } = await runnerEditorAccess(event)
  brainLimit(event, 'admin-tour-delete:' + user.id, 10)
  const { id } = await brainBody(
    event,
    z.object({ id: z.string().min(1).max(150), confirm: z.literal(true) }).strict(),
  )
  const service = brainService(event)
  const tour = await service
    .from('runner_tours')
    .select('data')
    .eq('runner_slug', slug)
    .eq('id', id)
    .single()
  if (tour.error || !tour.data)
    throw createError({ statusCode: 404, statusMessage: 'Tura ne obstaja.' })
  const isUuid = /^[0-9a-f-]{36}$/.test(id)
  if (isUuid) {
    const publication = await service
      .from('brain_runner_media')
      .select('id')
      .eq('id', id)
      .eq('runner_slug', slug)
      .eq('kind', 'gpx')
      .maybeSingle()
    brainCheck(publication.error)
    if (publication.data) {
      // The existing trigger retracts the catalog tour and queues public file cleanup.
      const removed = await service
        .from('brain_runner_media')
        .delete()
        .eq('id', id)
        .eq('runner_slug', slug)
        .eq('kind', 'gpx')
        .select('id')
        .maybeSingle()
      brainCheck(removed.error)
      if (!removed.data)
        throw createError({
          statusCode: 409,
          statusMessage: 'Tura je bila vmes spremenjena. Osveži stran.',
        })
      await cleanupPublicMedia(event)
      return { ok: true }
    }
  }
  const removed = await service
    .from('runner_tours')
    .delete()
    .eq('runner_slug', slug)
    .eq('id', id)
    .eq('data', JSON.stringify(tour.data.data))
    .select('id')
    .maybeSingle()
  brainCheck(removed.error)
  if (!removed.data)
    throw createError({
      statusCode: 409,
      statusMessage: 'Tura je bila vmes spremenjena. Osveži stran.',
    })
  // Only app-owned public assets are removed. Imported static files may be shared.
  if (
    isUuid &&
    tour.data.data.downloadUrl === `/api/admin-runner-media/${slug}/${id}/original.gpx`
  ) {
    const queued = await service
      .from('brain_public_media_cleanup')
      .upsert({ id }, { onConflict: 'id' })
    if (!queued.error) await cleanupPublicMedia(event)
  }
  return { ok: true }
})
