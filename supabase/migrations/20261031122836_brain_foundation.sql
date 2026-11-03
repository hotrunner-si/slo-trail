-- Additive Možgan v1. No initial-content migration or inferred historic editions.
create schema if not exists brain_private;
revoke all on schema brain_private from public, anon;
grant usage on schema brain_private to authenticated, service_role;
create extension if not exists vector with schema extensions;

create table public.brain_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.brain_admins enable row level security;
revoke all on public.brain_admins from anon, authenticated;
create function brain_private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and exists(select 1 from public.brain_admins where user_id=auth.uid())
$$;
revoke all on function brain_private.is_admin() from public, anon;
grant execute on function brain_private.is_admin() to authenticated, service_role;

create table public.brain_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(display_name) between 2 and 100),
 bio text not null default '' check(length(bio)<=1500),
 region text not null default '' check(length(region)<=100),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 public_runner_slug text unique references public.runners(slug),
 created_at timestamptz not null default now()
);
create table public.brain_link_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 runner_slug text not null references public.runners(slug), note text not null check(length(note) between 10 and 1000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')), created_at timestamptz not null default now(),
 unique(user_id,runner_slug)
);
create table public.brain_runner_links (
 user_id uuid primary key references auth.users(id) on delete cascade, runner_slug text not null unique references public.runners(slug),
 approved_at timestamptz not null default now()
);
create table public.brain_files (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 slot integer not null check(slot between 1 and 4), kind text not null check(kind in ('gpx','image')),
 path text not null unique, name text not null check(length(name)<=180), bytes integer not null check(bytes between 1 and 5242880),
 details jsonb not null default '{}', created_at timestamptz not null default now(),
 check((slot between 1 and 3 and kind='gpx') or (slot=4 and kind='image')), unique(user_id,slot)
);
create table public.brain_file_cleanup (path text primary key, created_at timestamptz not null default now());
alter table public.brain_file_cleanup enable row level security;
revoke all on public.brain_file_cleanup from anon, authenticated;
create table public.brain_route_reviews (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 file_id uuid not null references public.brain_files(id) on delete cascade, file_path text not null,
 title text not null check(length(title) between 2 and 150), status text not null default 'pending' check(status in ('pending','approved','rejected','replaced')),
 created_at timestamptz not null default now(), unique(file_path)
);

-- Explicit typed subjects and relationships, including support for future editions/segments/results.
create table public.brain_entities (
 id uuid primary key default gen_random_uuid(), kind text not null check(kind in ('race','edition','distance','route','segment','runner','participation','result','article')),
 title text not null, race_slug text references public.races(slug), runner_slug text references public.runners(slug),
 article_slug text references public.articles(slug), distance_id text, year integer check(year between 1900 and 2200),
 legacy_key text unique, metadata jsonb not null default '{}',
 foreign key(race_slug,distance_id) references public.race_distances(race_slug,id)
);
create table public.brain_relations (
 subject_id uuid not null references public.brain_entities(id), object_id uuid not null references public.brain_entities(id),
 relation text not null check(relation in ('edition_of','distance_of','version_of','segment_of','participated_in','result_of','source_for')),
 primary key(subject_id,object_id,relation), check(subject_id<>object_id)
);
create index brain_relations_object on public.brain_relations(object_id);
create table public.brain_sources (
 id uuid primary key default gen_random_uuid(), entity_id uuid not null references public.brain_entities(id),
 title text not null, excerpt text not null, url text check(url is null or url ~ '^https?://'),
 origin text not null check(origin in ('official','editorial','unverified','community')),
 verified_at timestamptz, valid_from date, valid_until date,
 legacy_key text unique, embedding extensions.vector(1536), embedding_model text,
 search tsvector generated always as (to_tsvector('simple',title || ' ' || excerpt)) stored,
 check(valid_until is null or valid_from is null or valid_until>=valid_from)
);
create index brain_sources_entity on public.brain_sources(entity_id);
create index brain_sources_search on public.brain_sources using gin(search);
create index brain_entities_race on public.brain_entities(race_slug);
create index brain_entities_runner on public.brain_entities(runner_slug);
create index brain_entities_article on public.brain_entities(article_slug);

create table public.brain_categories (key text primary key, label text not null);
insert into public.brain_categories values ('single','Ena izkušnja'),('multiple','Več neodvisnih potrditev računov'),('conflicting','Nasprotujoče izkušnje'),('insufficient','Premalo podatkov');
create table public.brain_claims (
 id uuid primary key default gen_random_uuid(), entity_id uuid not null references public.brain_entities(id),
 statement text not null check(length(statement) between 5 and 1000), year integer check(year between 1900 and 2200),
 conditions text not null check(conditions in ('wet','dry','unknown')), segment_id uuid references public.brain_entities(id),
 source_id uuid references public.brain_sources(id), origin text not null default 'community' check(origin='community'),
 status text not null default 'active' check(status in ('active','hidden')), created_at timestamptz not null default now()
);
create index brain_claims_entity on public.brain_claims(entity_id);
create index brain_claims_source on public.brain_claims(source_id);
create index brain_claims_segment on public.brain_claims(segment_id);
create table public.brain_contributions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 claim_id uuid not null references public.brain_claims(id), stance text not null check(stance in ('support','oppose')),
 direct_experience boolean not null, created_at timestamptz not null default now(), unique(user_id,claim_id)
);
create index brain_contributions_claim on public.brain_contributions(claim_id);
create table public.brain_questions (
 id uuid primary key default gen_random_uuid(), entity_id uuid not null references public.brain_entities(id),
 claim_id uuid references public.brain_claims(id), prompt text not null, gap_key text unique, active boolean not null default true,
 created_at timestamptz not null default now()
);
create index brain_questions_entity on public.brain_questions(entity_id);
create index brain_questions_claim on public.brain_questions(claim_id);
create table public.brain_answers (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 question_id uuid not null references public.brain_questions(id),
 choice text not null check(choice in ('experience','support','oppose','no_experience','unknown','skip','different_context')),
 claim_id uuid references public.brain_claims(id), created_at timestamptz not null default now(), unique(user_id,question_id)
);
create index brain_answers_question on public.brain_answers(question_id);
create index brain_answers_claim on public.brain_answers(claim_id);
create table public.brain_summaries (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 summary text not null check(length(summary) between 1 and 1800), created_at timestamptz not null default now()
);
create index brain_summaries_owner_time on public.brain_summaries(user_id,created_at desc);
-- Content-free, aggregate statistics. No IP, question, answer, email, user ID or transcript.
create table public.brain_usage (
 day date not null default current_date, event text not null check(event in ('chat','question','search','no_save')),
 audience text not null check(audience in ('guest','account')), count bigint not null default 1,
 primary key(day,event,audience)
);

-- Existing editorial data are evidence of catalogue content, not newly verified official facts.
insert into public.brain_entities(kind,title,race_slug,legacy_key)
select 'race',name,slug,'race:'||slug from public.races;
insert into public.brain_entities(kind,title,race_slug,distance_id,legacy_key)
select 'distance',r.name||' · '||coalesce(d.data->>'label',d.id),d.race_slug,d.id,'distance:'||d.race_slug||':'||d.id
from public.race_distances d join public.races r on r.slug=d.race_slug;
insert into public.brain_entities(kind,title,runner_slug,legacy_key) select 'runner',name,slug,'runner:'||slug from public.runners;
insert into public.brain_entities(kind,title,article_slug,legacy_key) select 'article',title,slug,'article:'||slug from public.articles where not contains_demo;
insert into public.brain_relations select d.id,r.id,'distance_of' from public.brain_entities d join public.brain_entities r on r.race_slug=d.race_slug and r.kind='race' where d.kind='distance';
insert into public.brain_sources(entity_id,title,excerpt,url,origin,legacy_key)
select e.id,e.title,concat('Uredniški zapis kataloga. Datum: ',r.data->>'date','; stanje datuma: ',r.data->>'dateStatus','; opis: ',r.data->>'summary'),
case when r.data->>'sourceUrl' ~ '^https?://' then r.data->>'sourceUrl' end,'editorial',e.legacy_key
from public.brain_entities e join public.races r on r.slug=e.race_slug where e.kind='race';
insert into public.brain_sources(entity_id,title,excerpt,origin,legacy_key)
select e.id,e.title,'Uredniški zapis razdalje: '||d.data::text,'editorial',e.legacy_key
from public.brain_entities e join public.race_distances d on d.race_slug=e.race_slug and d.id=e.distance_id where e.kind='distance';
insert into public.brain_sources(entity_id,title,excerpt,origin,legacy_key)
select e.id,e.title,coalesce(a.data->>'description','Uredniški članek'),'editorial',e.legacy_key from public.brain_entities e join public.articles a on a.slug=e.article_slug where not a.contains_demo;
-- Genuine gap: no linked verified edition/route experience exists yet. Do not suggest an answer.
insert into public.brain_questions(entity_id,prompt,gap_key)
select e.id,'Ali imaš neposredno izkušnjo z '||e.title||'? Opiši en konkreten del ter navedi leto in mokre ali suhe razmere.','experience:'||e.id
from public.brain_entities e where e.kind='distance' and not exists(select 1 from public.brain_relations r where r.subject_id=e.id and r.relation='version_of');

-- Tables are read-only to clients; all state transitions use narrow, validated RPCs.
do $$ declare t text; begin
 foreach t in array array['brain_profiles','brain_link_requests','brain_runner_links','brain_files','brain_route_reviews','brain_entities','brain_relations','brain_sources','brain_categories','brain_claims','brain_contributions','brain_questions','brain_answers','brain_summaries','brain_usage'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 end loop;
 foreach t in array array['brain_profiles','brain_link_requests','brain_runner_links','brain_files','brain_route_reviews','brain_contributions','brain_answers'] loop
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy owner_read on public.%I for select to authenticated using (user_id=(select auth.uid()) or (select brain_private.is_admin()))',t);
 end loop;
 foreach t in array array['brain_entities','brain_relations','brain_sources','brain_categories','brain_claims'] loop
 execute format('grant select on public.%I to authenticated',t);
 execute format('create policy account_read on public.%I for select to authenticated using (true)',t);
 end loop;
end $$;
-- Summaries are deliberately only accessible through last-five RPC, never raw table access.

create function brain_private.account_state() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 return jsonb_build_object('admin',brain_private.is_admin(),
 'profile',(select to_jsonb(p) from public.brain_profiles p where user_id=auth.uid()),
 'link',(select to_jsonb(l) from public.brain_runner_links l where user_id=auth.uid()),
 'requests',coalesce((select jsonb_agg(l) from public.brain_link_requests l where user_id=auth.uid()),'[]'),
 'files',coalesce((select jsonb_agg(f) from public.brain_files f where user_id=auth.uid()),'[]'),
 'routes',coalesce((select jsonb_agg(r) from public.brain_route_reviews r where user_id=auth.uid()),'[]'),
 'summaries',coalesce((select jsonb_agg(s) from (select id,summary,created_at from public.brain_summaries where user_id=auth.uid() order by created_at desc,id desc limit 5)s),'[]'));
end $$;
create function public.brain_account() returns jsonb language sql security invoker set search_path='' as $$select brain_private.account_state()$$;

create function brain_private.profile_save(p_name text,p_bio text,p_region text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.brain_profiles where user_id=auth.uid() and public_runner_slug is not null) then raise exception 'Published profile changes require review'; end if;
 insert into public.brain_profiles(user_id,display_name,bio,region) values(auth.uid(),trim(p_name),trim(p_bio),trim(p_region))
 on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,region=excluded.region,status='pending';
end $$;
create function public.brain_profile_save(p_name text,p_bio text,p_region text) returns void language sql security invoker set search_path='' as $$select brain_private.profile_save(p_name,p_bio,p_region)$$;
create function brain_private.link_request(p_runner text,p_note text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.brain_link_requests(user_id,runner_slug,note) values(auth.uid(),p_runner,p_note);
end $$;
create function public.brain_link_request(p_runner text,p_note text) returns void language sql security invoker set search_path='' as $$select brain_private.link_request(p_runner,p_note)$$;

create function brain_private.next_question() returns jsonb language plpgsql security definer set search_path='' as $$
declare q record; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select x.id,x.entity_id,x.prompt,x.claim_id,e.title,c.year,c.conditions into q
 from public.brain_questions x join public.brain_entities e on e.id=x.entity_id left join public.brain_claims c on c.id=x.claim_id
 where x.active and (c.id is null or c.status='active')
 and not exists(select 1 from public.brain_answers a where a.user_id=auth.uid() and a.question_id=x.id)
 and not exists(select 1 from public.brain_contributions a where a.user_id=auth.uid() and a.claim_id=x.claim_id)
 order by case when exists(select 1 from public.brain_answers a join public.brain_questions old on old.id=a.question_id where a.user_id=auth.uid() and old.entity_id=x.entity_id and a.choice='experience') then 0 else 1 end,
 (select count(*) from public.brain_contributions v where v.claim_id=x.claim_id), x.claim_id nulls last,x.created_at,x.id limit 1;
 if q.id is null then return null; end if;
 return to_jsonb(q); -- No existing votes or other answers before answering.
end $$;
create function public.brain_next_question() returns jsonb language sql security invoker set search_path='' as $$select brain_private.next_question()$$;

create function brain_private.claim_counts(p_claim uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('contributions',count(*),'accounts',count(distinct user_id),
 'support',count(*) filter(where stance='support' and direct_experience),'oppose',count(*) filter(where stance='oppose' and direct_experience),
 'category',case when count(*) filter(where stance='support' and direct_experience)>0 and count(*) filter(where stance='oppose' and direct_experience)>0 then 'conflicting'
 when count(*) filter(where stance='support' and direct_experience)>=2 then 'multiple'
 when count(*) filter(where stance='support' and direct_experience)=1 then 'single' else 'insufficient' end)
 from public.brain_contributions where claim_id=p_claim
$$;
-- Answer RPC is also used by the server after validated AI extraction. No text from the client is published here.
create function brain_private.answer(p_question uuid,p_choice text) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.brain_questions; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into strict q from public.brain_questions where id=p_question and active;
 if p_choice in ('support','oppose','different_context') and q.claim_id is null then raise exception 'Not a verification question'; end if;
 if p_choice='experience' then raise exception 'Use structured experience submission'; end if;
 insert into public.brain_answers(user_id,question_id,choice,claim_id) values(auth.uid(),p_question,p_choice,q.claim_id);
 if p_choice in ('support','oppose') then
 insert into public.brain_contributions(user_id,claim_id,stance,direct_experience) values(auth.uid(),q.claim_id,p_choice,true);
 end if;
 return jsonb_build_object('counts',brain_private.claim_counts(q.claim_id),'statement',(select statement from public.brain_claims where id=q.claim_id));
end $$;
create function public.brain_answer(p_question uuid,p_choice text) returns jsonb language sql security invoker set search_path='' as $$select brain_private.answer(p_question,p_choice)$$;

-- Only trusted server may persist AI-validated, anonymized extraction. Role is not user metadata.
create function public.brain_store_experience(p_user uuid,p_entity uuid,p_summary text,p_statement text,p_year integer,p_conditions text,p_question uuid default null) returns uuid
language plpgsql security invoker set search_path='' as $$
declare c uuid; begin
 if current_user<>'service_role' then raise exception 'Server only'; end if;
 perform 1 from public.brain_entities where id=p_entity and kind in ('race','edition','distance','route','segment');
 if not found then raise exception 'Invalid subject'; end if;
 if p_question is not null and not exists(select 1 from public.brain_questions where id=p_question and entity_id=p_entity and active) then raise exception 'Invalid question'; end if;
 insert into public.brain_summaries(user_id,summary) values(p_user,p_summary);
 if p_statement is not null then
 insert into public.brain_claims(entity_id,statement,year,conditions) values(p_entity,p_statement,p_year,p_conditions) returning id into c;
 insert into public.brain_contributions(user_id,claim_id,stance,direct_experience) values(p_user,c,'support',true);
 insert into public.brain_questions(entity_id,claim_id,prompt) values(p_entity,c,'Ali se tvoja neposredna izkušnja ujema s to ugotovitvijo: »'||p_statement||'«? Upoštevaj navedeno leto in razmere.');
 end if;
 if p_question is not null then insert into public.brain_answers(user_id,question_id,choice,claim_id) values(p_user,p_question,'experience',c); end if;
 return c;
end $$;
revoke all on function public.brain_store_experience(uuid,uuid,text,text,integer,text,uuid) from public,anon,authenticated;
grant execute on function public.brain_store_experience(uuid,uuid,text,text,integer,text,uuid) to service_role;

create function brain_private.search_sources(p_query text,p_vector extensions.vector(1536) default null) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if length(p_query)>300 then raise exception 'Query too long'; end if;
 return coalesce((select jsonb_agg(t) from (
 select s.id,s.entity_id,s.title,s.excerpt,s.url,s.origin,s.verified_at,s.valid_from,s.valid_until,
 e.kind,e.race_slug,e.distance_id,e.article_slug,
 case when p_vector is not null and s.embedding is not null then 1-(s.embedding OPERATOR(extensions.<=>) p_vector) else null end as similarity
 from public.brain_sources s join public.brain_entities e on e.id=s.entity_id
 where p_query='' or s.search @@ websearch_to_tsquery('simple',p_query) or s.title ilike '%'||p_query||'%'
 or (p_vector is not null and s.embedding is not null and (s.embedding OPERATOR(extensions.<=>) p_vector)<0.8)
 order by case when p_vector is not null and s.embedding is not null then s.embedding OPERATOR(extensions.<=>) p_vector else 2 end,
 ts_rank(s.search,websearch_to_tsquery('simple',p_query)) desc,s.title limit 60)t),'[]');
end $$;
create function public.brain_search(p_query text,p_vector extensions.vector(1536) default null) returns jsonb language sql security invoker set search_path='' as $$ select brain_private.search_sources(p_query,p_vector) $$;

create function brain_private.moderate(p_kind text,p_id uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare p public.brain_profiles; l public.brain_link_requests; s text; begin
 if not brain_private.is_admin() then raise exception 'Admin required'; end if;
 if p_kind='profile' then
 select * into strict p from public.brain_profiles where user_id=p_id for update;
 if p_action in ('approve','reject') then update public.brain_profiles set status=case when p_action='approve' then 'approved' else 'rejected' end where user_id=p_id;
 elsif p_action='publish' and p.status='approved' and p.public_runner_slug is null then
 s:='skupnost-'||replace(p.user_id::text,'-','');
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
create function public.brain_moderate(p_kind text,p_id uuid,p_action text) returns void language sql security invoker set search_path='' as $$select brain_private.moderate(p_kind,p_id,p_action)$$;

create function public.brain_commit_file(p_user uuid,p_slot integer,p_path text,p_expected text,p_name text,p_bytes integer,p_details jsonb) returns text language plpgsql security invoker set search_path='' as $$
declare old_path text; begin
 if current_user<>'service_role' then raise exception 'Server only'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if p_path not like p_user::text||'/%' or not exists(select 1 from storage.objects where bucket_id='brain-private' and name=p_path) then raise exception 'Invalid uploaded object'; end if;
 select path into old_path from public.brain_files where user_id=p_user and slot=p_slot for update;
 if old_path is distinct from p_expected then raise exception 'File changed; reload first'; end if;
 update public.brain_route_reviews set status='replaced' where file_path=old_path;
 insert into public.brain_files(user_id,slot,kind,path,name,bytes,details) values(p_user,p_slot,case when p_slot=4 then 'image' else 'gpx' end,p_path,p_name,p_bytes,p_details)
 on conflict(user_id,slot) do update set path=excluded.path,name=excluded.name,bytes=excluded.bytes,details=excluded.details,created_at=now();
 if old_path is not null then insert into public.brain_file_cleanup(path) values(old_path) on conflict do nothing; end if;
 return old_path;
end $$;
revoke all on function public.brain_commit_file(uuid,integer,text,text,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.brain_commit_file(uuid,integer,text,text,text,integer,jsonb) to service_role;
create function brain_private.route_request(p_file uuid,p_title text) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.brain_route_reviews(user_id,file_id,file_path,title) select auth.uid(),id,path,p_title from public.brain_files where id=p_file and user_id=auth.uid() and kind='gpx';
 if not found then raise exception 'GPX not found'; end if;
end $$;
create function public.brain_route_request(p_file uuid,p_title text) returns void language sql security invoker set search_path='' as $$select brain_private.route_request(p_file,p_title)$$;
create function public.brain_track(p_event text,p_audience text) returns void language sql security invoker set search_path='' as $$
 insert into public.brain_usage(day,event,audience) values(current_date,p_event,p_audience) on conflict(day,event,audience) do update set count=public.brain_usage.count+1
$$;
revoke all on function public.brain_track(text,text) from public,anon,authenticated;
grant execute on function public.brain_track(text,text) to service_role;

-- Explicit function privileges; default PUBLIC execution is removed.
do $$ declare r record; begin
 for r in select p.oid::regprocedure as fn from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='brain_private' loop
 execute format('revoke all on function %s from public, anon',r.fn);
 execute format('grant execute on function %s to authenticated, service_role',r.fn);
 end loop;
 for r in select p.oid::regprocedure as fn from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('brain_account','brain_profile_save','brain_link_request','brain_next_question','brain_answer','brain_search','brain_moderate','brain_route_request') loop
 execute format('revoke all on function %s from public, anon',r.fn);
 execute format('grant execute on function %s to authenticated',r.fn);
 end loop;
end $$;
-- Internal aggregate is not a client API; it is called only from trusted functions.
revoke execute on function brain_private.claim_counts(uuid) from authenticated;
grant all on all tables in schema public to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('brain-private','brain-private',false,5242880,array['application/gpx+xml','image/jpeg','image/png','image/webp']);
-- No client write policies. Upload/replace is validated by the server and atomic metadata RPC.
create policy brain_file_read on storage.objects for select to authenticated using(bucket_id='brain-private' and exists(select 1 from public.brain_files f where f.path=name and (f.user_id=(select auth.uid()) or (select brain_private.is_admin()))));
