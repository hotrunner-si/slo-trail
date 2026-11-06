import fs from 'node:fs'
import assert from 'node:assert/strict'
const directory='docs/articles/jesenski-trojcek-2026'
const path='server/data/journal-draft.json'
const draft=JSON.parse(fs.readFileSync(path,'utf8'))
const view=JSON.parse(fs.readFileSync(`${directory}/article-view.json`,'utf8'))
const markdown=fs.readFileSync(`${directory}/article.md`,'utf8')
draft.title=markdown.match(/^# (.+)$/m)?.[1]?.trim()
draft.subtitle=markdown.match(/^\*\*(.+)\*\*$/m)?.[1]?.trim()
assert.ok(draft.title&&draft.subtitle)
draft.trailAnalysis.beforeChart=view.beforeRanking
  .replace(/^<h1>[\s\S]*?<\/h1>\s*/,'')
  .replace(/^<p><strong>[\s\S]*?<\/strong><\/p>\s*/,'')
  .replace(/^<p><em>[\s\S]*?<\/em><\/p>\s*/,'')
draft.trailAnalysis.afterChart=view.afterRanking
draft.body=[...(draft.trailAnalysis.beforeChart+view.afterRanking).matchAll(/<(?:p|h2)\b[^>]*>([\s\S]*?)<\/(?:p|h2)>/g)]
  .map(m=>m[1].replace(/<[^>]*>/g,'').replaceAll('&amp;','&').trim())
fs.writeFileSync(path,JSON.stringify(draft,null,2)+'\n')
console.log('Updated private journal preview only; no publication or database write.')
