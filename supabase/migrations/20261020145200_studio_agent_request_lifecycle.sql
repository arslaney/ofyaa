alter table public.studio_requests drop constraint studio_requests_status_check;
alter table public.studio_requests add constraint studio_requests_status_check check (status in ('received','running','completed','cancelled','blocked','needs_approval'));
alter table public.studio_requests add column result_summary text check (length(result_summary)<=4000), add column started_at timestamptz, add column completed_at timestamptz;
comment on column public.studio_requests.status is 'Owner intake remains received-only; trusted coordinator records execution lifecycle. No browser UPDATE grant.';
