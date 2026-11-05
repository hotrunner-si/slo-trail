-- Forum is served by authenticated Nuxt endpoints. No account identifiers are exposed
-- through the Data API. The service key remains server-only; every request checks identity.
create table public.brain_forum_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check(length(author_name) between 1 and 80),
  type text not null check(type in ('question','discussion','source')),
  topic text not null check(topic in ('races','routes','people','training','gear','nutrition','health','beginners','other')),
  title text not null check(length(title) between 5 and 160),
  body text not null check(length(body) between 20 and 5000),
  related_key text check(length(related_key)<=200),
  year integer check(year between 1900 and 2200),
  conditions text not null default '' check(length(conditions)<=200),
  created_at timestamptz not null default now(),
  activity_at timestamptz not null default now(),
  revision integer not null default 1,
  reply_count integer not null default 0 check(reply_count>=0),
  accepted_post_id uuid,
  hidden boolean not null default false,
  summary jsonb,
  summary_revision integer,
  summary_at timestamptz,
  shared_id uuid references public.brain_shared_conversations(id) on delete set null,
  search tsvector generated always as (to_tsvector('simple',title||' '||body)) stored
);
create table public.brain_forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.brain_forum_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check(length(author_name) between 1 and 80),
  body text not null check(length(body) between 10 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hidden boolean not null default false
);
alter table public.brain_forum_threads add constraint brain_forum_accepted_post
  foreign key(accepted_post_id) references public.brain_forum_posts(id) on delete set null;
create table public.brain_forum_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null references public.brain_forum_threads(id) on delete cascade,
  seen_revision integer not null default 0,
  created_at timestamptz not null default now(),
  primary key(user_id,thread_id)
);
create index brain_forum_threads_activity on public.brain_forum_threads(hidden,activity_at desc,id);
create index brain_forum_threads_owner on public.brain_forum_threads(user_id);
create index brain_forum_threads_related on public.brain_forum_threads(related_key);
create index brain_forum_threads_search on public.brain_forum_threads using gin(search);
create index brain_forum_threads_shared on public.brain_forum_threads(shared_id);
create index brain_forum_threads_accepted on public.brain_forum_threads(accepted_post_id);
create index brain_forum_posts_thread on public.brain_forum_posts(thread_id,created_at,id);
create index brain_forum_posts_owner on public.brain_forum_posts(user_id);
create index brain_forum_follows_thread on public.brain_forum_follows(thread_id);

alter table public.brain_forum_threads enable row level security;
alter table public.brain_forum_posts enable row level security;
alter table public.brain_forum_follows enable row level security;
revoke all on public.brain_forum_threads,public.brain_forum_posts,public.brain_forum_follows from public,anon,authenticated;
grant all on public.brain_forum_threads,public.brain_forum_posts,public.brain_forum_follows to service_role;
comment on table public.brain_forum_threads is 'Server-only forum storage. Authenticated Nuxt APIs omit auth IDs and enforce owner/admin mutations. AI summaries are unverified community material.';

-- A content change immediately withdraws the old chat snapshot. Its summary stays
-- available for review but is never displayed as current or republished until regenerated.
create function brain_private.forum_thread_change() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='DELETE' then
    delete from public.brain_shared_conversations where id=old.shared_id;
    return old;
  end if;
  if (new.title,new.body,new.hidden,new.accepted_post_id,new.topic,new.related_key,new.year,new.conditions)
    is distinct from (old.title,old.body,old.hidden,old.accepted_post_id,old.topic,old.related_key,old.year,old.conditions) then
    new.revision:=old.revision+1;
    new.activity_at:=clock_timestamp();
  end if;
  if new.revision<>old.revision then
    delete from public.brain_shared_conversations where id=old.shared_id;
    new.shared_id:=null;
  end if;
  return new;
end $$;
create trigger brain_forum_thread_change before update or delete on public.brain_forum_threads
for each row execute function brain_private.forum_thread_change();

create function brain_private.forum_post_change() returns trigger
language plpgsql security invoker set search_path='' as $$
declare target uuid;
begin
  target:=case when tg_op='DELETE' then old.thread_id else new.thread_id end;
  -- Serialize changes on the parent before recounting visible replies.
  perform 1 from public.brain_forum_threads where id=target for update;
  update public.brain_forum_threads set
    reply_count=(select count(*) from public.brain_forum_posts where thread_id=target and not hidden),
    revision=revision+1,activity_at=clock_timestamp(),
    accepted_post_id=case when accepted_post_id in
      (select id from public.brain_forum_posts where thread_id=target and not hidden)
      then accepted_post_id else null end
  where id=target;
  return null;
end $$;
create trigger brain_forum_post_change after insert or update or delete on public.brain_forum_posts
for each row execute function brain_private.forum_post_change();

-- Atomically publish a reviewed summary through the existing, explicitly labelled
-- shared-conversation retrieval path. It never becomes an official/editorial fact.
create function public.brain_forum_publish(p_thread uuid,p_revision integer,p_actor uuid,p_content text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare t public.brain_forum_threads; shared uuid;
begin
  if not exists(select 1 from public.brain_admins where user_id=p_actor) then raise exception 'Admin required'; end if;
  select * into strict t from public.brain_forum_threads where id=p_thread for update;
  if t.hidden or t.revision<>p_revision or t.summary_revision<>t.revision or t.summary is null then
    raise exception 'Summary changed; refresh before publishing';
  end if;
  delete from public.brain_shared_conversations where id=t.shared_id;
  insert into public.brain_shared_conversations(user_id,title,content)
    values(t.user_id,t.title,p_content) returning id into shared;
  update public.brain_forum_threads set shared_id=shared where id=t.id;
  return shared;
end $$;
revoke all on function brain_private.forum_thread_change(),brain_private.forum_post_change() from public,anon,authenticated;
revoke all on function public.brain_forum_publish(uuid,integer,uuid,text) from public,anon,authenticated;
grant execute on function public.brain_forum_publish(uuid,integer,uuid,text) to service_role;
