export default defineEventHandler(async (event) => {
  brainMutation(event)
  brainClearRecovery(event)
  const { error } = await brainClient(event).auth.signOut()
  brainCheck(error)
  return { ok: true }
})
