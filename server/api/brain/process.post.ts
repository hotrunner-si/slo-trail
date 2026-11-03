export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { user } = await brainIdentity(event)
  brainLimit(event, 'process:' + user!.id, 2)
  return brainProcessPending(event, user!.id)
})
