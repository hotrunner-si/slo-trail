import type { SiteContent } from '~/types/content'

export default defineEventHandler(async (event) => {
  const content = await event.$fetch<SiteContent>('/api/content')
  return content.articles
    .filter((article) => article.slug !== 'predogled')
    .map((article) => ({ loc: `/journal/${article.slug}` }))
})
