-- Ownership comes only from an approved runner link or an already published own profile.
-- User-editable Auth metadata is never consulted. Public identifiers, photos, results,
-- UTMB fields and GPX associations cannot be changed through this function.
create function brain_private.runner_edit(p_slug text,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; k text; limit_size integer;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not (
   exists(select 1 from public.brain_runner_links where user_id=auth.uid() and runner_slug=p_slug)
   or exists(select 1 from public.brain_profiles where user_id=auth.uid() and public_runner_slug=p_slug)
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
create function public.brain_runner_edit(p_slug text,p_data jsonb) returns jsonb
language sql security invoker set search_path='' as $$select brain_private.runner_edit(p_slug,p_data)$$;
revoke all on function brain_private.runner_edit(text,jsonb) from public,anon;
revoke all on function public.brain_runner_edit(text,jsonb) from public,anon;
grant execute on function brain_private.runner_edit(text,jsonb) to authenticated;
grant execute on function public.brain_runner_edit(text,jsonb) to authenticated;
