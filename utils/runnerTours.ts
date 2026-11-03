import type { Runner } from '~/types'
import type { RunnerGpxRoute } from '~/types/gpx'
import type { RunnerTour } from '~/types/content'
import { parseIsoDate } from './formatDate'

export function listRunnerTours(
  runners: Runner[],
  routes: Record<string, RunnerGpxRoute[]>,
): RunnerTour[] {
  return runners
    .flatMap((runner) =>
      (routes[runner.slug] || []).map((tour) => ({
        ...tour,
        key: `${runner.slug}-${tour.id}`,
        runnerSlug: runner.slug,
        runnerName: runner.name,
      })),
    )
    .sort((a, b) => (b.dateIso || '').localeCompare(a.dateIso || ''))
}

export function selectWeeklyRunnerTour(
  tours: RunnerTour[],
  dateIso: string,
): RunnerTour | undefined {
  if (!tours.length) return undefined
  const date = parseIsoDate(dateIso)
  if (!date) return tours[0]
  const week = Math.floor((date.getTime() - Date.UTC(2026, 9, 12)) / (7 * 24 * 60 * 60 * 1000))
  return tours[((week % tours.length) + tours.length) % tours.length]
}
