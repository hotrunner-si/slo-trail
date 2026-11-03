import { mkdir, writeFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readLocalContent, contentRows } from './lib/content-export.mjs'

const content = readLocalContent()
const rows = contentRows(content)
const assets = []
async function walk(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = [prefix, entry.name].filter(Boolean).join('/')
    if (entry.isDirectory()) await walk(join(directory, entry.name), path)
    else {
      const file = join(directory, entry.name)
      const bytes = await readFile(file)
      assets.push({
        path,
        bytes: (await stat(file)).size,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      })
    }
  }
}
await walk(join(process.cwd(), 'public'))
await mkdir('.data', { recursive: true })
await writeFile('.data/content-snapshot.json', JSON.stringify(content))
await writeFile('.data/content-rows.json', JSON.stringify(rows))
await writeFile('.data/content-assets.json', JSON.stringify(assets))
const quote = (v) => `'${JSON.stringify(v).replaceAll("'", "''")}'::jsonb`
const sql = Object.entries(rows)
  .filter(([, values]) => values.length)
  .map(
    ([table, values]) =>
      `insert into public.${table} (${Object.keys(values[0]).join(',')}) select ${Object.keys(values[0]).join(',')} from jsonb_populate_recordset(null::public.${table}, ${quote(values)}) on conflict do nothing;`,
  )
  .join('\n')
await writeFile('.data/content-import.sql', `begin;\n${sql}\ncommit;\n`)
console.log(
  JSON.stringify(
    {
      tables: Object.fromEntries(
        Object.entries(rows).map(([table, values]) => [table, values.length]),
      ),
      assets: assets.length,
      assetBytes: assets.reduce((sum, a) => sum + a.bytes, 0),
    },
    null,
    2,
  ),
)
