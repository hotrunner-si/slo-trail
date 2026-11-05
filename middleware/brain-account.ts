export default defineNuxtRouteMiddleware(async (to) => {
  const { signedIn } = await useBrainSession()
  if (!signedIn.value) return navigateTo({ path: '/profil', query: { next: to.path } })
})
