import { randomInt } from 'node:crypto'
import { pickBrainPrompts } from '../../utils/brain-prompts'
import type { BrainChatPrompt } from '~/types/brain'

export default defineEventHandler(async (event): Promise<BrainChatPrompt[]> => {
  const client = brainClient(event)
  const { data, error } = await client
    .from('brain_chat_prompts')
    .select('id,prompt')
    .eq('active', true)
    .order('id')
    .limit(100)
  if (error)
    throw createError({
      statusCode: 503,
      statusMessage: 'Predlogov vprašanj trenutno ni mogoče naložiti.',
    })
  return pickBrainPrompts(
    (data || []).map((row) => ({ id: Number(row.id), prompt: String(row.prompt) })),
    randomInt,
  )
})
