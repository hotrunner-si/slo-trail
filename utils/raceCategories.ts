import type { RaceDistance } from '~/types'

export type EffortCategory = 'short' | '20K' | '50K' | '100K' | '100M'

type EffortDistance = Pick<RaceDistance, 'km' | 'elevation'>

export const effortKm = (distance: EffortDistance) =>
  Math.round((distance.km + distance.elevation / 100) * 10) / 10

export const effortCategory = (distance: EffortDistance): EffortCategory => {
  const effort = effortKm(distance)
  if (effort < 20) return 'short'
  if (effort < 50) return '20K'
  if (effort < 100) return '50K'
  if (effort < 160) return '100K'
  return '100M'
}

export const effortLabel = (distance: EffortDistance) => {
  const category = effortCategory(distance)
  return category === 'short' ? '<20' : category
}

export const effortColor = (distance: EffortDistance) => ({
  short: '#89939b',
  '20K': '#d6b529',
  '50K': '#d8792c',
  '100K': '#3e8d68',
  '100M': '#ba4b4f'
})[effortCategory(distance)]
