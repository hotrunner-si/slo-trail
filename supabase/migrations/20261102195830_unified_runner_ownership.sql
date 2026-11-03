-- One authority for ownership. The profile pointer records publication provenance only.
lock table public.brain_profiles, public.brain_runner_links in share row exclusive mode;
do $$begin
 if exists (
   select 1 from public.brain_profiles p join public.brain_runner_links l
   on p.user_id=l.user_id or p.public_runner_slug=l.runner_slug
   where p.public_runner_slug is not null
   and (p.user_id<>l.user_id or p.public_runner_slug<>l.runner_slug)
 ) then raise exception 'Conflicting runner ownership; resolve explicitly before migration'; end if;
end $$;

-- Derived GPX JSON stays in the same private bucket, fetched through the authenticated API.
update storage.buckets set allowed_mime_types = array['application/gpx+xml','application/json','image/jpeg','image/png','image/webp']
where id='brain-private';
insert into public.brain_runner_links(user_id,runner_slug)
select user_id,public_runner_slug from public.brain_profiles where public_runner_slug is not null
on conflict(user_id) do nothing;
alter table public.brain_runner_links add constraint brain_runner_owner_pair unique(user_id,runner_slug);
alter table public.brain_profiles add constraint brain_profile_owner
foreign key(user_id,public_runner_slug) references public.brain_runner_links(user_id,runner_slug);

-- Publication and legacy server callers also have to claim the canonical ownership.
create function brain_private.claim_published_runner() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.public_runner_slug is not null then
   if exists(select 1 from public.brain_runner_links where
      (user_id=new.user_id and runner_slug<>new.public_runner_slug)
      or (runner_slug=new.public_runner_slug and user_id<>new.user_id)) then
     raise exception 'Runner or account already has an owner' using errcode='23505';
   end if;
   insert into public.brain_runner_links(user_id,runner_slug) values(new.user_id,new.public_runner_slug)
   on conflict(user_id) do nothing;
 end if;
 return new;
end $$;
revoke all on function brain_private.claim_published_runner() from public,anon,authenticated;
create trigger brain_claim_published_runner before insert or update of public_runner_slug
on public.brain_profiles for each row execute function brain_private.claim_published_runner();

create or replace function brain_private.profile_save(p_name text,p_bio text,p_region text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.brain_runner_links where user_id=auth.uid()) then
   raise exception 'Account already owns a runner';
 end if;
 insert into public.brain_profiles(user_id,display_name,bio,region) values(auth.uid(),trim(p_name),trim(p_bio),trim(p_region))
 on conflict(user_id) do update set display_name=excluded.display_name,bio=excluded.bio,region=excluded.region,status='pending';
end $$;

create or replace function brain_private.link_request(p_runner text,p_note text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if exists(select 1 from public.brain_runner_links where user_id=auth.uid() or runner_slug=p_runner) then
   raise exception 'Runner or account already has an owner' using errcode='23505';
 end if;
 insert into public.brain_link_requests(user_id,runner_slug,note) values(auth.uid(),p_runner,p_note)
 on conflict(user_id,runner_slug) do update set note=excluded.note,status='pending',created_at=now()
 where public.brain_link_requests.status='rejected';
 if not found then raise exception 'Request already pending' using errcode='23505'; end if;
end $$;
create or replace function brain_private.runner_edit(p_slug text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; k text; limit_size integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not (
   exists(select 1 from public.brain_runner_links where user_id=auth.uid() and runner_slug=p_slug)
 ) then raise exception 'Approved runner ownership required'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' or p_data - array['name','location','club','favouriteDistance','bio','longDescription','quote','stravaUrl'] <> '{}'::jsonb then
   raise exception 'Invalid profile fields';
 end if;
 foreach k in array array['name','location','club','favouriteDistance','bio','longDescription','quote','stravaUrl'] loop
   limit_size:=case k when 'bio' then 1500 when 'longDescription' then 5000 when 'quote' then 500 when 'stravaUrl' then 500 else 100 end;
   if jsonb_typeof(p_data->k) is distinct from 'string' or length(p_data->>k)>limit_size then raise exception 'Invalid field'; end if;
 end loop;
 if length(trim(p_data->>'name'))<2 then raise exception 'Name too short'; end if;
 if p_data->>'stravaUrl'<>'' and p_data->>'stravaUrl' !~ '^https://[^[:space:]]+$' then raise exception 'Invalid URL'; end if;
 update public.runners set data=data||p_data,updated_at=now() where slug=p_slug returning data into result;
 if not found then raise exception 'Runner not found'; end if;
 return result;
end $$;

create or replace function brain_private.route_request(p_file uuid,p_title text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.brain_route_reviews(user_id,file_id,file_path,title)
 select auth.uid(),id,path,p_title from public.brain_files where id=p_file and user_id=auth.uid() and kind='gpx'
 on conflict(file_path) do update set title=excluded.title,status='pending',created_at=now()
 where public.brain_route_reviews.user_id=auth.uid() and public.brain_route_reviews.status='rejected';
 if not found then raise exception 'GPX missing or review already pending'; end if;
end $$;

create or replace function brain_private.moderate(p_kind text,p_id uuid,p_action text) returns void language plpgsql security definer set search_path='' as $$
declare p public.brain_profiles; l public.brain_link_requests; s text; begin
 if not brain_private.is_admin() then raise exception 'Admin required'; end if;
 if p_kind='profile' then
 select * into strict p from public.brain_profiles where user_id=p_id for update;
 if p_action in ('approve','reject') then update public.brain_profiles set status=case when p_action='approve' then 'approved' else 'rejected' end where user_id=p_id;
 elsif p_action='publish' and p.status='approved' and p.public_runner_slug is null then
 if exists(select 1 from public.brain_runner_links where user_id=p_id) then raise exception 'Account already owns a runner'; end if;
 s:='skupnost-'||replace(gen_random_uuid()::text,'-','');
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

