import type { BrainQuestion } from '~/types/brain'
import { z } from 'zod'
export default defineEventHandler(async (event): Promise<BrainQuestion | null> => {
  const { client } = await brainIdentity(event)
  const values = String(getQuery(event).exclude || '')
    .split(',')
    .filter(Boolean)
  const parsed = z.array(z.uuid()).max(100).safeParse(values)
  if (!parsed.success)
    throw createError({ statusCode: 400, statusMessage: 'Neveljaven izbor vprašanj.' })
  const { data, error } = await client.rpc('brain_next_question_excluding', {
    p_exclude: parsed.data,
  })
  brainCheck(error)
  return data
})
