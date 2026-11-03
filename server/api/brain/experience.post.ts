import { z } from 'zod'
import { containsContact } from '../../utils/brain-safety'
export default defineEventHandler(async (event) => {
  brainMutation(event)
  const { user } = await brainIdentity(event)
  const body = await brainBody(
    event,
    z.object({
      question: z.uuid(),
      entity: z.uuid(),
      year: z.number().int().min(1900).max(new Date().getFullYear()),
      conditions: z.enum(['wet', 'dry']),
      statement: z.string().trim().min(15).max(700),
      direct: z.literal(true),
      save: z.boolean(),
    }),
  )
  brainLimit(event, 'experience:' + user!.id, 10)
  if (!body.save) {
    await brainTrack(event, 'no_save', true)
    return { saved: false }
  }
  // Without AI, keep free text private. Publication uses the same validated anonymizing AI pipeline.
  if (containsContact(body.statement))
    throw createError({
      statusCode: 400,
      statusMessage: 'Odstrani kontakte in povezave. Opiši samo izkušnjo na trasi.',
    })
  const service = brainService(event)
  const { data: q } = await service
    .from('brain_questions')
    .select('entity_id')
    .eq('id', body.question)
    .eq('active', true)
    .maybeSingle()
  const { data: e } = await service
    .from('brain_entities')
    .select('id,title,kind')
    .eq('id', body.entity)
    .maybeSingle()
  if (!q || q.entity_id !== body.entity || !e)
    throw createError({ statusCode: 400, statusMessage: 'Neveljaven predmet vprašanja.' })
  // This flow works without an AI key: the submitted text is a PRIVATE summary awaiting anonymization.
  // It is not shown to other accounts, published, or counted as a confirmation.
  const { error } = await service.rpc('brain_store_private_experience', {
    p_user: user!.id,
    p_entity: body.entity,
    p_question: body.question,
    p_summary: body.statement,
    p_year: body.year,
    p_conditions: body.conditions,
  })
  brainCheck(error)
  await brainProcessPending(event, user!.id)
  const { data: current } = await service
    .from('brain_pending_experiences')
    .select('status')
    .eq('user_id', user!.id)
    .eq('question_id', body.question)
    .maybeSingle()
  const completed = current?.status === 'done'
  await brainTrack(event, 'question', true)
  return {
    saved: true,
    pending: !completed,
    message: completed
      ? 'Izkušnja je anonimizirana in vključena v preverjanje pri drugih računih.'
      : 'Izkušnja je shranjena zasebno. V skupno znanje bo vključena šele po anonimizaciji; trenutno še ne šteje kot potrditev.',
  }
})
