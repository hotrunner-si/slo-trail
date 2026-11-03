-- Run as database owner. All fixtures roll back, including Auth and public profiles.
begin;
create temporary table brain_test_context as select gen_random_uuid() a,gen_random_uuid() b,gen_random_uuid() c,
 (select id from public.brain_entities where kind='distance' order by id limit 1) entity,
 null::uuid claim,null::uuid question,null::uuid link;
grant select,update on brain_test_context to authenticated,service_role;
insert into auth.users(id,aud,role,raw_user_meta_data) select a,'authenticated','authenticated','{"admin":true}'::jsonb from brain_test_context
union all select b,'authenticated','authenticated','{}'::jsonb from brain_test_context
union all select c,'authenticated','authenticated','{}'::jsonb from brain_test_context;
set local role service_role;
update brain_test_context set claim=public.brain_store_experience(a,entity,'Zasebni testni povzetek.','Transakcijski preskus: mokra podlaga na odseku.',2025,'wet',null);
update brain_test_context t set question=q.id from public.brain_questions q where q.claim_id=t.claim;
reset role;
select set_config('request.jwt.claim.sub',a::text,true) from brain_test_context;
set local role authenticated;
select public.brain_profile_save('Transakcijski profil','Samo preskus, nikoli javno potrjen.','Test');
do $$begin
 if (public.brain_account()->>'admin')::boolean then raise exception 'User metadata granted admin'; end if;
 if public.brain_account()->'profile'->>'status'<>'pending' then raise exception 'Profile not pending'; end if;
 begin
  perform public.brain_moderate('profile',(select a from brain_test_context),'approve');
  raise exception 'Non-admin approved profile';
 exception when raise_exception then if sqlerrm<>'Admin required' then raise; end if; end;
 if exists(select 1 from public.brain_contributions where user_id<>(select a from brain_test_context)) then raise exception 'Foreign contribution visible'; end if;
end $$;
select public.brain_link_request((select slug from public.runners order by slug limit 1),'Transakcijska zahteva za preverjanje povezave.');
reset role;
update brain_test_context t set link=l.id from public.brain_link_requests l where l.user_id=t.a;
insert into public.brain_admins(user_id) select b from brain_test_context;
select set_config('request.jwt.claim.sub',b::text,true) from brain_test_context;
set local role authenticated;
select public.brain_moderate('profile',a,'approve') from brain_test_context;
do $$begin
 if exists(select 1 from public.brain_profiles where user_id=(select a from brain_test_context) and public_runner_slug is not null) then raise exception 'Approval published automatically'; end if;
end $$;
select public.brain_moderate('profile',a,'publish') from brain_test_context;
select public.brain_moderate('link',link,'approve') from brain_test_context;
select public.brain_answer(question,'support') from brain_test_context;
do $$begin
 begin perform public.brain_answer((select question from brain_test_context),'support'); raise exception 'Duplicate vote accepted';
 exception when unique_violation then null; end;
end $$;
reset role;
set local role service_role;
do $$declare stats jsonb; begin
 stats:=brain_private.claim_counts((select claim from brain_test_context));
 if stats->>'accounts'<>'2' or stats->>'category'<>'multiple' then raise exception 'Independent account count failed'; end if;
 if not exists(select 1 from public.brain_contributions c join public.brain_summaries s on s.id=c.summary_id and s.user_id=c.user_id where c.claim_id=(select claim from brain_test_context)) then raise exception 'Summary provenance missing'; end if;
 if not exists(select 1 from public.brain_contributions c join public.brain_answers a on a.id=c.answer_id and a.user_id=c.user_id and a.claim_id=c.claim_id where c.user_id=(select b from brain_test_context)) then raise exception 'Answer provenance missing'; end if;
 if not exists(select 1 from public.brain_profiles p join public.runners r on r.slug=p.public_runner_slug where p.user_id=(select a from brain_test_context)) then raise exception 'Explicit publication failed'; end if;
 if not exists(select 1 from public.brain_runner_links where user_id=(select a from brain_test_context)) then raise exception 'Explicit runner link failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',c::text,true) from brain_test_context;
set local role authenticated;
select public.brain_answer(question,'oppose') from brain_test_context;
reset role;
set local role service_role;
do $$declare stats jsonb; begin
 stats:=brain_private.claim_counts((select claim from brain_test_context));
 if stats->>'accounts'<>'3' or stats->>'category'<>'conflicting' then raise exception 'Conflict classification failed'; end if;
 -- Same text in dry conditions stays a separate claim.
 perform public.brain_store_experience((select a from brain_test_context),(select entity from brain_test_context),'Drug povzetek.','Transakcijski preskus: mokra podlaga na odseku.',2025,'dry',null);
 if (select count(*) from public.brain_claims where entity_id=(select entity from brain_test_context) and statement='Transakcijski preskus: mokra podlaga na odseku.')<>2 then raise exception 'Contexts merged'; end if;
 -- Exact repeats never become a second independent account contribution.
 perform public.brain_store_experience((select a from brain_test_context),(select entity from brain_test_context),'Ponovljen povzetek.','Transakcijski preskus: mokra podlaga na odseku.',2025,'wet',null);
 if (brain_private.claim_counts((select claim from brain_test_context))->>'accounts')<>'3' then raise exception 'Duplicate account counted'; end if;
 -- Pending structured summaries are finalized atomically and retain exact provenance.
 perform public.brain_store_private_experience((select a from brain_test_context),(select entity from brain_test_context),
  (select id from public.brain_questions where entity_id=(select entity from brain_test_context) and claim_id is null limit 1),
  'Zasebni transakcijski povzetek za obdelavo.',2025,'wet');
 perform public.brain_finalize_pending((select id from public.brain_pending_experiences where user_id=(select a from brain_test_context)),
  'Anonimiziran transakcijski povzetek.','Transakcijski preskus povezane čakalne vrste.');
 if not exists(select 1 from public.brain_pending_experiences p join public.brain_contributions c on c.summary_id=p.summary_id
  join public.brain_answers a on a.id=c.answer_id and a.claim_id=c.claim_id and a.question_id=p.question_id
  where p.user_id=(select a from brain_test_context) and p.status='done') then raise exception 'Pending provenance missing'; end if;
end $$;
reset role;
set local role anon;
do $$begin
 begin perform public.brain_account(); raise exception 'Anonymous private RPC allowed'; exception when insufficient_privilege then null; end;
 begin perform public.brain_search(''); raise exception 'Anonymous search allowed'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',b::text,true) from brain_test_context;
set local role authenticated;
select public.brain_moderate_claim(claim,true) from brain_test_context;
reset role;
select set_config('request.jwt.claim.sub',a::text,true) from brain_test_context;
set local role authenticated;
do $$begin
 if exists(select 1 from public.brain_claims where id=(select claim from brain_test_context)) then raise exception 'Hidden claim visible'; end if;
 begin perform public.brain_answer((select question from brain_test_context),'unknown'); raise exception 'Hidden question answered';
 exception when no_data_found then null; end;
end $$;
reset role;
rollback;
select 'PASS: role isolation, profile approval/publication, link approval, multi-account verification, duplicate vote prevention and context separation (all rolled back)' as result;
