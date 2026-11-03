import type { SiteContent } from '~/types/content'
import { listRunnerTours, selectWeeklyRunnerTour } from '~/utils/runnerTours'

/** One shared SSR payload per Nuxt app; no local catalog fallback. */
export async function useSiteContent() {
  const state = useState<SiteContent | null>('loaded-site-content', () => null)
  if (!state.value) {
    const { data, error } = await useAsyncData<SiteContent>('site-content', () =>
      $fetch<SiteContent>('/api/content' as string),
    )
    if (error.value || !data.value)
      throw createError({
        statusCode: 503,
        statusMessage: 'Vsebine trenutno ni mogoče naložiti. Poskusi znova.',
      })
    state.value = data.value
  }
  const content = state.value
  const runnerTours = listRunnerTours(content.runners, content.runnerGpxRoutes)
  return {
    ...content,
    runnerTours,
    getRace: (slug: string) => content.races.find((item) => item.slug === slug),
    getRunner: (slug: string) => content.runners.find((item) => item.slug === slug),
    getArticle: (slug: string) => content.articles.find((item) => item.slug === slug),
    getTrailRoute: (slug: string) => content.trailRoutes.find((item) => item.slug === slug),
    getWeeklyRunnerTour: (dateIso: string) => selectWeeklyRunnerTour(runnerTours, dateIso),
  }
}
