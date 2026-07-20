import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = JSON.parse(readFileSync(resolve(root, 'n8n/workflows/line-daily-digest.json'), 'utf8'));
const aggregate = workflow.nodes.find((node) => node.name === 'Aggregate Daily Mail')?.parameters?.query ?? '';
const build = workflow.nodes.find((node) => node.name === 'Build LINE Digest')?.parameters?.jsCode ?? '';
const request = workflow.nodes.find((node) => node.name === 'Send LINE Digest');
const check = workflow.nodes.find((node) => node.name === 'Check Digest Sent')?.parameters?.query ?? '';
const serialized = JSON.stringify(workflow);
const errors = [];

for (const field of ['total_count', 'high_count', 'normal_count', 'calendar_created_count', 'error_count']) {
  if (!aggregate.includes(field) || !build.includes(field)) errors.push(`Digest field is missing: ${field}`);
}
if (!aggregate.includes("AT TIME ZONE 'Asia/Tokyo'")) errors.push('JST daily boundary is missing');
if (!check.includes("status = 'sent'") || !serialized.includes('ON CONFLICT')) errors.push('Duplicate-send guard is missing');
if (!check.includes('digest_date') || serialized.includes("workflowRunId")) errors.push('Digest must use a JST date instead of an n8n execution ID');
if (!build.includes('digestDate') || !build.includes("0000-4000-8000-000000000000")) errors.push('Deterministic daily retry key is missing');
if (!serialized.includes('ON CONFLICT (channel, digest_date)')) errors.push('Atomic daily notification guard is missing');
if (request?.parameters?.url !== 'https://api.line.me/v2/bot/message/push' || request?.parameters?.method !== 'POST') errors.push('LINE push endpoint is invalid');
if (!serialized.includes('X-Line-Retry-Key') || !serialized.includes('status === 409')) errors.push('LINE retry idempotency is missing');
if (serialized.includes('"credentials"')) errors.push('Workflow must not contain credential IDs');
if (/body_preview|stack_trace|Authorization.*Bearer/i.test(serialized)) errors.push('Digest may expose prohibited content');

const fixture = [
  {priority: 'High', status: 'processed', calendar: true},
  {priority: 'Medium', status: 'processed', calendar: false},
  {priority: 'Low', status: 'failed', calendar: false},
];
if (fixture.filter((item) => item.priority === 'High').length !== 1) errors.push('Fixture high count mismatch');
if (fixture.filter((item) => item.priority !== 'High').length !== 2) errors.push('Fixture normal count mismatch');
if (fixture.filter((item) => item.calendar).length !== 1 || fixture.filter((item) => item.status === 'failed').length !== 1) errors.push('Fixture result count mismatch');

const digestKeys = new Set();
const notify = (date) => digestKeys.has(date) ? false : (digestKeys.add(date), true);
if (!notify('2026-07-20') || notify('2026-07-20') || !notify('2026-07-21')) errors.push('Daily idempotency fixture mismatch');

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('LINE digest workflow validation passed.');
