export default defineEventHandler(async (event) => {
  const { slug } = await runnerEditorAccess(event)
  const runner = await adminRunnerRecord(event, slug)
  const service = brainService(event)
  const tours = await service
    .from('runner_tours')
    .select('id,data')
    .eq('runner_slug', slug)
    .order('position')
  brainCheck(tours.error)
  const link = await service
    .from('brain_runner_links')
    .select('user_id')
    .eq('runner_slug', slug)
    .maybeSingle()
  brainCheck(link.error)
  let email = ''
  if (link.data) {
    const account = await service.auth.admin.getUserById(link.data.user_id)
    if (account.error)
      throw createError({ statusCode: 503, statusMessage: 'Povezanega računa ni mogoče prebrati.' })
    email = account.data.user?.email || ''
  }
  return { ...runner, tours: tours.data || [], linkedEmail: email }
})
