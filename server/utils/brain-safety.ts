import { XMLParser, XMLValidator } from 'fast-xml-parser'
import { z } from 'zod'
import { Buffer } from 'node:buffer'

export const aiResultSchema = z
  .object({
    answer: z.string().min(1).max(4000),
    clarification: z.string().max(500).nullable(),
    summary: z.string().max(1800).nullable(),
    statement: z.string().min(5).max(1000).nullable(),
    entityId: z.uuid().nullable(),
    year: z.number().int().min(1900).max(2200).nullable(),
    conditions: z.enum(['wet', 'dry', 'unknown']),
    directExperience: z.boolean(),
    citations: z.array(z.uuid()).max(8),
  })
  .strict()

export function containsContact(text: string) {
  return /[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\/|(?:\+?\d[\s().-]*){7,}/i.test(text)
}
export function validateExtraction(value: unknown, entities: string[], sources: string[]) {
  const output = aiResultSchema.parse(value)
  if (output.statement && output.year && output.year > new Date().getFullYear())
    throw new Error('Future experience')
  if (output.entityId && !entities.includes(output.entityId)) throw new Error('Unknown entity')
  if (output.citations.some((id) => !sources.includes(id))) throw new Error('Unknown citation')
  if (
    output.statement &&
    (containsContact(output.statement) || !output.directExperience || !output.entityId)
  )
    throw new Error('Unsafe extraction')
  if (output.summary && containsContact(output.summary)) throw new Error('Unsafe summary')
  return output
}

export function inspectGpx(buffer: Buffer) {
  if (!buffer.length || buffer.length > 5 * 1024 * 1024)
    throw new Error('GPX je prevelik ali prazen (največ 5 MB).')
  const xml = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  if (/<!\s*(DOCTYPE|ENTITY)|<\s*(script|iframe)|<\?xml-stylesheet/i.test(xml))
    throw new Error('GPX vsebuje nedovoljene elemente.')
  if (XMLValidator.validate(xml) !== true) throw new Error('Datoteka ni veljaven XML.')
  const tree = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    removeNSPrefix: true,
    processEntities: false,
  }).parse(xml)
  if (!tree.gpx || typeof tree.gpx !== 'object')
    throw new Error('Datoteka nima korenskega elementa GPX.')
  const points: [number, number][] = []
  let nodes = 0
  function walk(value: unknown, depth = 0) {
    if (depth > 35 || ++nodes > 350000) throw new Error('GPX je preveč zapleten.')
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) {
      value.forEach((v) => walk(v, depth + 1))
      return
    }
    const v = value as Record<string, unknown>
    if ('lat' in v || 'lon' in v) {
      const lat = Number(v.lat),
        lon = Number(v.lon)
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        Math.abs(lat) > 90 ||
        Math.abs(lon) > 180
      )
        throw new Error('GPX vsebuje neveljavne koordinate.')
      points.push([lat, lon])
      if (points.length > 100000) throw new Error('GPX ima več kot 100.000 točk.')
    }
    Object.values(v).forEach((v) => walk(v, depth + 1))
  }
  walk(tree.gpx)
  if (points.length < 2) throw new Error('GPX potrebuje vsaj dve točki.')
  const step = Math.max(1, Math.ceil(points.length / 300))
  return { pointCount: points.length, preview: points.filter((_, i) => i % step === 0) }
}
