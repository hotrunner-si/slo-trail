import type { H3Event } from 'h3'

export async function runnerEditorAccess(event: H3Event) {
  if (event.context.runnerEditorOwner === true) {
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
        statusMessage: 'Za urejanje potrebuješ potrjeno povezavo s tekačem.',
      })
    return { user: user!, slug: String(link.data.runner_slug) }
  }
  const { user } = await brainAdmin(event)
  return { user, slug: adminRunnerParam(event) }
}
