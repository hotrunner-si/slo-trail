-- Schema snapshot. Applied remotely through the Supabase migration tool.
-- Original catalog properties are preserved in data; structural links are foreign keys.
create table public.runners (
  slug text primary key,
  position integer not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  name text generated always as (data->>'name') stored,
  updated_at timestamptz not null default now(),
  check (data->>'slug' = slug)
);
create table public.races (
  slug text primary key,
  position integer not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  name text generated always as (data->>'name') stored,
  country text generated always as (data->>'country') stored,
  updated_at timestamptz not null default now(),
  check (data->>'slug' = slug)
);
create table public.race_distances (
  race_slug text not null references public.races(slug),
  id text not null,
  position integer not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  primary key (race_slug, id),
  unique (race_slug, position)
);
create table public.race_entrants (
  race_slug text not null,
  runner_slug text not null references public.runners(slug),
  distance_id text not null,
  primary key (race_slug, runner_slug, distance_id),
  foreign key (race_slug, distance_id) references public.race_distances(race_slug, id)
);
create index race_entrants_runner_idx on public.race_entrants(runner_slug);
create index race_entrants_distance_idx on public.race_entrants(race_slug, distance_id);
create table public.trail_routes (
  slug text primary key,
  runner_slug text not null references public.runners(slug),
  position integer not null,
  is_demo boolean not null default false,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  check (data->>'slug' = slug)
);
create index trail_routes_runner_idx on public.trail_routes(runner_slug);
create table public.runner_tours (
  runner_slug text not null references public.runners(slug),
  id text not null,
  position integer not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  primary key (runner_slug, id),
  unique (runner_slug, position)
);
create table public.articles (
  slug text primary key,
  position integer not null,
  related_race text references public.races(slug),
  related_runner text references public.runners(slug),
  related_route text references public.trail_routes(slug),
  contains_demo boolean not null default false,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  title text generated always as (data->>'title') stored,
  updated_at timestamptz not null default now(),
  check (data->>'slug' = slug)
);
create index articles_race_idx on public.articles(related_race);
create index articles_runner_idx on public.articles(related_runner);
create index articles_route_idx on public.articles(related_route);
create table public.article_sources (
  article_slug text not null references public.articles(slug),
  position integer not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  primary key (article_slug, position)
);
create table public.article_quotes (
  article_slug text not null references public.articles(slug),
  position integer not null,
  runner_slug text references public.runners(slug),
  is_demo boolean not null default false,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  primary key (article_slug, position)
);
create index article_quotes_runner_idx on public.article_quotes(runner_slug);
create table public.article_result_groups (
  article_slug text not null references public.articles(slug),
  position integer not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  primary key (article_slug, position)
);
create table public.article_result_rows (
  article_slug text not null,
  group_position integer not null,
  position integer not null,
  runner_slug text references public.runners(slug),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  primary key (article_slug, group_position, position),
  foreign key (article_slug, group_position) references public.article_result_groups(article_slug, position)
);
create index article_result_rows_runner_idx on public.article_result_rows(runner_slug);
create table public.race_hero_photos (
  race_slug text primary key references public.races(slug),
  data jsonb not null check (jsonb_typeof(data) = 'object')
);
create table public.runner_photos (
  runner_slug text not null references public.runners(slug),
  file text not null,
  position integer not null,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  primary key (runner_slug, file)
);
create table public.site_content (
  key text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
create table public.media_assets (
  path text primary key,
  storage_path text not null unique,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text not null check (length(sha256) = 64),
  content_type text not null,
  uploaded_at timestamptz
);

-- Public content is readable; visitors cannot create or edit any content.
do $$
declare table_name text;
begin
  foreach table_name in array array['runners','races','race_distances','race_entrants','trail_routes','runner_tours','articles','article_sources','article_quotes','article_result_groups','article_result_rows','race_hero_photos','runner_photos','site_content','media_assets'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to anon, authenticated', table_name);
    execute format('grant all on public.%I to service_role', table_name);
    execute format('create policy public_read on public.%I for select to anon, authenticated using (true)', table_name);
  end loop;
end $$;

create function public.content_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger runners_updated_at before update on public.runners for each row execute function public.content_updated_at();
create trigger races_updated_at before update on public.races for each row execute function public.content_updated_at();
create trigger articles_updated_at before update on public.articles for each row execute function public.content_updated_at();
create trigger site_content_updated_at before update on public.site_content for each row execute function public.content_updated_at();

create function public.get_site_content() returns jsonb
language sql stable security invoker set search_path = '' as $$
select jsonb_build_object(
 'runners', coalesce((select jsonb_agg(data order by position) from public.runners), '[]'::jsonb),
 'races', coalesce((select jsonb_agg(
   r.data || jsonb_build_object('distances', coalesce((select jsonb_agg(d.data order by d.position) from public.race_distances d where d.race_slug = r.slug), '[]'::jsonb))
   || case when exists(select 1 from public.race_entrants e where e.race_slug = r.slug) then jsonb_build_object('entrants', (select jsonb_agg(jsonb_build_object('runnerSlug', e.runner_slug, 'distanceId', e.distance_id) order by e.runner_slug, e.distance_id) from public.race_entrants e where e.race_slug = r.slug)) else '{}'::jsonb end
   order by r.position) from public.races r), '[]'::jsonb),
 'trailRoutes', coalesce((select jsonb_agg(data order by position) from public.trail_routes), '[]'::jsonb),
 'runnerGpxRoutes', coalesce((select jsonb_object_agg(runner_slug, tours) from (select runner_slug, jsonb_agg(data order by position) tours from public.runner_tours group by runner_slug) t), '{}'::jsonb),
 'articles', coalesce((select jsonb_agg(a.data
   || case when exists(select 1 from public.article_sources s where s.article_slug=a.slug) then jsonb_build_object('sources',(select jsonb_agg(s.data order by s.position) from public.article_sources s where s.article_slug=a.slug)) else '{}'::jsonb end
   || case when exists(select 1 from public.article_quotes q where q.article_slug=a.slug) then jsonb_build_object('quotes',(select jsonb_agg(q.data order by q.position) from public.article_quotes q where q.article_slug=a.slug)) else '{}'::jsonb end
   || case when exists(select 1 from public.article_result_groups g where g.article_slug=a.slug) then jsonb_build_object('results',(select jsonb_agg(g.data || jsonb_build_object('rows',coalesce((select jsonb_agg(v.data order by v.position) from public.article_result_rows v where v.article_slug=g.article_slug and v.group_position=g.position),'[]'::jsonb)) order by g.position) from public.article_result_groups g where g.article_slug=a.slug)) else '{}'::jsonb end
   order by a.position) from public.articles a), '[]'::jsonb),
 'raceHeroPhotos', coalesce((select jsonb_object_agg(race_slug,data) from public.race_hero_photos), '{}'::jsonb),
 'runnerPhotos', coalesce((select jsonb_agg(data order by position) from public.runner_photos), '[]'::jsonb),
 'siteContent', coalesce((select jsonb_object_agg(key,data) from public.site_content), '{}'::jsonb)
);
$$;
revoke all on function public.get_site_content() from public;
grant execute on function public.get_site_content() to anon, authenticated, service_role;
comment on table public.trail_routes is 'Legacy demonstration routes. is_demo=true must be excluded from factual knowledge retrieval.';
comment on table public.article_quotes is 'Original quotes preserved, including explicitly fictional demos marked is_demo=true.';
comment on table public.media_assets is 'Storage inventory with SHA-256 verification; binary content lives in site-assets Storage bucket.';
