-- New public runner profiles are created only by the server after brainAdmin verification.
-- Existing owner editing and runner links remain available.
revoke execute on function public.brain_profile_save(text,text,text) from authenticated;
revoke execute on function brain_private.profile_save(text,text,text) from authenticated;
