import { z } from 'zod'
import { redactBrainShare } from '../../utils/brainShare.ts'
import type { CommunitySummary } from '../../types/knowledge'

const publicText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((text) => redactBrainShare(text) === text, 'Odstrani kontakte in občutljive podatke.')
export const forumThreadSchema = z
  .object({
    title: publicText(5, 160),
    body: publicText(20, 5000),
    type: z.enum(['question', 'discussion', 'source']),
    topic: z.enum([
      'races',
      'routes',
      'people',
      'training',
      'gear',
      'nutrition',
      'health',
      'beginners',
      'other',
    ]),
    relatedKey: z.string().max(200).nullable().default(null),
    year: z.number().int().min(1900).max(2200).nullable().default(null),
    conditions: publicText(0, 200).default(''),
    consent: z.literal(true),
  })
  .strict()
export const forumPostSchema = z
  .object({ thread: z.uuid(), body: publicText(10, 5000), consent: z.literal(true) })
  .strict()
const point = z
  .object({ text: publicText(1, 800), postIds: z.array(z.uuid()).min(1).max(12) })
  .strict()
export const forumSummarySchema = z
  .object({
    overview: publicText(10, 1400),
    agreements: z.array(point).max(6),
    differences: z.array(point).max(6),
    cautions: z.array(point).max(6),
  })
  .strict()
export function validateForumSummary(value: unknown, ids: string[]): CommunitySummary {
  const summary = forumSummarySchema.parse(value)
  if (!summary.agreements.length && !summary.differences.length && !summary.cautions.length)
    throw new Error('Summary needs at least one cited contribution')
  const allowed = new Set(ids)
  if (
    [...summary.agreements, ...summary.differences, ...summary.cautions].some((p) =>
      p.postIds.some((id) => !allowed.has(id)),
    )
  )
    throw new Error('Unknown summary source')
  return summary
}
export function forumPublicationText(title: string, summary: CommunitySummary, threadId: string) {
  return (
    `PREGLEDAN POVZETEK SKUPNOSTNE RAZPRAVE · NEPREVERJENE IZKUŠNJE, NE URADNA DEJSTVA\n${title}\n${summary.overview}\n\n` +
    [
      ['Skupne ugotovitve', summary.agreements],
      ['Različne izkušnje', summary.differences],
      ['Omejitve', summary.cautions],
    ]
      .map(
        ([label, points]) =>
          `${label}\n${(points as CommunitySummary['agreements']).map((p) => `${p.text} [prispevki: ${p.postIds.join(', ')}]`).join('\n')}`,
      )
      .join('\n\n') +
    `\nIzvorna razprava: /mozgan/baza?thread=${threadId}`
  )
}
