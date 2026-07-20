alter table notification_logs
  add column if not exists digest_date date;

create unique index if not exists notification_logs_line_digest_date_unique
  on notification_logs(channel, digest_date)
  where channel = 'line' and status = 'sent' and digest_date is not null;

comment on column notification_logs.digest_date is
  'Asia/Tokyo calendar date used to make daily notifications idempotent.';
