import type { BrainChatResult } from '~/types/brain'
import { brainChatBodySchema } from '../../utils/brain-chat-policy'
import { brainKnowledge } from '../../utils/brain-knowledge'
import { brainGeminiChat } from '../../utils/brain-chat-gemini'
import { brainChatRetrievalQuery } from '../../../utils/brainChat'

export default defineEventHandler(async (event): Promise<BrainChatResult> => {
  // Leave room for response serialization before the hosting function's 60s limit.
  event.context.brainChatDeadline = Date.now() + 45_000
  brainMutation(event)
  const { user } = await brainIdentity(event, false)
  const body = await brainBody(event, brainChatBodySchema)
  brainLimit(event, 'chat:' + (user?.id || getRequestIP(event)), 8)
  const retrievalQuery = brainChatRetrievalQuery(body.messages)
  const knowledge = await brainKnowledge(event, body.messages, null, retrievalQuery)
  const output = await brainGeminiChat(event, body.messages, knowledge.sources, knowledge.available)
  await brainTrack(event, 'no_save', Boolean(user))
  // A chatbot answer is not evidence. Experiences use the separate private review pipeline.
  return {
    answer: output.answer,
    clarification: null,
    summary: null,
    saved: false,
    entityId: null,
    citations: output.citations,
    mode: output.mode,
    searchSuggestionsHtml: output.searchSuggestionsHtml,
    note:
      (!knowledge.available ? 'Del trail baze trenutno ni dosegljiv. ' : '') +
      'Pogovor se ne shranjuje samodejno. Za deljenje uporabi gumb Zaseben pogovor. Odgovore pripravlja umetna inteligenca; po potrebi uporabi spletno iskanje. Deljeni posnetki niso preverjena dejstva.',
  }
})
