import type { Runner } from '~/types'

export const runners: Runner[] = [
  {
    id: 'u1',
    slug: 'nejc-ursic',
    name: 'Nejc Uršič',
    location: 'Županje Njive',
    club: 'KGT Papež',
    bio: 'Gorski tekač, član KGT Papež.',
    longDescription: 'prazen opis',
    quote: '',
    image: '/images/monaco01.jpg',
    favouriteRouteSlugs: [],
    utmbIndex: 758,
    utmbUrl: 'https://utmb.world/runner/2586047.nejc.ursic',
  },
  {
    id: 'u2',
    slug: 'klemen-spanring',
    name: 'Klemen Španring',
    location: 'Slovenska Bistrica',
    club: 'AK Slovenska Bistrica',
    bio: 'Gorski tekač in turni smučar.',
    longDescription: 'prazen opis',
    quote: '',
    image: '/images/runners/klemen-spanring/02-world-finish.jpg',
    favouriteRouteSlugs: [],
    utmbIndex: 852,
    utmbUrl: 'https://utmb.world/runner/2586019.klemen.spanring',
  },
  {
    id: 'u3',
    slug: 'klara-velepec',
    name: 'Klara Velepec',
    location: 'Radovljica',
    club: 'AK Radovljica',
    bio: 'Gorska tekačica in turna smučarka.',
    longDescription: 'prazen opis',
    quote: '',
    image: '/images/runners/klara-velepec/04-season-finale.jpg',
    favouriteRouteSlugs: [],
    utmbIndex: 721,
    utmbUrl: 'https://utmb.world/runner/7337166.klara.velepec',
  },
]

export const getRunner = (slug: string) => runners.find((runner) => runner.slug === slug)
