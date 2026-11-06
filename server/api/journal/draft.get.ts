import draft from '../../data/journal-draft.json'
import type { Article } from '~/types'

export default defineEventHandler(async (event): Promise<Article> => {
  setHeader(event, 'Cache-Control', 'private, no-store')
  await brainAdmin(event)
  const article = draft as Article
  if (getQuery(event).summary === '1') {
    const { id, slug, title, subtitle, description, category, publishedAt, image } = article
    return { id, slug, title, subtitle, description, category, publishedAt, image, body: [] }
  }
  return article
})
