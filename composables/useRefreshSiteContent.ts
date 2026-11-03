import type { SiteContent } from '~/types/content'
export async function refreshSiteContent() {
  const fresh = await $fetch<SiteContent>('/api/brain/catalog')
  const state = useState<SiteContent | null>('loaded-site-content', () => null)
  if (state.value) Object.assign(state.value, fresh)
  else state.value = fresh
}
