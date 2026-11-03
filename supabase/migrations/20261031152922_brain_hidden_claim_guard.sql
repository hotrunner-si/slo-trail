create or replace function brain_private.moderate_claim(p_id uuid,p_hidden boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 if not brain_private.is_admin() then raise exception 'Admin required'; end if;
 update public.brain_claims set status=case when p_hidden then 'hidden' else 'active' end where id=p_id;
 if not found then raise exception 'Claim not found'; end if;
 update public.brain_questions set active=not p_hidden where claim_id=p_id;
end $$;
create or replace function brain_private.answer(p_question uuid,p_choice text) returns jsonb language plpgsql security definer set search_path='' as $$
declare q public.brain_questions; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into strict q from public.brain_questions where id=p_question and active;
 if q.claim_id is not null and not exists(select 1 from public.brain_claims where id=q.claim_id and status='active') then raise exception 'Claim unavailable'; end if;
 if p_choice in ('support','oppose','different_context') and q.claim_id is null then raise exception 'Not a verification question'; end if;
 if p_choice='experience' then raise exception 'Use structured experience submission'; end if;
 insert into public.brain_answers(user_id,question_id,choice,claim_id) values(auth.uid(),p_question,p_choice,q.claim_id);
 if p_choice in ('support','oppose') then insert into public.brain_contributions(user_id,claim_id,stance,direct_experience) values(auth.uid(),q.claim_id,p_choice,true); end if;
 return jsonb_build_object('counts',brain_private.claim_counts(q.claim_id),'statement',(select statement from public.brain_claims where id=q.claim_id));
end $$;
