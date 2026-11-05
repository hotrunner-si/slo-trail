-- Withdraw only AFTER the parent change. Deleting a referenced snapshot in a
-- BEFORE trigger caused the FK's SET NULL to update the same row recursively.
create or replace function brain_private.forum_thread_change() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='DELETE' then return old; end if;
  if (new.title,new.body,new.hidden,new.accepted_post_id,new.topic,new.related_key,new.year,new.conditions)
    is distinct from (old.title,old.body,old.hidden,old.accepted_post_id,old.topic,old.related_key,old.year,old.conditions) then
    new.revision:=old.revision+1;
    new.activity_at:=clock_timestamp();
  end if;
  if new.revision<>old.revision then new.shared_id:=null; end if;
  return new;
end $$;
create function brain_private.forum_snapshot_cleanup() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if tg_op='DELETE' then
    delete from public.brain_shared_conversations where id=old.shared_id;
  elsif old.shared_id is not null and old.shared_id is distinct from new.shared_id then
    delete from public.brain_shared_conversations where id=old.shared_id;
  end if;
  return null;
end $$;
create trigger brain_forum_snapshot_cleanup after update or delete on public.brain_forum_threads
for each row execute function brain_private.forum_snapshot_cleanup();
revoke all on function brain_private.forum_snapshot_cleanup() from public,anon,authenticated;
