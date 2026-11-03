create function brain_private.search_filtered(p_query text,p_vector extensions.vector(1536),p_kind text,p_origin text,p_model text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(p_query)>300 then raise exception 'Query too long'; end if;
 return coalesce((select jsonb_agg(t) from (
 select s.id,s.entity_id,s.title,s.excerpt,s.url,s.origin,s.verified_at,s.valid_from,s.valid_until,e.kind,e.race_slug,e.distance_id,e.article_slug,
 case when p_vector is not null and s.embedding is not null and s.embedding_model=p_model then 1-(s.embedding OPERATOR(extensions.<=>) p_vector) else null end similarity
 from public.brain_sources s join public.brain_entities e on e.id=s.entity_id
 where (p_kind='' or e.kind=p_kind) and (p_origin='' or s.origin=p_origin)
 and (p_query='' or s.search @@ websearch_to_tsquery('simple',p_query) or s.title ilike '%'||p_query||'%'
 or (p_vector is not null and s.embedding is not null and s.embedding_model=p_model and (s.embedding OPERATOR(extensions.<=>) p_vector)<0.8))
 order by case when p_vector is not null and s.embedding is not null and s.embedding_model=p_model then s.embedding OPERATOR(extensions.<=>) p_vector else 2 end,
 ts_rank(s.search,websearch_to_tsquery('simple',p_query)) desc,s.title limit 60)t),'[]');
end $$;
create function public.brain_search_filtered(p_query text,p_vector extensions.vector(1536),p_kind text,p_origin text,p_model text) returns jsonb language sql security invoker set search_path='' as $$select brain_private.search_filtered(p_query,p_vector,p_kind,p_origin,p_model)$$;
revoke all on function brain_private.search_filtered(text,extensions.vector,text,text,text) from public,anon;
revoke all on function public.brain_search_filtered(text,extensions.vector,text,text,text) from public,anon;
grant execute on function brain_private.search_filtered(text,extensions.vector,text,text,text) to authenticated;
grant execute on function public.brain_search_filtered(text,extensions.vector,text,text,text) to authenticated;
create function brain_private.moderate_claim(p_id uuid,p_hidden boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not brain_private.is_admin() then raise exception 'Admin required'; end if;
 update public.brain_claims set status=case when p_hidden then 'hidden' else 'active' end where id=p_id;
 if not found then raise exception 'Claim not found'; end if;
end $$;
create function public.brain_moderate_claim(p_id uuid,p_hidden boolean) returns void language sql security invoker set search_path='' as $$select brain_private.moderate_claim(p_id,p_hidden)$$;
revoke all on function brain_private.moderate_claim(uuid,boolean) from public,anon;
revoke all on function public.brain_moderate_claim(uuid,boolean) from public,anon;
grant execute on function brain_private.moderate_claim(uuid,boolean) to authenticated;
grant execute on function public.brain_moderate_claim(uuid,boolean) to authenticated;
-- Public identifiers must not encode the private Auth account identifier.
create or replace function brain_private.moderate(p_kind text,p_id uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare p public.brain_profiles; l public.brain_link_requests; s text; begin
 if not brain_private.is_admin() then raise exception 'Admin required'; end if;
 if p_kind='profile' then
 select * into strict p from public.brain_profiles where user_id=p_id for update;
 if p_action in ('approve','reject') then update public.brain_profiles set status=case when p_action='approve' then 'approved' else 'rejected' end where user_id=p_id;
 elsif p_action='publish' and p.status='approved' and p.public_runner_slug is null then
 s:='skupnost-'||replace(gen_random_uuid()::text,'-','');
 insert into public.runners(slug,position,data) values(s,10000,jsonb_build_object('id',s,'slug',s,'name',p.display_name,'location',p.region,'bio',p.bio,'longDescription',p.bio,'quote','','image','','favouriteRouteSlugs','[]'::jsonb));
 update public.brain_profiles set public_runner_slug=s where user_id=p_id;
 else raise exception 'Invalid profile transition'; end if;
 elsif p_kind='link' and p_action in ('approve','reject') then
 select * into strict l from public.brain_link_requests where id=p_id and status='pending' for update;
 if p_action='approve' then insert into public.brain_runner_links(user_id,runner_slug) values(l.user_id,l.runner_slug); end if;
 update public.brain_link_requests set status=case when p_action='approve' then 'approved' else 'rejected' end where id=p_id;
 elsif p_kind='route' and p_action in ('approve','reject') then
 update public.brain_route_reviews r set status=case when p_action='approve' then 'approved' else 'rejected' end
 where r.id=p_id and status='pending' and exists(select 1 from public.brain_files f where f.id=r.file_id and f.path=r.file_path);
 if not found then raise exception 'Route was replaced'; end if;
 else raise exception 'Invalid action'; end if;
end $$;
