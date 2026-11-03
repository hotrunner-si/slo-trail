create function public.brain_finalize_pending(p_id uuid,p_summary text,p_statement text) returns void language plpgsql security invoker set search_path='' as $$
declare j public.brain_pending_experiences; c uuid; begin
 if current_user<>'service_role' then raise exception 'Server only'; end if;
 select * into strict j from public.brain_pending_experiences where id=p_id for update;
 if j.status<>'queued' then return; end if;
 if length(p_summary) not between 1 and 1800 or length(p_statement) not between 5 and 1000 then raise exception 'Invalid extraction'; end if;
 insert into public.brain_claims(entity_id,statement,year,conditions) values(j.entity_id,p_statement,j.year,j.conditions) on conflict do nothing returning id into c;
 if c is null then select id into strict c from public.brain_claims where entity_id=j.entity_id and year=j.year and conditions=j.conditions and md5(lower(trim(statement)))=md5(lower(trim(p_statement))); end if;
 insert into public.brain_contributions(user_id,claim_id,stance,direct_experience) values(j.user_id,c,'support',true) on conflict(user_id,claim_id) do nothing;
 insert into public.brain_questions(entity_id,claim_id,prompt) values(j.entity_id,c,'Ali se tvoja neposredna izkušnja ujema s to ugotovitvijo: »'||p_statement||'«? Upoštevaj navedeno leto in razmere.') on conflict do nothing;
 update public.brain_answers set claim_id=c where user_id=j.user_id and question_id=j.question_id;
 update public.brain_summaries set summary=p_summary where id=j.summary_id;
 update public.brain_pending_experiences set status='done' where id=p_id;
end $$;
revoke all on function public.brain_finalize_pending(uuid,text,text) from public,anon,authenticated;
grant execute on function public.brain_finalize_pending(uuid,text,text) to service_role;
-- Only an explicitly authenticated session may see the most recent five summaries.
-- API access to individual author IDs never appears in knowledge/search responses.
create index brain_pending_owner_state on public.brain_pending_experiences(user_id,status);
create index brain_route_owner_state on public.brain_route_reviews(user_id,status);
create index brain_questions_active on public.brain_questions(entity_id,created_at,id) where active;
