alter table public.studio_requests drop constraint studio_requests_action_check;
alter table public.studio_requests add constraint studio_requests_action_check check (action in ('assign_task','request_revision','request_new_drafts','approve_script','like_script','dislike_script','archive_script'));
