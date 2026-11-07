export default defineEventHandler(async (event) => {
  brainMutation(event)
  await brainAdmin(event)
  throw createError({
    statusCode: 410,
    statusMessage: 'Za ustvarjanje tekača uporabi skrbniški obrazec.',
  })
})
