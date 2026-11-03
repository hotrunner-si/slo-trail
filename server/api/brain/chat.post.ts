import { z } from 'zod'
import type { BrainChatResult, BrainSource } from '~/types/brain'
export default defineEventHandler(async (event): Promise<BrainChatResult> => {
  brainMutation(event)
  const { client, user } = await brainIdentity(event, false)
  const body = await brainBody(
    event,
    z.object({
      messages: z
        .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().min(1).max(3000) }))
        .min(1)
        .max(12),
      save: z.boolean(),
      entity: z.uuid().nullable().default(null),
      question: z.uuid().nullable().default(null),
    }),
  )
  brainLimit(event, 'chat:' + (user?.id || getRequestIP(event)), 8)
  const service = brainService(event)
  const query = body.messages.filter((m) => m.role === 'user').at(-1)?.text || ''
  // Search only non-demo editorial/official sources. Never use an AI answer as a source.
  let sourceQuery = service
    .from('brain_sources')
    .select('id,entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until')
  if (body.entity) {
    const { data: parents } = await service
      .from('brain_relations')
      .select('object_id')
      .eq('subject_id', body.entity)
      .limit(8)
    sourceQuery = sourceQuery.in('entity_id', [
      body.entity,
      ...(parents || []).map((p) => p.object_id),
    ])
  } else {
    const words =
      query
        .toLowerCase()
        .match(/[\p{L}\d-]{4,}/gu)
        ?.filter(
          (w) =>
            ![
              'kako',
              'lahko',
              'kateri',
              'katera',
              'letos',
              'tekel',
              'izkušnjo',
              'prosim',
              'povej',
            ].includes(w),
        )
        .slice(0, 8) || []
    sourceQuery = sourceQuery.textSearch('search', words.join(' OR ') || query.slice(0, 300), {
      type: 'websearch',
      config: 'simple',
    })
  }
  const { data: sources } = await sourceQuery.limit(8)
  let question = null
  if (body.question && user) {
    const { data } = await service
      .from('brain_questions')
      .select('id,entity_id,prompt')
      .eq('id', body.question)
      .eq('active', true)
      .maybeSingle()
    question = data
    if (!question || body.entity !== question.entity_id)
      throw createError({
        statusCode: 400,
        statusMessage: 'Vprašanje ne ustreza izbranemu predmetu.',
      })
  }
  const ids = [
    ...new Set([...(sources || []).map((s) => s.entity_id), ...(body.entity ? [body.entity] : [])]),
  ]
  const { data: entities } = ids.length
    ? await service.from('brain_entities').select('id,title,kind').in('id', ids)
    : { data: [] }
  const output = await brainExtract(
    event,
    { messages: body.messages, sources: sources || [], entities: entities || [], question },
    (entities || [])
      .filter((e) => ['race', 'edition', 'distance', 'route', 'segment'].includes(e.kind))
      .map((e) => e.id),
    (sources || []).map((s) => s.id),
  )
  let saved = false
  if (
    body.save &&
    user &&
    !output.clarification &&
    output.summary &&
    output.statement &&
    output.entityId &&
    output.directExperience &&
    output.year &&
    output.conditions !== 'unknown'
  ) {
    const { error } = await service.rpc('brain_store_experience', {
      p_user: user.id,
      p_entity: output.entityId,
      p_summary: output.summary,
      p_statement: output.statement,
      p_year: output.year,
      p_conditions: output.conditions,
      p_question: body.question,
    })
    brainCheck(error)
    saved = true
  }
  await brainTrack(event, body.save ? 'chat' : 'no_save', Boolean(user))
  return {
    answer: output.citations.length
      ? output.answer
      : 'Za vsebinski odgovor ni dovolj dokazov v navedenih virih.',
    clarification: output.clarification,
    summary: output.summary,
    saved,
    entityId: output.entityId,
    citations: (sources || []).filter((s) => output.citations.includes(s.id)) as BrainSource[],
    note: !user
      ? 'Vprašanje obiskovalca je signal zanimanja, ne potrjena izkušnja. Vsebina ni shranjena.'
      : !body.save
        ? 'Brez shranjevanja vsebine, povzetka ali znanja.'
        : saved
          ? 'Shranjen je anonimiziran povzetek in ena uporabniška izkušnja z nizkim začetnim zaupanjem.'
          : 'Podatki še niso dovolj jasni za shranjevanje.',
  }
})
