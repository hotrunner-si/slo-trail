export const knowledgeTopics = [
  { id: 'all', label: 'Vse teme' },
  { id: 'races', label: 'Tekme in rezultati' },
  { id: 'routes', label: 'Poti in trase' },
  { id: 'people', label: 'Tekači in skupnost' },
  { id: 'training', label: 'Trening in priprava' },
  { id: 'gear', label: 'Oprema' },
  { id: 'nutrition', label: 'Prehrana in hidracija' },
  { id: 'health', label: 'Zdravje in regeneracija' },
  { id: 'beginners', label: 'Prvi trail' },
  { id: 'other', label: 'Vse ostalo' },
] as const
export type KnowledgeTopic = (typeof knowledgeTopics)[number]['id']
export interface KnowledgeEntry {
  id: string
  entityId?: string
  title: string
  kind: string
  origin: string
  topic: KnowledgeTopic
  excerpt: string
  sections: { title: string; text: string }[]
  facts: { label: string; value: string }[]
  links: { label: string; url: string }[]
  related: string[]
  verifiedAt?: string | null
  validFrom?: string | null
  validUntil?: string | null
}
export interface CommunityThread {
  id: string
  title: string
  body: string
  type: 'question' | 'discussion' | 'source'
  topic: KnowledgeTopic
  related_key: string | null
  year: number | null
  conditions: string
  author_name: string
  created_at: string
  activity_at: string
  revision: number
  reply_count: number
  accepted_post_id: string | null
  hidden: boolean
  mine: boolean
  following: boolean
  unread: boolean
  published: boolean
}
export interface CommunityPost {
  id: string
  body: string
  author_name: string
  created_at: string
  updated_at: string
  mine: boolean
  hidden: boolean
}
export interface CommunitySummary {
  overview: string
  agreements: { text: string; postIds: string[] }[]
  differences: { text: string; postIds: string[] }[]
  cautions: { text: string; postIds: string[] }[]
}
export interface CommunityDetail {
  thread: CommunityThread
  posts: CommunityPost[]
  summary: CommunitySummary | null
  summaryAt: string | null
  summaryStale: boolean
}
