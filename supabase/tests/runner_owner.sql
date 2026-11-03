-- All synthetic data rolls back, including public runner edits.
begin;
create temporary table runner_test as select gen_random_uuid() a,gen_random_uuid() b,'qa-'||gen_random_uuid()::text slug;
grant select on runner_test to authenticated;
insert into auth.users(id,aud,role,raw_user_meta_data) select a,'authenticated','authenticated','{}'::jsonb from runner_test union all select b,'authenticated','authenticated','{"admin":true}'::jsonb from runner_test;
insert into public.runners(slug,position,data) select slug,99999,jsonb_build_object('id',slug,'slug',slug,'name','Synthetic runner','image','unchanged.jpg','utmbIndex',700) from runner_test;
select set_config('request.jwt.claim.sub',a::text,true) from runner_test;
set local role authenticated;
do $$begin
 begin perform public.brain_runner_edit((select slug from runner_test),'{}'); raise exception 'Unlinked access accepted';
 exception when raise_exception then if sqlerrm<>'Approved runner ownership required' then raise; end if; end;
end $$;
reset role;
insert into public.brain_runner_links(user_id,runner_slug) select a,slug from runner_test;
set local role authenticated;
do $$declare d jsonb; r jsonb; begin
 d:='{"name":"Updated synthetic runner","location":"Test","club":"","favouriteDistance":"","bio":"Test biography","longDescription":"Test description","quote":"","stravaUrl":""}';
 r:=public.brain_runner_edit((select slug from runner_test),d);
 if r->>'name'<>'Updated synthetic runner' or r->>'image'<>'unchanged.jpg' or r->>'utmbIndex'<>'700' then raise exception 'Update changed protected fields'; end if;
 begin perform public.brain_runner_edit((select slug from runner_test),d||'{"utmbIndex":999}'); raise exception 'Protected field accepted';
 exception when raise_exception then if sqlerrm<>'Invalid profile fields' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',b::text,true) from runner_test;
set local role authenticated;
do $$begin
 begin perform public.brain_runner_edit((select slug from runner_test),'{}'); raise exception 'Foreign runner access accepted';
 exception when raise_exception then if sqlerrm<>'Approved runner ownership required' then raise; end if; end;
end $$;
reset role;
set local role anon;
do $$begin
 if has_function_privilege('anon','public.brain_runner_edit(text,jsonb)','execute') then raise exception 'Guest can call edit'; end if;
end $$;
reset role;
select 'PASS approved ownership, foreign/guest denial, protected fields and metadata isolation' as result;
rollback;
