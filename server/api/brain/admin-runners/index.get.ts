export default defineEventHandler(async (event) => {
  await brainAdmin(event)
  const result = await brainService(event)
    .from('runners')
    .select('slug,data,updated_at')
    .order('position')
    .order('slug')
  brainCheck(result.error)
  return { runners: result.data || [] }
})
