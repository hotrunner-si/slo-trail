import snapshots from '~/data/utmb-rankings.json'
import { utmbCategories } from '~/utils/utmb'
import type { UtmbCategory, UtmbRanking } from '~/utils/utmb'
import { serveUtmbRanking } from '~/server/utils/utmb-cache'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const scope = query.scope ?? 'world'
  const sex = query.sex ?? 'H'
  const category = query.category ?? 'general'
  if (
    (scope !== 'world' && scope !== 'slovenia') ||
    (sex !== 'H' && sex !== 'F') ||
    !utmbCategories.includes(category as UtmbCategory)
  )
    throw createError({ statusCode: 400, statusMessage: 'Neveljavna izbira lestvice.' })
  const selectedCategory = scope === 'slovenia' ? 'general' : (category as UtmbCategory)
  const key = `${scope}-${sex}-${selectedCategory}`
  const snapshot = (snapshots as unknown as Record<string, UtmbRanking>)[key]
  try {
    return await serveUtmbRanking(event, scope, sex, selectedCategory, snapshot)
  } catch {
    if (snapshot) return { ...snapshot, stale: true }
    throw createError({ statusCode: 503, statusMessage: 'UTMB lestvica trenutno ni dosegljiva.' })
  }
})
