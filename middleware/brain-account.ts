import { publicPreviewEnabled } from '~/utils/siteAccess'

export default defineNuxtRouteMiddleware(async (to) => {
  if (publicPreviewEnabled) return
  const { signedIn } = await useBrainSession()
  if (!signedIn.value) return navigateTo({ path: '/profil', query: { next: to.path } })
})
