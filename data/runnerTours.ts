import { runners } from '~/data/runners'
import { runnerGpxRoutes } from '~/data/runnerGpxRoutes'
import { parseIsoDate } from '~/utils/formatDate'

export const runnerTours = Object.entries(runnerGpxRoutes)
  .flatMap(([runnerSlug, tours]) => {
    const runner = runners.find((item) => item.slug === runnerSlug)
    return tours.map((tour) => ({
      ...tour,
      key: `${runnerSlug}-${tour.id}`,
      runnerSlug,
      runnerName: runner?.name || runnerSlug,
    }))
  })
  .sort((a, b) => (b.dateIso || '').localeCompare(a.dateIso || ''))

export type RunnerTour = (typeof runnerTours)[number]

const weekMs = 7 * 24 * 60 * 60 * 1000
const rotationStart = Date.UTC(2026, 9, 12) // Monday, first week of the rotation.

export function getWeeklyRunnerTour(dateIso: string): RunnerTour | undefined {
  if (!runnerTours.length) return undefined

  const date = parseIsoDate(dateIso)
  if (!date) return runnerTours[0]

  const week = Math.floor((date.getTime() - rotationStart) / weekMs)
  const index = ((week % runnerTours.length) + runnerTours.length) % runnerTours.length
  return runnerTours[index]
}
