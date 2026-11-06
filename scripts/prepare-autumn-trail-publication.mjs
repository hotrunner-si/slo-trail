import fs from 'node:fs'
import assert from 'node:assert/strict'
const dir = 'docs/articles/jesenski-trojcek-2026'
const view = JSON.parse(fs.readFileSync(`${dir}/article-view.json`, 'utf8'))
const points = JSON.parse(fs.readFileSync(`${dir}/routes.json`, 'utf8'))
const winners = JSON.parse(fs.readFileSync(`${dir}/results.json`, 'utf8'))
const plain = text => text.replace(/<[^>]+>/g, ' ').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replace(/\s+/g, ' ').trim()
const markdown = fs.readFileSync(`${dir}/article.md`, 'utf8').replaceAll('\r\n', '\n')
const title = markdown.match(/^# (.+)$/m)?.[1]
const subtitle = markdown.match(/^\*\*(.+)\*\*$/m)?.[1]
assert.ok(title && subtitle, 'article.md requires a title and bold subtitle')
const beforeChart = view.beforeRanking
  .replace(/^<h1>[\s\S]*?<\/h1>\s*/, '')
  .replace(/^<p><strong>[\s\S]*?<\/strong><\/p>\s*/, '')
  .replace(/^<p><em>[\s\S]*?<\/em><\/p>\s*/, '')
assert.ok(!beforeChart.includes('<h1>'), 'Article heading must appear only in the story header')
const article = {
  id: 'autumn-trails-2026',
  slug: 'obala-go4trail-lahinja-2026-primerjava',
  title,
  subtitle,
  description: 'Analitični pregled Obale, GO4Trail in Lahinje pred 7. novembrom 2026. Primerjava razdalj, vzpona na kilometer in hitrosti preteklih zmagovalcev.',
  category: 'Tekme',
  publishedAt: '2026-11-06',
  image: '/images/26-11-7-races-overview/go4trail-7nov-banner.webp',
  sideImages: [{ src: '/images/articles/jesenski-trojcek-2026/trase-v-primerjavi.png', alt: 'Enajst tras Obale, GO4Trail in Lahinje po vzponu na kilometer.', sourceUrl: 'https://favatadzmmqsdocrstti.supabase.co/storage/v1/object/public/site-assets/images/articles/jesenski-trojcek-2026/trase-v-primerjavi.png', caption: 'Trase v primerjavi – odpri graf v polni velikosti' }],
  body: [...(beforeChart + view.afterRanking).matchAll(/<(h2|p)\b[^>]*>([\s\S]*?)<\/\1>/g)].map(m => plain(m[2])).filter(Boolean),
  trailAnalysis: { beforeChart, afterChart: view.afterRanking, points },
}
// Compatible plain-text fallback for older deployed article renderers.
article.body.push('Pregled tras 2026: ' + points.map(r => `${r.raceName} ${r.name}: ${r.km} km, ${r.elevation} m vzpona`).join('; ') + '.')
article.body.push('Zbrani zmagovalci in zmagovalke 2021–2025. Nominalne razdalje se med leti spreminjajo; podrobni viri in pojasnila so shranjeni ob članku.')
article.body.push(...winners.map(r => `${r.year} · ${r.event} · ${r.route} · ${r.gender === 'M' ? 'moški' : 'ženske'}: ${r.name}, ${r.time || 'čas ni potrjen'}.`))
fs.writeFileSync(`${dir}/published-article.json`, JSON.stringify(article, null, 2) + '\n')
// One private preview slot; the next article in preparation replaces this file.
fs.mkdirSync('server/data', { recursive: true })
fs.writeFileSync('server/data/journal-draft.json', JSON.stringify(article, null, 2) + '\n')
const quote = s => "'" + s.replaceAll("'", "''") + "'"
fs.writeFileSync(`${dir}/publish.sql`, `insert into public.articles(slug,position,contains_demo,data) values (${quote(article.slug)},-1,false,${quote(JSON.stringify(article))}::jsonb) on conflict(slug) do update set data=excluded.data,contains_demo=false;\n`)
fs.mkdirSync('public/images/articles/jesenski-trojcek-2026', {recursive:true})
fs.copyFileSync(`${dir}/trase-v-primerjavi.png`, 'public/images/articles/jesenski-trojcek-2026/trase-v-primerjavi.png')
console.log('Prepared article in category Tekme; no database writes.')
