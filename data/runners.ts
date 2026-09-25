import type { Runner } from '~/types'

export const runners: Runner[] = [
  { id:'u1', slug:'nejc-ursic', name:'Nejc Uršič', location:'Slovenija', favouriteDistance:'50 km', bio:'Gorski tekač, član KGT Papež.', quote:'', image:'/images/monaco01.jpg', favouriteRouteSlugs:[], utmbIndex:758, utmb20k:759, utmb50k:642, utmb100k:604, bestUtmbScore:777, finishedRaces:32 }
]

export const getRunner = (slug: string) => runners.find(runner => runner.slug === slug)
