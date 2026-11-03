-- Applied as restrict_internal_trigger_execution after the content migration.
-- The first function is the existing project-level automatic RLS event trigger.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.content_updated_at() from public, anon, authenticated;
