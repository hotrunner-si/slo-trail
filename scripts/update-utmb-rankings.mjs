import { writeFile } from 'node:fs/promises'
import { fetchUtmb, fetchUtmbRanking, utmbCategories } from '../utils/utmb.ts'

const profiles = new Map()
const profile = (uri) => {
  if (!profiles.has(uri)) profiles.set(uri, fetchUtmb(`/runners/${encodeURIComponent(uri)}`))
  return profiles.get(uri)
}
const rankings = {}
for (const scope of ['world', 'slovenia']) {
  for (const sex of ['H', 'F']) {
    for (const category of scope === 'world' ? utmbCategories : ['general']) {
      const key = `${scope}-${sex}-${category}`
      rankings[key] = await fetchUtmbRanking(scope, sex, category, profile)
      console.log(`${key}: ${rankings[key].runners.length}`)
    }
  }
}
// Replace only after all lists and profiles were successfully fetched.
await writeFile(
  new URL('../data/utmb-rankings.json', import.meta.url),
  JSON.stringify(rankings, null, 2) + '\n',
)
