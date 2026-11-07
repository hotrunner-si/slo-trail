import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { user } = await brainAdmin(event)
  brainLimit(event, 'admin-runner-link:' + user.id, 10)
  const slug = adminRunnerParam(event)
  await adminRunnerRecord(event, slug)
  const { email } = await brainBody(event, z.object({ email: z.email().max(254) }).strict())
  const service = brainService(event)
  let userId = ''
  for (let page = 1; ; page++) {
    const listed = await service.auth.admin.listUsers({ page, perPage: 1000 })
    if (listed.error)
      throw createError({ statusCode: 503, statusMessage: 'Računov ni mogoče prebrati.' })
    const found = listed.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (found?.email_confirmed_at) {
      userId = found.id
      break
    }
    if (listed.data.users.length < 1000) break
  }
  if (!userId)
    throw createError({
      statusCode: 400,
      statusMessage: 'Potrjen račun s tem naslovom ne obstaja. Uporabnik naj se najprej prijavi.',
    })
  // Insert only: changing ownership requires an explicit unlink, never a silent reassignment.
  const existing = await service
    .from('brain_runner_links')
    .select('user_id,runner_slug')
    .eq('runner_slug', slug)
    .maybeSingle()
  brainCheck(existing.error)
  if (existing.data?.user_id === userId) return { ok: true }
  const result = await service
    .from('brain_runner_links')
    .insert({ user_id: userId, runner_slug: slug })
  if (result.error?.code === '23505')
    throw createError({
      statusCode: 409,
      statusMessage: 'Račun ali tekač je že povezan. Najprej odstrani obstoječo povezavo.',
    })
  brainCheck(result.error)
  return { ok: true }
})
