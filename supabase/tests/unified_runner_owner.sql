-- Entire test is rolled back: no accounts or published profiles survive.
begin;
create temporary table ownership_test as select gen_random_uuid() a,gen_random_uuid() b,gen_random_uuid() admin_id,'owner-qa-'||gen_random_uuid()::text slug;
alter table ownership_test add column published_slug text;
grant select on ownership_test to authenticated;
insert into auth.users(id,aud,role,raw_user_meta_data)
select a,'authenticated','authenticated','{}'::jsonb from ownership_test union all
select b,'authenticated','authenticated','{}'::jsonb from ownership_test union all
select admin_id,'authenticated','authenticated','{}'::jsonb from ownership_test;
insert into public.brain_admins(user_id) select admin_id from ownership_test;
insert into public.brain_profiles(user_id,display_name,bio,region,status)
select a,'Synthetic runner','Synthetic bio','Test','approved' from ownership_test;
select set_config('request.jwt.claim.sub',admin_id::text,true) from ownership_test;
set local role authenticated;
select public.brain_moderate('profile',a,'publish') from ownership_test;
reset role;
do $$begin
 if not exists(select 1 from public.brain_profiles p join public.brain_runner_links l
 on p.user_id=l.user_id and p.public_runner_slug=l.runner_slug where p.user_id=(select a from ownership_test))
 then raise exception 'Publication did not establish canonical ownership'; end if;
end $$;
update ownership_test set published_slug=(select runner_slug from public.brain_runner_links where user_id=ownership_test.a);
-- A different account cannot claim the published profile through the old link path.
select set_config('request.jwt.claim.sub',b::text,true) from ownership_test;
set local role authenticated;
do $$begin
 begin
 perform public.brain_link_request((select published_slug from ownership_test),'Synthetic identity evidence');
 raise exception 'Second owner request accepted';
 exception when unique_violation then null;
 end;
end $$;
reset role;
do $$declare owned text; begin
 select runner_slug into owned from public.brain_runner_links where user_id=(select a from ownership_test);
 begin
   insert into public.brain_runner_links(user_id,runner_slug) select b,owned from ownership_test;
   raise exception 'Second owner accepted';
 exception when unique_violation then null; end;
 insert into public.runners(slug,position,data) select slug,99999,jsonb_build_object('id',slug,'slug',slug,'name','Synthetic') from ownership_test;
 begin
   insert into public.brain_runner_links(user_id,runner_slug) select a,slug from ownership_test;
   raise exception 'Second runner accepted';
 exception when unique_violation then null; end;
 -- Even privileged writes to the legacy pointer must obey canonical ownership.
 begin
   insert into public.brain_profiles(user_id,display_name,bio,region,public_runner_slug)
   select b,'Other','Test','Test',owned from ownership_test;
   raise exception 'Legacy pointer bypassed ownership';
 exception when unique_violation then null; end;
end $$;
-- Stale requests and unpublished suggestions cannot override an existing owner.
insert into public.brain_profiles(user_id,display_name,bio,region,status)
select b,'Other runner','Synthetic bio','Test','approved' from ownership_test;
insert into public.brain_runner_links(user_id,runner_slug) select b,slug from ownership_test;
select set_config('request.jwt.claim.sub',admin_id::text,true) from ownership_test;
set local role authenticated;
do $$begin
 begin perform public.brain_moderate('profile',(select b from ownership_test),'publish');
 raise exception 'Owned account published a second profile';
 exception when raise_exception then if sqlerrm<>'Account already owns a runner' then raise; end if; end;
end $$;
reset role;
select 'PASS canonical publication, one-to-one constraints, legacy pointer protection and stale publication denial' as result;
rollback;
