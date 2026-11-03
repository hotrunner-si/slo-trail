-- Evidence is explicit without exposing private summaries or authors to other accounts.
alter table public.brain_contributions add column summary_id uuid references public.brain_summaries(id) on delete set null;
alter table public.brain_contributions add column answer_id uuid references public.brain_answers(id) on delete set null;
create index brain_contribution_summary on public.brain_contributions(summary_id);
create index brain_contribution_answer on public.brain_contributions(answer_id);

create or replace function public.brain_store_experience(p_user uuid,p_entity uuid,p_summary text,p_statement text,p_year integer,p_conditions text,p_question uuid default null) returns uuid
language plpgsql security invoker set search_path='' as $$
declare c uuid; s uuid; a uuid; begin
 if current_user<>'service_role' then raise exception 'Server only'; end if;
 if not exists(select 1 from public.brain_entities where id=p_entity and kind in ('race','edition','distance','route','segment')) then raise exception 'Invalid subject'; end if;
 if p_question is not null and not exists(select 1 from public.brain_questions where id=p_question and entity_id=p_entity and active) then raise exception 'Invalid question'; end if;
 insert into public.brain_summaries(user_id,summary) values(p_user,p_summary) returning id into s;
 if p_statement is not null then
 if p_year is null or p_conditions not in ('wet','dry') then raise exception 'Clarification required'; end if;
 insert into public.brain_claims(entity_id,statement,year,conditions) values(p_entity,p_statement,p_year,p_conditions) on conflict do nothing returning id into c;
 if c is null then select id into strict c from public.brain_claims where entity_id=p_entity and year=p_year and conditions=p_conditions and md5(lower(trim(statement)))=md5(lower(trim(p_statement))); end if;
 insert into public.brain_questions(entity_id,claim_id,prompt) values(p_entity,c,'Ali se tvoja neposredna izkušnja ujema s to ugotovitvijo: »'||p_statement||'«? Upoštevaj navedeno leto in razmere.') on conflict do nothing;
 end if;
 if p_question is not null then insert into public.brain_answers(user_id,question_id,choice,claim_id) values(p_user,p_question,'experience',c) returning id into a; end if;
 if c is not null then insert into public.brain_contributions(user_id,claim_id,stance,direct_experience,summary_id,answer_id) values(p_user,c,'support',true,s,a) on conflict(user_id,claim_id) do nothing; end if;
 return c;
end $$;

create or replace function public.brain_finalize_pending(p_id uuid,p_summary text,p_statement text) returns void language plpgsql security invoker set search_path='' as $$
declare j public.brain_pending_experiences; c uuid; a uuid; begin
 if current_user<>'service_role' then raise exception 'Server only'; end if;
 select * into strict j from public.brain_pending_experiences where id=p_id for update;
 if j.status<>'queued' then return; end if;
 if length(p_summary) not between 1 and 1800 or length(p_statement) not between 5 and 1000 then raise exception 'Invalid extraction'; end if;
 insert into public.brain_claims(entity_id,statement,year,conditions) values(j.entity_id,p_statement,j.year,j.conditions) on conflict do nothing returning id into c;
 if c is null then select id into strict c from public.brain_claims where entity_id=j.entity_id and year=j.year and conditions=j.conditions and md5(lower(trim(statement)))=md5(lower(trim(p_statement))); end if;
 update public.brain_answers set claim_id=c where user_id=j.user_id and question_id=j.question_id returning id into a;
 insert into public.brain_contributions(user_id,claim_id,stance,direct_experience,summary_id,answer_id) values(j.user_id,c,'support',true,j.summary_id,a) on conflict(user_id,claim_id) do nothing;
 insert into public.brain_questions(entity_id,claim_id,prompt) values(j.entity_id,c,'Ali se tvoja neposredna izkušnja ujema s to ugotovitvijo: »'||p_statement||'«? Upoštevaj navedeno leto in razmere.') on conflict do nothing;
 update public.brain_summaries set summary=p_summary where id=j.summary_id;
 update public.brain_pending_experiences set status='done' where id=p_id;
end $$;

create or replace function brain_private.answer(p_question uuid,p_choice text) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.brain_questions; a uuid; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into strict q from public.brain_questions where id=p_question and active;
 if q.claim_id is not null and not exists(select 1 from public.brain_claims where id=q.claim_id and status='active') then raise exception 'Claim unavailable'; end if;
 if p_choice in ('support','oppose','different_context') and q.claim_id is null then raise exception 'Not a verification question'; end if;
 if p_choice='experience' then raise exception 'Use structured experience submission'; end if;
 insert into public.brain_answers(user_id,question_id,choice,claim_id) values(auth.uid(),p_question,p_choice,q.claim_id) returning id into a;
 if p_choice in ('support','oppose') then insert into public.brain_contributions(user_id,claim_id,stance,direct_experience,answer_id) values(auth.uid(),q.claim_id,p_choice,true,a); end if;
 return jsonb_build_object('counts',brain_private.claim_counts(q.claim_id),'statement',(select statement from public.brain_claims where id=q.claim_id));
end $$;
