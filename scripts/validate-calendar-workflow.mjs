import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = JSON.parse(readFileSync(resolve(root, 'n8n/workflows/google-calendar-register-event.json'), 'utf8'));
const prepare = workflow.nodes.find((node) => node.name === 'Prepare Calendar Event')?.parameters?.jsCode ?? '';
const request = workflow.nodes.find((node) => node.name === 'Create Calendar Event');
const storeSql = workflow.nodes.find((node) => node.name === 'Store Calendar Log')?.parameters?.query ?? '';
const serialized = JSON.stringify(workflow);
const errors = [];

for (const requirement of ['missing_title', 'missing_start_datetime', '60 * 60 * 1000', 'calendarEventId']) {
  if (!prepare.includes(requirement)) errors.push(`Preparation rule is missing: ${requirement}`);
}
if (request?.parameters?.method !== 'POST' || !request?.parameters?.url?.endsWith('/calendars/primary/events')) errors.push('Calendar insert endpoint is invalid');
if (request?.parameters?.authentication !== 'predefinedCredentialType' || request?.parameters?.nodeCredentialType !== 'googleCalendarOAuth2Api') errors.push('Google Calendar credential type is missing');
if (!request?.parameters?.body?.includes('calendarEventId') || !request?.parameters?.body?.includes("timeZone: 'Asia/Tokyo'")) errors.push('Idempotent event body is invalid');
if (!storeSql.includes('WHERE NOT EXISTS') || !storeSql.includes("status = 'created'")) errors.push('Duplicate calendar log guard is missing');
if (!serialized.includes('status === 409')) errors.push('Duplicate Calendar API response handling is missing');
if (serialized.includes('"credentials"')) errors.push('Workflow must not contain credential IDs');
if (workflow.settings?.saveDataSuccessExecution !== 'none' || workflow.settings?.saveDataErrorExecution !== 'none') errors.push('Execution data must not be persisted');

const start = Date.parse('2026-07-22T10:00:00+09:00');
if (new Date(start + 60 * 60 * 1000).toISOString() !== '2026-07-22T02:00:00.000Z') errors.push('Default one-hour end is invalid');

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Calendar workflow validation passed.');
