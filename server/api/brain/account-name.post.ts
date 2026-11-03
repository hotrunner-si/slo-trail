import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  brainLimit(event, 'account-name:' + user!.id, 8)
  const { name } = await brainBody(event, z.object({ name: brainAccountName }))
  const { error } = await client.auth.updateUser({ data: { display_name: name } })
  brainCheck(error)
  return { ok: true }
})
