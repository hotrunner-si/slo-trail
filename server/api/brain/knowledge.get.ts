import type { SiteContent } from '../../../types/content'
import type { KnowledgeEntry } from '../../../types/knowledge'
import { siteKnowledgeEntries, knowledgeTopic, safeKnowledgeUrl } from '../../../utils/knowledge'

export default defineEventHandler(async (event) => {
  const { client } = await brainIdentity(event)
  const content = await event.$fetch<SiteContent>('/api/content')
  const entries = siteKnowledgeEntries(content)
  // Range over all rows, rather than silently using PostgREST's default row cap.
  async function all(
    table: string,
    columns: string,
    order = 'id',
    filter: (query: any) => any = (q) => q,
  ) {
    const rows: any[] = []
    for (let offset = 0; ; offset += 500) {
      let query = filter(client.from(table).select(columns)).order(order)
      if (table === 'brain_relations') query = query.order('object_id').order('relation')
      const result = await query.range(offset, offset + 499)
      brainCheck(result.error)
      rows.push(...(result.data || []))
      if ((result.data?.length || 0) < 500) return rows
    }
  }
  const [entities, sources, claims, relations] = await Promise.all([
    all('brain_entities', 'id,title,kind,race_slug,runner_slug,article_slug,distance_id,year'),
    all(
      'brain_sources',
      'id,entity_id,title,excerpt,url,origin,verified_at,valid_from,valid_until',
    ),
    all('brain_claims', 'id,entity_id,statement,year,conditions,origin', 'id', (q) =>
      q.eq('status', 'active'),
    ),
    all('brain_relations', 'subject_id,object_id,relation', 'subject_id'),
  ])
  const entityById = new Map(entities.map((e) => [e.id, e]))
  const entityKey = (entity: any) =>
    entity?.kind === 'race' && entity.race_slug
      ? `race:${entity.race_slug}`
      : entity?.kind === 'distance' && entity.race_slug && entity.distance_id
        ? `distance:${entity.race_slug}:${entity.distance_id}`
        : entity?.kind === 'runner' && entity.runner_slug
          ? `runner:${entity.runner_slug}`
          : entity?.kind === 'article' && entity.article_slug
            ? `article:${entity.article_slug}`
            : `entity:${entity?.id}`
  for (const entry of entries) {
    const entity = entities.find((e) => entityKey(e) === entry.id)
    if (entity) entry.entityId = entity.id
  }
  for (const source of sources) {
    const entity = entityById.get(source.entity_id)
    const url = safeKnowledgeUrl(source.url)
    const related = [
      entityKey(entity),
      ...relations
        .filter((r) => r.subject_id === source.entity_id || r.object_id === source.entity_id)
        .map((r) =>
          entityKey(entityById.get(r.subject_id === source.entity_id ? r.object_id : r.subject_id)),
        ),
    ]
    entries.push({
      id: `source:${source.id}`,
      entityId: source.entity_id,
      title: source.title,
      kind: 'source',
      origin: source.origin,
      topic: knowledgeTopic(
        source.title + ' ' + source.excerpt,
        entity?.kind === 'runner' ? 'people' : 'races',
      ),
      excerpt: source.excerpt,
      sections: [],
      facts: [
        { label: 'Povezano z', value: entity?.title || 'Samostojen vir' },
        ...(entity?.year ? [{ label: 'Izvedba', value: String(entity.year) }] : []),
      ],
      links: url ? [{ label: 'Odpri izvorni vir', url }] : [],
      related,
      verifiedAt: source.verified_at,
      validFrom: source.valid_from,
      validUntil: source.valid_until,
    })
  }
  // Retain every entity, even when it has no catalog page or external source yet.
  for (const entity of entities)
    if (!entries.some((e) => e.id === entityKey(entity)))
      entries.push({
        id: entityKey(entity),
        entityId: entity.id,
        title: entity.title,
        kind: entity.kind,
        origin: 'editorial',
        topic: entity.kind === 'runner' ? 'people' : 'races',
        excerpt: 'Povezani zapis v zbirki znanja.',
        sections: [],
        facts: entity.year ? [{ label: 'Leto', value: String(entity.year) }] : [],
        links: [],
        related: [],
      })
  for (const claim of claims)
    entries.push({
      id: `claim:${claim.id}`,
      entityId: claim.entity_id,
      title: entityById.get(claim.entity_id)?.title || 'Izkušnja skupnosti',
      kind: 'experience',
      origin: 'community',
      topic: knowledgeTopic(claim.statement, 'routes'),
      excerpt: claim.statement,
      sections: [],
      facts: [
        { label: 'Leto', value: claim.year ? String(claim.year) : 'Ni navedeno' },
        {
          label: 'Razmere',
          value:
            ({ wet: 'Mokro', dry: 'Suho', unknown: 'Neznane' } as Record<string, string>)[
              claim.conditions
            ] || claim.conditions,
        },
      ],
      links: [],
      related: [entityKey(entityById.get(claim.entity_id))],
    })
  for (const entry of entries)
    if (entry.entityId) {
      entry.related.push(
        ...entries
          .filter((e) => e.entityId === entry.entityId && e.id !== entry.id)
          .map((e) => e.id),
      )
      entry.related = [...new Set(entry.related)].filter((id) => id !== entry.id)
    }
  // Only explicitly shared snapshots are public. Private transcripts are never queried.
  const service = brainService(event)
  for (let offset = 0; ; offset += 500) {
    const result = await service
      .from('brain_shared_conversations')
      .select('id,title,content,created_at')
      .order('id')
      .range(offset, offset + 499)
    brainCheck(result.error)
    for (const row of result.data || [])
      entries.push({
        id: `shared:${row.id}`,
        title: row.title,
        kind: 'conversation',
        origin: 'conversation',
        topic: knowledgeTopic(row.title + ' ' + row.content),
        excerpt: row.content,
        sections: [],
        facts: [{ label: 'Deljeno', value: row.created_at }],
        links: [{ label: 'Odpri deljeni posnetek', url: `/mozgan/pogovor/${row.id}` }],
        related: [],
      })
    if ((result.data?.length || 0) < 500) break
  }
  return { entries: entries as KnowledgeEntry[], updatedAt: new Date().toISOString() }
})
