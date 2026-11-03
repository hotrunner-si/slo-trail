export default defineEventHandler(async (event) => {
  const { client } = await brainIdentity(event)
  const result = await client.rpc('get_site_content')
  brainCheck(result.error)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return result.data
})
