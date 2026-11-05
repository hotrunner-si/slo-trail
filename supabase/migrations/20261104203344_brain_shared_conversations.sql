create table public.brain_shared_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check(length(title) between 3 and 160),
  content text not null check(length(content) between 20 and 11000 and octet_length(content)<=32000),
  created_at timestamptz not null default now(),
  search tsvector generated always as (to_tsvector('simple',title || ' ' || content)) stored
);
alter table public.brain_shared_conversations enable row level security;
revoke all on public.brain_shared_conversations from anon,authenticated;
grant select,insert,delete on public.brain_shared_conversations to authenticated;
grant all on public.brain_shared_conversations to service_role;
create policy "Owners see their shared conversations" on public.brain_shared_conversations for select to authenticated using ((select auth.uid())=user_id);
create policy "Owners explicitly share conversations" on public.brain_shared_conversations for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Owners withdraw conversations" on public.brain_shared_conversations for delete to authenticated using ((select auth.uid())=user_id);
create index brain_shared_conversations_search on public.brain_shared_conversations using gin(search);
create index brain_shared_conversations_owner on public.brain_shared_conversations(user_id,created_at desc);
comment on table public.brain_shared_conversations is 'Explicitly shared, user-reviewed chat snapshots. Unverified discussion including AI text; never official facts. Author identity is not exposed by public endpoints.';
