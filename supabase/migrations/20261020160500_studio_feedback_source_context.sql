alter table public.studio_requests add column draft_context jsonb check (draft_context is null or (jsonb_typeof(draft_context)='object' and octet_length(draft_context::text)<=120000));
grant insert(draft_context) on public.studio_requests to authenticated;
comment on column public.studio_requests.draft_context is 'Immutable source version captured when owner records script feedback; archive does not erase context.';
