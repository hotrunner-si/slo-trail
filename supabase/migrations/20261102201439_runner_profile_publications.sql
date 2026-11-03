-- Private publication records. Public routes contain only public media identifiers.
create table public.brain_runner_media (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 runner_slug text not null references public.runners(slug),
 file_id uuid not null unique references public.brain_files(id) on delete cascade,
 source_path text not null,
 kind text not null check(kind in ('image','gpx')),
 base_image text,
 created_at timestamptz not null default now()
);
create unique index brain_runner_media_image on public.brain_runner_media(runner_slug) where kind='image';
create index brain_runner_media_user on public.brain_runner_media(user_id);
create index brain_runner_media_runner on public.brain_runner_media(runner_slug);
alter table public.brain_runner_media enable row level security;
revoke all on public.brain_runner_media from anon,authenticated;
grant select on public.brain_runner_media to authenticated;
grant all on public.brain_runner_media to service_role;
create policy owner_read on public.brain_runner_media for select to authenticated
using(user_id=(select auth.uid()) or (select brain_private.is_admin()));
create table public.brain_public_media_cleanup(id uuid primary key,created_at timestamptz not null default now());
alter table public.brain_public_media_cleanup enable row level security;
revoke all on public.brain_public_media_cleanup from anon,authenticated;
grant all on public.brain_public_media_cleanup to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('runner-publications','runner-publications',false,10485760,array['application/gpx+xml','application/json','image/webp']);

-- Removing a publication also retracts its catalog entry and queues binary cleanup.
create function brain_private.retract_runner_media() returns trigger
language plpgsql security definer set search_path='' as $$begin
 if old.kind='gpx' then
   delete from public.runner_tours where runner_slug=old.runner_slug and id=old.id::text;
 else
   update public.runners set data=jsonb_set(data,'{image}',to_jsonb(coalesce(old.base_image,''))),updated_at=now()
   where slug=old.runner_slug and data->>'image'='/api/runner-media/'||old.id||'/image.webp';
 end if;
 insert into public.brain_public_media_cleanup(id) values(old.id) on conflict do nothing;
 return old;
end $$;
revoke all on function brain_private.retract_runner_media() from public,anon,authenticated;
create trigger brain_retract_runner_media before delete on public.brain_runner_media
for each row execute function brain_private.retract_runner_media();

create function public.brain_commit_publication(p_id uuid,p_user uuid,p_file uuid,p_expected text,p_data jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare f public.brain_files; s text; original_image text; pos integer;
begin
 if current_user<>'service_role' then raise exception 'Server only'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 select runner_slug into strict s from public.brain_runner_links where user_id=p_user for update;
 select * into strict f from public.brain_files where id=p_file and user_id=p_user and path=p_expected for share;
 if f.kind='gpx' and not exists(select 1 from public.brain_route_reviews where file_id=f.id and file_path=f.path and user_id=p_user and status='approved') then
   raise exception 'Approved route review required';
 end if;
 if not exists(select 1 from storage.objects where bucket_id='runner-publications' and name=p_id::text||case when f.kind='image' then '/image.webp' else '/detail.json' end) then
   raise exception 'Missing publication assets';
 end if;
 -- Serialize positions and image replacement across all publications for this runner.
 perform 1 from public.runners where slug=s for update;
 select coalesce(base_image,'') into original_image from public.brain_runner_media where runner_slug=s and kind='image';
 if original_image is null then select coalesce(data->>'image','') into original_image from public.runners where slug=s; end if;
 delete from public.brain_runner_media where file_id=f.id or (f.kind='image' and runner_slug=s and kind='image');
 insert into public.brain_runner_media(id,user_id,runner_slug,file_id,source_path,kind,base_image)
 values(p_id,p_user,s,f.id,f.path,f.kind,case when f.kind='image' then original_image else null end);
 if f.kind='image' then
   update public.runners set data=jsonb_set(data,'{image}',to_jsonb('/api/runner-media/'||p_id||'/image.webp')),updated_at=now() where slug=s;
 else
   select coalesce(max(position),0)+1 into pos from public.runner_tours where runner_slug=s;
   insert into public.runner_tours(runner_slug,id,position,data) values(s,p_id::text,pos,p_data||jsonb_build_object('id',p_id::text));
 end if;
end $$;
revoke all on function public.brain_commit_publication(uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.brain_commit_publication(uuid,uuid,uuid,text,jsonb) to service_role;

create function brain_private.remove_runner_media(p_id uuid) returns void
language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 delete from public.brain_runner_media where id=p_id and user_id=auth.uid();
 if not found then raise exception 'Publication not owned'; end if;
end $$;
create function public.brain_remove_runner_media(p_id uuid) returns void language sql security invoker set search_path='' as $$select brain_private.remove_runner_media(p_id)$$;
revoke all on function brain_private.remove_runner_media(uuid),public.brain_remove_runner_media(uuid) from public,anon;
grant execute on function brain_private.remove_runner_media(uuid),public.brain_remove_runner_media(uuid) to authenticated;

create function brain_private.delete_file(p_id uuid,p_expected text) returns void
language plpgsql security definer set search_path='' as $$declare old_path text; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select path into strict old_path from public.brain_files where id=p_id and user_id=auth.uid() and path=p_expected for update;
 delete from public.brain_route_reviews where file_id=p_id;
 delete from public.brain_files where id=p_id;
 insert into public.brain_file_cleanup(path) values(old_path) on conflict do nothing;
end $$;
create function public.brain_delete_file(p_id uuid,p_expected text) returns void language sql security invoker set search_path='' as $$select brain_private.delete_file(p_id,p_expected)$$;
revoke all on function brain_private.delete_file(uuid,text),public.brain_delete_file(uuid,text) from public,anon;
grant execute on function brain_private.delete_file(uuid,text),public.brain_delete_file(uuid,text) to authenticated;

create function brain_private.unlink_runner() returns void
language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 perform 1 from public.brain_runner_links where user_id=auth.uid() for update;
 if not found then raise exception 'No linked runner'; end if;
 delete from public.brain_runner_media where user_id=auth.uid();
 delete from public.brain_profiles where user_id=auth.uid();
 update public.brain_link_requests set status='rejected' where user_id=auth.uid() and status in ('pending','approved');
 delete from public.brain_runner_links where user_id=auth.uid();
end $$;
create function public.brain_unlink_runner() returns void language sql security invoker set search_path='' as $$select brain_private.unlink_runner()$$;
revoke all on function brain_private.unlink_runner(),public.brain_unlink_runner() from public,anon;
grant execute on function brain_private.unlink_runner(),public.brain_unlink_runner() to authenticated;

-- Keep the knowledge catalog synchronized without replacing sources or claims.
create function brain_private.sync_runner_entity() returns trigger
language plpgsql security definer set search_path='' as $$begin
 insert into public.brain_entities(kind,title,runner_slug,legacy_key)
 values('runner',new.data->>'name',new.slug,'runner:'||new.slug)
 on conflict(legacy_key) do update set title=excluded.title;
 return new;
end $$;
revoke all on function brain_private.sync_runner_entity() from public,anon,authenticated;
create trigger brain_sync_runner_entity after insert or update of data on public.runners
for each row execute function brain_private.sync_runner_entity();
insert into public.brain_entities(kind,title,runner_slug,legacy_key)
select 'runner',data->>'name',slug,'runner:'||slug from public.runners
on conflict(legacy_key) do update set title=excluded.title;

-- Preserve the existing personal-site link as editable data.
update public.runners set data=data||jsonb_build_object('websiteUrl','https://nejc-ursic.netlify.app')
where slug='nejc-ursic' and not data ? 'websiteUrl';
create or replace function brain_private.runner_edit(p_slug text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; k text; limit_size integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not (
   exists(select 1 from public.brain_runner_links where user_id=auth.uid() and runner_slug=p_slug)
 ) then raise exception 'Approved runner ownership required'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' or p_data - array['name','location','club','favouriteDistance','bio','longDescription','quote','stravaUrl','utmbUrl','websiteUrl'] <> '{}'::jsonb then
   raise exception 'Invalid profile fields';
 end if;
 foreach k in array array['name','location','club','favouriteDistance','bio','longDescription','quote','stravaUrl','utmbUrl','websiteUrl'] loop
   if k in ('utmbUrl','websiteUrl') and not p_data ? k then continue; end if;
   limit_size:=case k when 'bio' then 1500 when 'longDescription' then 5000 when 'quote' then 500 when 'stravaUrl' then 500 when 'utmbUrl' then 500 when 'websiteUrl' then 500 else 100 end;
   if jsonb_typeof(p_data->k) is distinct from 'string' or length(p_data->>k)>limit_size then raise exception 'Invalid field'; end if;
 end loop;
 if length(trim(p_data->>'name'))<2 then raise exception 'Name too short'; end if;
 foreach k in array array['stravaUrl','utmbUrl','websiteUrl'] loop
   if coalesce(p_data->>k,'')<>'' and p_data->>k !~ '^https://[^[:space:]]+$' then raise exception 'Invalid URL'; end if;
 end loop;
 update public.runners set data=data||p_data,updated_at=now() where slug=p_slug returning data into result;
 if not found then raise exception 'Runner not found'; end if;
 return result;
end $$;


