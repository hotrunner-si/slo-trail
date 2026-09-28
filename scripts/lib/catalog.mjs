import ts from 'typescript'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/** Read literal catalog fields without depending on source formatting. */
export async function readRaceCatalog() {
  const catalog = await readFile(join(process.cwd(), 'data', 'races.ts'), 'utf8')
  const ast = ts.createSourceFile('races.ts', catalog, ts.ScriptTarget.Latest, true)
  const races = new Map()
  const property = (node, name) =>
    node.properties?.find((item) => (item.name?.text || item.name?.getText(ast)) === name)
      ?.initializer
  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.name.getText(ast) === 'races' &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const race of node.initializer.elements) {
        const slug = property(race, 'slug')?.text,
          name = property(race, 'name')?.text
        const distances = property(race, 'distances')
        if (!slug || !distances || !ts.isArrayLiteralExpression(distances)) continue
        races.set(slug, {
          name,
          distances: new Map(
            distances.elements.map((distance) => {
              const id = property(distance, 'id')?.text,
                km = Number(property(distance, 'km')?.getText(ast))
              return [id, { id, km }]
            }),
          ),
        })
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  if (!races.size) throw new Error('Katalog ne vsebuje tekem za uvoz GPX.')
  return races
}
