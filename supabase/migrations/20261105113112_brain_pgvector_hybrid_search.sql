-- pgvector already owns brain_sources.embedding vector(1536).
create index if not exists brain_sources_embedding_hnsw
on public.brain_sources using hnsw (embedding extensions.vector_cosine_ops);

-- Invoker rights preserve table RLS. Anonymous users never call this RPC;
-- public chat uses the trusted server with p_public_only=true.
create or replace function public.brain_hybrid_sources(
 p_query text, p_vector extensions.vector(1536), p_model text,
 p_kind text default '', p_origin text default '',
 p_public_only boolean default true, p_entity uuid default null
) returns jsonb language sql stable security invoker set search_path='' as $$
with eligible as not materialized (
 select s.*,e.kind,e.race_slug,e.distance_id,e.article_slug
 from public.brain_sources s join public.brain_entities e on e.id=s.entity_id
 where length(p_query)<=300
 and (p_kind='' or e.kind=p_kind) and (p_origin='' or s.origin=p_origin)
 and (not p_public_only or s.origin in('official','editorial'))
 and (p_entity is null or s.entity_id=p_entity or exists(
  select 1 from public.brain_relations r where
  (r.subject_id=p_entity and r.object_id=s.entity_id) or
  (r.object_id=p_entity and r.subject_id=s.entity_id)))
), terms as (
 select websearch_to_tsquery('simple',regexp_replace(trim(p_query),'\s+',' OR ','g')) q
), keyword as (
 select s.id,row_number() over(order by ts_rank_cd(s.search,t.q) desc,s.id) rank
 from eligible s cross join terms t where p_query<>'' and s.search @@ t.q
 order by rank limit 60
), semantic as (
 select s.id,row_number() over(order by s.embedding operator(extensions.<=>) p_vector,s.id) rank
 from eligible s where p_vector is not null and s.embedding is not null
 and s.embedding_model=p_model and s.embedding operator(extensions.<=>) p_vector<0.7
 order by s.embedding operator(extensions.<=>) p_vector,s.id limit 60
), fused as (
 select coalesce(k.id,v.id) id,
 coalesce(1.0/(20+k.rank),0)+coalesce(2.0/(20+v.rank),0) score
 from keyword k full join semantic v on k.id=v.id
), results as (
 select s.id,s.entity_id,s.title,s.excerpt,s.url,s.origin,s.verified_at,s.valid_from,s.valid_until,
 s.kind,s.race_slug,s.distance_id,s.article_slug,
 case when s.embedding_model=p_model and p_vector is not null
 then 1-(s.embedding operator(extensions.<=>) p_vector) else null end similarity,
 f.score hybrid_score
 from fused f join eligible s on s.id=f.id
 order by f.score desc,s.verified_at desc nulls last,s.id limit 60
)
select coalesce(jsonb_agg(results),'[]'::jsonb) from results
$$;
revoke all on function public.brain_hybrid_sources(text,extensions.vector,text,text,text,boolean,uuid) from public,anon;
grant execute on function public.brain_hybrid_sources(text,extensions.vector,text,text,text,boolean,uuid) to authenticated,service_role;

-- Changed text must never keep a stale embedding. The indexing writer also
-- compares title/excerpt so a concurrent edit cannot receive an old vector.
create or replace function brain_private.invalidate_source_embedding()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.title is distinct from old.title or new.excerpt is distinct from old.excerpt then
  new.embedding:=null; new.embedding_model:=null;
 end if;
 return new;
end $$;
revoke all on function brain_private.invalidate_source_embedding() from public,anon,authenticated;
create trigger brain_source_embedding_changed before update of title,excerpt on public.brain_sources
for each row execute function brain_private.invalidate_source_embedding();
