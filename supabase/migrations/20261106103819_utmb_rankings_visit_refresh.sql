-- Persist public UTMB data; only the trusted server may access this cache.
create table public.utmb_rankings_cache (
  key text primary key check (key ~ '^(world-(H|F)-(general|20k|50k|100k|100m)|slovenia-(H|F)-general)$'),
  payload jsonb,
  fetched_at timestamptz,
  slot date,
  lease_token uuid,
  lease_slot date,
  lease_until timestamptz,
  constraint utmb_payload_object check (payload is null or (jsonb_typeof(payload) = 'object' and jsonb_typeof(payload->'runners') = 'array'))
);
alter table public.utmb_rankings_cache enable row level security;
revoke all on public.utmb_rankings_cache from public, anon, authenticated;
grant select, insert, update, delete on public.utmb_rankings_cache to service_role;

-- Subtract four LOCAL hours before choosing the latest Tuesday or Saturday.
-- This keeps the 04:00 boundary correct in winter and summer.
create function public.utmb_refresh_slot(p_at timestamptz default now())
returns date language sql stable security invoker set search_path = ''
as $$
  with local_day as (
    select ((p_at at time zone 'Europe/Ljubljana') - interval '4 hours')::date as day
  )
  select day - least(
    (extract(dow from day)::int + 7 - 2) % 7,
    (extract(dow from day)::int + 7 - 6) % 7
  ) from local_day;
$$;

-- Row-level atomic lease prevents simultaneous Netlify instances from refreshing
-- the same list. A crashed/failed refresh can retry after the lease expires.
create function public.claim_utmb_refresh(p_key text, p_token uuid)
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare
  due date := public.utmb_refresh_slot();
  affected integer;
begin
  insert into public.utmb_rankings_cache as c (key, lease_token, lease_slot, lease_until)
  values (p_key, p_token, due, now() + interval '2 minutes')
  on conflict (key) do update
    set lease_token = excluded.lease_token,
        lease_slot = excluded.lease_slot,
        lease_until = excluded.lease_until
    where (c.slot is null or c.slot < due)
      and (c.lease_until is null or c.lease_until < now());
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

create function public.finish_utmb_refresh(p_key text, p_token uuid, p_payload jsonb)
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare affected integer;
begin
  if p_payload is null
    or jsonb_typeof(p_payload->'runners') is distinct from 'array'
    or jsonb_array_length(p_payload->'runners') <> (case when p_key like 'world-%' then 25 else 100 end)
    or concat(p_payload->>'scope', '-', p_payload->>'sex', '-', p_payload->>'category') <> p_key
    or p_payload->>'fetchedAt' is null
  then raise exception 'Invalid UTMB ranking payload'; end if;
  update public.utmb_rankings_cache
  set payload = p_payload,
      fetched_at = (p_payload->>'fetchedAt')::timestamptz,
      slot = lease_slot,
      lease_token = null, lease_slot = null, lease_until = null
  where key = p_key and lease_token = p_token;
  get diagnostics affected = row_count;
  return affected = 1;
end;
$$;

revoke all on function public.utmb_refresh_slot(timestamptz) from public, anon, authenticated;
revoke all on function public.claim_utmb_refresh(text, uuid) from public, anon, authenticated;
revoke all on function public.finish_utmb_refresh(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.utmb_refresh_slot(timestamptz) to service_role;
grant execute on function public.claim_utmb_refresh(text, uuid) to service_role;
grant execute on function public.finish_utmb_refresh(text, uuid, jsonb) to service_role;
