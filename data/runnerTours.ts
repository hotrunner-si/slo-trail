import { runners } from '~/data/runners'
import { runnerGpxRoutes } from '~/data/runnerGpxRoutes'

export const runnerTours = Object.entries(runnerGpxRoutes)
  .flatMap(([runnerSlug, tours]) => {
    const runner = runners.find(item => item.slug === runnerSlug)
    return tours.map(tour => ({ ...tour, key: `${runnerSlug}-${tour.id}`, runnerSlug, runnerName: runner?.name || runnerSlug }))
  })
  .sort((a, b) => b.dateIso.localeCompare(a.dateIso))

export type RunnerTour = (typeof runnerTours)[number]
