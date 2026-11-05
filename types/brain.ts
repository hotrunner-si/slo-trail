export interface BrainTopic {
  id: string
  title: string
  kind: string
}
export interface BrainProfile {
  user_id: string
  display_name: string
  bio: string
  region: string
  status: string
  public_runner_slug: string | null
  created_at: string
}
export interface BrainFile {
  id: string
  user_id: string
  slot: number
  kind: 'gpx' | 'image'
  path: string
  name: string
  bytes: number
  details: {
    pointCount?: number
    preview?: [number, number][]
    width?: number
    height?: number
    processingVersion?: number
    distanceKm?: number
    elevationGain?: number | null
    elevationLoss?: number | null
    highestPoint?: number | null
    elevationsComplete?: boolean
    artifacts?: Record<string, string>
  }
  created_at: string
}
export interface BrainLinkRequest {
  id: string
  user_id: string
  runner_slug: string
  note: string
  status: string
  created_at: string
}
export interface BrainRouteReview {
  id: string
  user_id: string
  file_id: string
  file_path: string
  title: string
  status: string
  created_at: string
}
export interface BrainAccount {
  publications: {
    id: string
    file_id: string
    source_path: string
    kind: 'image' | 'gpx'
    runner_slug: string
    created_at: string
  }[]
  admin: boolean
  profile: BrainProfile | null
  link: { user_id: string; runner_slug: string } | null
  requests: BrainLinkRequest[]
  files: BrainFile[]
  routes: BrainRouteReview[]
  summaries: { id: string; summary: string; created_at: string }[]
  pending: { id: string; status: string }[]
}
export interface BrainSession {
  recovery: boolean
  user: {
    id: string
    email?: string
    displayName: string
    createdAt: string
    pendingEmail: string | null
  } | null
  account: BrainAccount | null
  aiAvailable: boolean
  semanticAvailable: boolean
}
export interface BrainSource {
  id: string
  entity_id: string
  title: string
  excerpt: string
  url: string | null
  origin: string
  verified_at: string | null
  valid_from: string | null
  valid_until: string | null
  kind?: string
  race_slug?: string | null
  distance_id?: string | null
  article_slug?: string | null
  similarity?: number | null
}
export interface BrainRelation {
  subject_id: string
  object_id: string
  relation: string
}
export interface BrainClaim {
  id: string
  entity_id: string
  statement: string
  year: number | null
  conditions: string
  origin: string
}
export interface BrainRecord {
  entity: BrainTopic & { race_slug?: string | null }
  sources: BrainSource[]
  relations: BrainRelation[]
  claims: BrainClaim[]
  related: BrainTopic[]
}
export interface BrainAdminData {
  profiles: BrainProfile[]
  links: BrainLinkRequest[]
  routes: BrainRouteReview[]
  files: Pick<BrainFile, 'id' | 'details'>[]
  entities: BrainTopic[]
  claims: (BrainClaim & { status: string })[]
}
export interface BrainQuestion {
  id: string
  entity_id: string
  prompt: string
  claim_id: string | null
  title: string
  year: number | null
  conditions: string | null
}
export interface BrainChatPrompt {
  id: number
  prompt: string
}
export interface BrainChatResult {
  mode?: 'database' | 'general' | 'web' | 'missing'
  searchSuggestionsHtml?: string | null
  answer: string
  clarification: string | null
  summary: string | null
  saved: boolean
  entityId: string | null
  citations: BrainSource[]
  note: string
}
