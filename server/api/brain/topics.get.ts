import type { BrainTopic } from '~/types/brain'
export default defineEventHandler(async (event): Promise<BrainTopic[]> => {
  brainClient(event)
  const { data, error } = await brainService(event)
    .from('brain_entities')
    .select('id,title,kind')
    .in('kind', ['race', 'distance'])
    .order('title')
    .limit(1000)
  brainCheck(error)
  return (data || []).map((t) => ({
    id: String(t.id),
    title: String(t.title),
    kind: String(t.kind),
  }))
})
