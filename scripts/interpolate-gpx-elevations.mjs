import { readFile, writeFile } from 'node:fs/promises'

const files = process.argv.slice(2)
if (!files.length) throw new Error('Navedi GPX datoteke za interpolacijo višin.')
for (const file of files) {
  let filled = 0
  const xml = await readFile(file, 'utf8')
  const result = xml.replace(/<(trkseg|rte)\b[^>]*>[\s\S]*?<\/\1>/g, (segment) => {
    const points = [...segment.matchAll(/<(trkpt|rtept)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>)/g)]
    const elevations = points.map(([point]) => {
      const value = point.match(/<ele>\s*([^<]+)<\/ele>/)?.[1]
      return value != null && Number.isFinite(Number(value)) ? Number(value) : null
    })
    const known = elevations.flatMap((value, index) => value == null ? [] : [index])
    if (!known.length) throw new Error(`Segment nima nobene znane višine: ${file}`)
    for (let index = 0; index < known[0]; index++) elevations[index] = elevations[known[0]]
    for (let k = 1; k < known.length; k++) {
      const a = known[k - 1], b = known[k]
      for (let index = a + 1; index < b; index++) {
        elevations[index] = elevations[a] + (elevations[b] - elevations[a]) * (index - a) / (b - a)
      }
    }
    for (let index = known.at(-1) + 1; index < points.length; index++) elevations[index] = elevations[known.at(-1)]
    let index = 0
    return segment.replace(/<(trkpt|rtept)\b[^>]*(?:\/>|>[\s\S]*?<\/\1>)/g, (point, tag) => {
      const elevation = elevations[index++]
      if (point.match(/<ele>\s*([^<]+)<\/ele>/)?.[1] != null) return point
      filled++
      const ele = `<ele>${Number(elevation.toFixed(2))}</ele>`
      return point.endsWith('/>')
        ? point.slice(0, -2) + `>${ele}</${tag}>`
        : point.replace(/>/, `>${ele}`)
    })
  })
  if (filled) await writeFile(file, result)
  console.log(`${file}: dopolnjenih ${filled} višin`)
}
