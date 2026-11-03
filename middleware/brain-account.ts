export default defineNuxtRouteMiddleware(async (to) => {
  const { signedIn } = await useBrainSession()
  if (!signedIn.value) return navigateTo({ path: '/mozgan/racun', query: { next: to.path } })
})
