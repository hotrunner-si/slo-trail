import { z } from 'zod'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event)
  const body = await brainBody(
    event,
    z.object({
      question: z.uuid(),
      choice: z.enum([
        'support',
        'oppose',
        'no_experience',
        'unknown',
        'skip',
        'different_context',
      ]),
      save: z.boolean(),
    }),
  )
  brainLimit(event, 'answer:' + user!.id, 30)
  if (!body.save) {
    await brainTrack(event, 'no_save', true)
    return { saved: false }
  }
  const { data, error } = await client.rpc('brain_answer', {
    p_question: body.question,
    p_choice: body.choice,
  })
  brainCheck(error)
  await brainTrack(event, 'question', true)
  return { saved: true, ...data }
})
