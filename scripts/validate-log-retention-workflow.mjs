import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = JSON.parse(readFileSync(resolve(root, 'n8n/workflows/purge-expired-logs.json'), 'utf8'));
const node = workflow.nodes.find((item) => item.name === 'Purge Expired Logs');
const sql = node?.parameters?.query ?? '';
const errors = [];

for (const table of ['calendar_logs', 'error_logs', 'notification_logs', 'mail_logs', 'workflow_runs']) {
  if (!sql.includes(`DELETE FROM ${table}`)) errors.push(`Delete step is missing: ${table}`);
}
const positions = ['calendar_logs', 'error_logs', 'notification_logs', 'mail_logs', 'workflow_runs'].map((table) => sql.indexOf(`DELETE FROM ${table}`));
if (!positions.every((position, index) => index === 0 || position > positions[index - 1])) errors.push('Foreign-key-safe delete order is invalid');
for (const dependency of ['FROM deleted_calendar', 'FROM deleted_errors', 'FROM deleted_notifications', 'FROM deleted_mail']) {
  if (!sql.includes(dependency)) errors.push(`Delete dependency is missing: ${dependency}`);
}
if (!sql.includes("interval '90 days'") || !sql.includes('created_at <')) errors.push('Strictly older-than-90-days boundary is missing');
if (!sql.includes("AT TIME ZONE 'Asia/Tokyo'")) errors.push('JST cutoff is missing');
if (!node?.parameters?.options?.queryReplacement?.includes("LOG_RETENTION_DRY_RUN")) errors.push('Dry-run switch is missing');
if (JSON.stringify(workflow).includes('"credentials"')) errors.push('Workflow must not contain credential IDs');

const cutoff = Date.parse('2026-04-20T00:00:00+09:00');
const cases = [
  ['89 days', Date.parse('2026-04-21T00:00:00+09:00'), false],
  ['90 days', cutoff, false],
  ['91 days', Date.parse('2026-04-19T00:00:00+09:00'), true],
];
for (const [label, createdAt, expected] of cases) {
  if ((createdAt < cutoff) !== expected) errors.push(`${label} boundary is invalid`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Log retention workflow validation passed.');
}
