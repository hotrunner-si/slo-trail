-- One retrieval contract for the knowledge list and chat: cosine nearest 25.
-- No keyword reranking or similarity cutoff that silently removes candidates.
create function public.brain_nearest_sources(
  p_vector extensions.vector(1536), p_model text,
  p_kind text default '', p_origin text default '',
  p_public_only boolean default true, p_entity uuid default null
) returns jsonb language sql stable security invoker set search_path='' as $$
select coalesce(jsonb_agg(matches order by matches.distance,matches.id),'[]'::jsonb)
from (
  select s.id,s.entity_id,s.title,s.excerpt,s.url,s.origin,s.verified_at,s.valid_from,s.valid_until,
    e.kind,e.race_slug,e.distance_id,e.article_slug,
    s.embedding operator(extensions.<=>) p_vector as distance,
    1-(s.embedding operator(extensions.<=>) p_vector) as similarity
  from public.brain_sources s join public.brain_entities e on e.id=s.entity_id
  where p_vector is not null and s.embedding is not null and s.embedding_model=p_model
    and (p_kind='' or e.kind=p_kind) and (p_origin='' or s.origin=p_origin)
    and (not p_public_only or s.origin in ('official','editorial'))
    and (p_entity is null or s.entity_id=p_entity or exists(
      select 1 from public.brain_relations r where
      (r.subject_id=p_entity and r.object_id=s.entity_id) or
      (r.object_id=p_entity and r.subject_id=s.entity_id)))
  order by s.embedding operator(extensions.<=>) p_vector,s.id limit 25
) matches
$$;
revoke all on function public.brain_nearest_sources(extensions.vector,text,text,text,boolean,uuid) from public,anon;
grant execute on function public.brain_nearest_sources(extensions.vector,text,text,text,boolean,uuid) to authenticated,service_role;
