import { z } from 'zod'
import { redactBrainShare } from '../../utils/brainShare.ts'

export const brainShareSchema = z
  .object({
    title: z.string().trim().min(3).max(160),
    content: z.string().trim().min(20).max(11000),
    consent: z.literal(true),
  })
  .strict()
  .superRefine(({ title, content }, ctx) => {
    if (
      new TextEncoder().encode(content).length > 32000 ||
      redactBrainShare(title) !== title ||
      redactBrainShare(content) !== content
    )
      ctx.addIssue({ code: 'custom', message: 'Remove contacts or shorten content' })
  })
