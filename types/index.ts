export type RegistrationStatus = 'Odprte' | 'Kmalu' | 'Zaprte' | 'Ni podatka'
export type RaceType = 'Trail' | 'Gorski tek' | 'Vertikal'
export type Technicality = 'Tekoča' | 'Srednja' | 'Tehnična'

export interface GpxPreviewData {
  rawFile?: string
  file?: string
  profile?: number[]
  route?: [number, number][]
  overviewRoute?: [number, number][]
  detailedProfile?: { distanceKm: number; elevation: number }[]
  highestPoint?: number
  elevationLoss?: number
}

export interface RaceDistance {
  id?: string; label: string; name?: string; km: number; elevation: number
  startDate?: string; startTime?: string; itra?: number
  utmbIndexCategory?: '20K' | '50K' | '100K' | '100M'
  technicality?: Technicality; gpx?: GpxPreviewData
}
export interface RaceResult { category: 'Moški' | 'Ženske'; winner: string; time: string }
export interface Climb { name: string; distance: string; gain: string; grade: string }
export interface Race {
  id: string; slug: string; name: string; location: string; region: string; date: string; dateEnd?: string
  dateStatus?: 'confirmed' | 'estimated'
  featured?: boolean; summary: string; distances: RaceDistance[]; registrationStatus: RegistrationStatus
  results?: RaceResult[]; climbs?: Climb[]; image?: string; raceType?: RaceType; country?: string
  coordinates?: { lat: number; lng: number }; mapPosition?: { x: number; y: number }
  sourceUrl?: string; sourcePage?: string; sourceName?: string; logo?: string
  verifiedAt?: string; isByUtmb?: boolean; collections?: string[]
  entrants?: { runnerSlug: string; distanceId: string }[]
  liveUrl?: string
}
export interface RaceCompareItem { race: Race; distance: RaceDistance; index: number }
export interface Runner {
  id: string; slug: string; name: string; location: string; favouriteDistance: string
  bio: string; quote: string; image: string; favouriteRouteSlugs: string[]
  utmbIndex?: number; utmb20k?: number; utmb50k?: number; utmb100k?: number; bestUtmbScore?: number; finishedRaces?: number
}
export interface TrailRoute {
  id: string; slug: string; name: string; region: string; distance: number; elevationGain: number
  elevationLoss: number; highPoint: number; estimatedTime: string; difficulty: 'Zmerna' | 'Zahtevna' | 'Zelo zahtevna'
  recommendedBy: string; runnerSlug: string; description: string; quote: string; image?: string
  gpx?: GpxPreviewData
}
export interface Article {
  id: string; slug: string; title: string; subtitle: string; description: string; category: string; publishedAt: string
  image: string; body: string[]; relatedRace?: string; relatedRunner?: string; relatedRoute?: string
}
