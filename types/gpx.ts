export type GpxCoordinate = [latitude: number, longitude: number]
export interface GpxProfilePoint {
  distanceKm: number
  elevation: number | null
}
export interface GpxData {
  route?: GpxCoordinate[]
  overviewRoute?: GpxCoordinate[]
  profile?: number[]
  detailedProfile?: GpxProfilePoint[]
  distanceKm?: number
}

export interface GpxPreview extends Omit<GpxData, 'overviewRoute'> {
  source: string
  overviewRoute: number[][]
  profile: number[]
  highestPoint: number | null
}

export interface RunnerGpxRoute {
  id: string
  title: string
  dateIso: string
  location: string
  description: string
  distanceKm: number
  elevationGain: number
  preview: GpxPreview
}
