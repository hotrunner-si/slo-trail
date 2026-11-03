create index brain_entities_distance_ref on public.brain_entities(race_slug,distance_id);
-- Exclusions live only in the caller's browser memory in no-save mode.
create function brain_private.next_question_excluding(p_exclude uuid[]) returns jsonb language plpgsql security definer set search_path='' as $$
declare q record; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if cardinality(p_exclude)>100 then raise exception 'Too many exclusions'; end if;
 select x.id,x.entity_id,x.prompt,x.claim_id,e.title,c.year,c.conditions into q
 from public.brain_questions x join public.brain_entities e on e.id=x.entity_id left join public.brain_claims c on c.id=x.claim_id
 where x.active and (c.id is null or c.status='active') and not (x.id=any(coalesce(p_exclude,'{}'::uuid[])))
 and not exists(select 1 from public.brain_answers a where a.user_id=auth.uid() and a.question_id=x.id)
 and not exists(select 1 from public.brain_contributions a where a.user_id=auth.uid() and a.claim_id=x.claim_id)
 order by case when exists(select 1 from public.brain_answers a join public.brain_questions old on old.id=a.question_id where a.user_id=auth.uid() and old.entity_id=x.entity_id and a.choice='experience') then 0 else 1 end,
 case when x.claim_id is not null then 0 else 1 end,
 (select count(*) from public.brain_contributions v where v.claim_id=x.claim_id),x.created_at,x.id limit 1;
 if q.id is null then return null; end if;
 return to_jsonb(q);
end $$;
create function public.brain_next_question_excluding(p_exclude uuid[]) returns jsonb language sql security invoker set search_path='' as $$select brain_private.next_question_excluding(p_exclude)$$;
revoke all on function brain_private.next_question_excluding(uuid[]) from public,anon;
revoke all on function public.brain_next_question_excluding(uuid[]) from public,anon;
grant execute on function brain_private.next_question_excluding(uuid[]) to authenticated;
grant execute on function public.brain_next_question_excluding(uuid[]) to authenticated;
create or replace function brain_private.next_question() returns jsonb language sql security definer set search_path='' as $$ select brain_private.next_question_excluding('{}'::uuid[]) $$;
