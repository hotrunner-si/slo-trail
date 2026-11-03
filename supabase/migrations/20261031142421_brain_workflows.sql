-- Private structured input is a summary, not a conversation transcript.
create table public.brain_pending_experiences (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 entity_id uuid not null references public.brain_entities(id), question_id uuid not null references public.brain_questions(id),
 summary_id uuid not null references public.brain_summaries(id) on delete cascade,
 year integer not null check(year between 1900 and 2200), conditions text not null check(conditions in ('wet','dry')),
 status text not null default 'queued' check(status in ('queued','done','needs_clarification')), created_at timestamptz not null default now()
);
-- A question may be answered by many accounts, so uniqueness includes the account.
alter table public.brain_pending_experiences add unique(user_id,question_id);
create index brain_pending_entity on public.brain_pending_experiences(entity_id);
create index brain_pending_summary on public.brain_pending_experiences(summary_id);
create index brain_pending_question on public.brain_pending_experiences(question_id);
alter table public.brain_pending_experiences enable row level security;
revoke all on public.brain_pending_experiences from anon, authenticated;
grant all on public.brain_pending_experiences to service_role;
create function public.brain_store_private_experience(p_user uuid,p_entity uuid,p_question uuid,p_summary text,p_year integer,p_conditions text) returns void
language plpgsql security invoker set search_path='' as $$declare s uuid; begin
 if current_user<>'service_role' then raise exception 'Server only'; end if;
 if not exists(select 1 from public.brain_questions where id=p_question and entity_id=p_entity and active and claim_id is null) then raise exception 'Invalid question'; end if;
 if length(p_summary) not between 15 and 700 then raise exception 'Invalid summary'; end if;
 insert into public.brain_answers(user_id,question_id,choice) values(p_user,p_question,'experience');
 insert into public.brain_summaries(user_id,summary) values(p_user,p_summary) returning id into s;
 insert into public.brain_pending_experiences(user_id,entity_id,question_id,summary_id,year,conditions) values(p_user,p_entity,p_question,s,p_year,p_conditions);
end $$;
revoke all on function public.brain_store_private_experience(uuid,uuid,uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.brain_store_private_experience(uuid,uuid,uuid,text,integer,text) to service_role;

-- A normalized claim has one contribution per account, even across repeated submissions.
create unique index brain_claim_identity on public.brain_claims(entity_id,coalesce(year,0),conditions,md5(lower(trim(statement))));
create unique index brain_question_claim_unique on public.brain_questions(claim_id) where claim_id is not null;
create or replace function public.brain_store_experience(p_user uuid,p_entity uuid,p_summary text,p_statement text,p_year integer,p_conditions text,p_question uuid default null) returns uuid
language plpgsql security invoker set search_path='' as $$
declare c uuid; begin
 if current_user<>'service_role' then raise exception 'Server only'; end if;
 if not exists(select 1 from public.brain_entities where id=p_entity and kind in ('race','edition','distance','route','segment')) then raise exception 'Invalid subject'; end if;
 if p_question is not null and not exists(select 1 from public.brain_questions where id=p_question and entity_id=p_entity and active) then raise exception 'Invalid question'; end if;
 if p_statement is not null then
 if p_year is null or p_conditions not in ('wet','dry') then raise exception 'Clarification required'; end if;
 insert into public.brain_claims(entity_id,statement,year,conditions) values(p_entity,p_statement,p_year,p_conditions) on conflict do nothing returning id into c;
 if c is null then select id into strict c from public.brain_claims where entity_id=p_entity and year=p_year and conditions=p_conditions and md5(lower(trim(statement)))=md5(lower(trim(p_statement))); end if;
 insert into public.brain_contributions(user_id,claim_id,stance,direct_experience) values(p_user,c,'support',true) on conflict(user_id,claim_id) do nothing;
 insert into public.brain_questions(entity_id,claim_id,prompt) values(p_entity,c,'Ali se tvoja neposredna izkušnja ujema s to ugotovitvijo: »'||p_statement||'«? Upoštevaj navedeno leto in razmere.') on conflict do nothing;
 end if;
 insert into public.brain_summaries(user_id,summary) values(p_user,p_summary);
 if p_question is not null then insert into public.brain_answers(user_id,question_id,choice,claim_id) values(p_user,p_question,'experience',c); end if;
 return c;
end $$;
-- Hidden claims are never available to ordinary accounts.
alter policy account_read on public.brain_claims to authenticated using(status='active' or (select brain_private.is_admin()));
-- Explicit deny policies document intentional server/RPC-only access.
create policy server_only on public.brain_admins for all to authenticated using(false) with check(false);
create policy server_only on public.brain_file_cleanup for all to authenticated using(false) with check(false);
create policy rpc_only on public.brain_questions for all to authenticated using(false) with check(false);
create policy rpc_only on public.brain_summaries for all to authenticated using(false) with check(false);
create policy server_only on public.brain_usage for all to authenticated using(false) with check(false);
create policy server_only on public.brain_pending_experiences for all to authenticated using(false) with check(false);
create index brain_route_file on public.brain_route_reviews(file_id);
create index brain_profile_public_runner on public.brain_profiles(public_runner_slug);
create index brain_link_runner on public.brain_link_requests(runner_slug);
create index brain_runner_link_slug on public.brain_runner_links(runner_slug);
-- A definer helper is not a direct client aggregate endpoint.
revoke execute on function brain_private.claim_counts(uuid) from authenticated;
