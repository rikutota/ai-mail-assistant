create extension if not exists "pgcrypto";

create table if not exists workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_name text not null,
  status text not null default 'running'
    check (status in ('running', 'success', 'partial_success', 'failed')),
  total_mail_count integer not null default 0 check (total_mail_count >= 0),
  processed_mail_count integer not null default 0 check (processed_mail_count >= 0),
  skipped_mail_count integer not null default 0 check (skipped_mail_count >= 0),
  calendar_created_count integer not null default 0 check (calendar_created_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  check (finished_at is null or finished_at >= started_at)
);

create table if not exists mail_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  source text not null check (source in ('gmail', 'outlook')),
  message_id text not null check (length(message_id) > 0),
  thread_id text,
  sender_name text,
  sender_email text,
  subject text,
  body_preview text,
  summary text,
  priority text check (priority is null or priority in ('High', 'Medium', 'Low')),
  category text check (category is null or category in ('schedule', 'task', 'notice', 'invoice', 'promotion', 'other')),
  requires_action boolean not null default false,
  is_schedule boolean not null default false,
  processed_status text not null default 'pending'
    check (processed_status in ('processed', 'skipped', 'failed', 'pending')),
  error_message text,
  received_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint mail_logs_source_message_id_unique unique (source, message_id)
);

create table if not exists calendar_logs (
  id uuid primary key default gen_random_uuid(),
  mail_log_id uuid not null references mail_logs(id) on delete cascade,
  google_event_id text,
  title text not null,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  location text,
  description text,
  status text not null default 'created' check (status in ('created', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now(),
  check (end_datetime > start_datetime)
);

create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  mail_log_id uuid references mail_logs(id) on delete set null,
  workflow_name text,
  node_name text,
  source text check (source is null or source in ('gmail', 'outlook')),
  message_id text,
  error_type text check (
    error_type is null or error_type in (
      'gmail_error', 'outlook_error', 'openai_error', 'calendar_error',
      'line_error', 'supabase_error', 'validation_error', 'unknown_error'
    )
  ),
  error_message text not null,
  stack_trace text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists notification_logs (
  id uuid primary key default gen_random_uuid(),
  workflow_run_id uuid references workflow_runs(id) on delete set null,
  channel text not null default 'line' check (channel in ('line')),
  status text not null default 'sent' check (status in ('sent', 'failed', 'skipped')),
  message text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_mail_logs_received_at on mail_logs(received_at);
create index if not exists idx_mail_logs_priority on mail_logs(priority);
create index if not exists idx_mail_logs_category on mail_logs(category);
create index if not exists idx_calendar_logs_mail_log_id on calendar_logs(mail_log_id);
create index if not exists idx_error_logs_occurred_at on error_logs(occurred_at);
create index if not exists idx_notification_logs_workflow_run_id on notification_logs(workflow_run_id);

comment on column mail_logs.body_preview is
  'Optional masked preview only. Applications must not store raw email bodies.';
