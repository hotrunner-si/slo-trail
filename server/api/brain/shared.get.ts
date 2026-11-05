export default defineEventHandler(async (event) => {
  const { client, user } = await brainIdentity(event)
  const { data, error } = await client
    .from('brain_shared_conversations')
    .select('id,title,created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)
  brainCheck(error)
  return (data || []).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    createdAt: String(row.created_at),
  }))
})
