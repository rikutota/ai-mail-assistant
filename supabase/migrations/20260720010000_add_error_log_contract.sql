alter table error_logs
  add column if not exists execution_id text,
  add column if not exists stage text,
  add column if not exists error_code text,
  add column if not exists error_summary text,
  add column if not exists retry_count integer not null default 0;

alter table error_logs
  drop constraint if exists error_logs_retry_count_check;

alter table error_logs
  add constraint error_logs_retry_count_check
  check (retry_count >= 0 and retry_count <= 3);

create index if not exists idx_error_logs_execution_id
  on error_logs(execution_id);

comment on column error_logs.error_summary is
  'Sanitized summary only; raw API responses, credentials, and email bodies are prohibited.';
