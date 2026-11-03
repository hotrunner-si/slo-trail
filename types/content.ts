import type { Article, Race, Runner, TrailRoute } from './index'
import type { RunnerGpxRoute } from './gpx'
import type mozganSeed from '../supabase/mozgan.seed.json'
import type dashboardSeed from '../supabase/mozgan-dashboard.seed.json'
import type workspaceSeed from '../supabase/mozgan-workspace.seed.json'

export type RunnerTour = RunnerGpxRoute & { key: string; runnerSlug: string; runnerName: string }
export interface RaceHeroPhoto {
  src: string
  alt: string
  author: string
  source: string
  license: string
  licenseUrl: string
  resized: boolean
}
export interface SiteContent {
  races: Race[]
  runners: Runner[]
  trailRoutes: TrailRoute[]
  runnerGpxRoutes: Record<string, RunnerGpxRoute[]>
  articles: Article[]
  raceHeroPhotos: Record<string, RaceHeroPhoto>
  runnerPhotos: { runner: string; file: string; url: string; source: string; credit: string }[]
  siteContent: {
    mozgan: typeof mozganSeed & { dashboard: typeof dashboardSeed; workspace: typeof workspaceSeed }
    site: {
      name: string
      shortName: string
      description: string
      homeDescription: string
      footerDescription: string
      authorName: string
      authorUrl: string
      navigation: { label: string; to: string }[]
      navigationCta: { label: string; to: string }
    }
    home: {
      title: string[]
      intro: string
      heroImage: string
      heroAlt: string
      photoLabel: string
      photoTitle: string
      newsletterTitle: string
      newsletterDescription: string
      newsletterTopics: string[]
      newsletterUrl: string
    }
    races: {
      title: string
      description: string
      sourceTitle: string
      sourceDescription: string
      popularSlugs: string[]
    }
    runners: { title: string; description: string }
    routes: { title: string; intro: string; description: string }
    journal: { title: string[]; intro: string; description: string; categories: string[] }
    assets: { ready: boolean; bucket: string }
  }
}
