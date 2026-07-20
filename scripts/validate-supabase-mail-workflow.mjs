import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = JSON.parse(readFileSync(resolve(root, 'n8n/workflows/supabase-store-mail.json'), 'utf8'));
const claimSql = workflow.nodes.find((node) => node.name === 'Claim Mail Processing')?.parameters?.query ?? '';
const finalizeSql = workflow.nodes.find((node) => node.name === 'Finalize Mail Processing')?.parameters?.query ?? '';
const existingSql = workflow.nodes.find((node) => node.name === 'Load Existing Mail Log')?.parameters?.query ?? '';
const serialized = JSON.stringify(workflow);
const errors = [];

if (!claimSql.includes('ON CONFLICT (source, message_id) DO NOTHING')) errors.push('Atomic claim guard is missing');
if (!claimSql.includes("'pending'")) errors.push('Claim must create a pending row');
if (!claimSql.includes('processingClaimed') || !existingSql.includes('processingClaimed')) errors.push('Claim result contract is missing');
if (!finalizeSql.includes('UPDATE mail_logs') || !finalizeSql.includes("processed_status = 'processed'")) errors.push('Finalize update is missing');
for (const field of ['summary', 'priority', 'category', 'requires_action', 'is_schedule']) {
  if (!finalizeSql.includes(field)) errors.push(`Finalize field is missing: ${field}`);
}
if (!finalizeSql.includes("processed_status = 'pending'")) errors.push('Finalize must only update a claimed pending row');
if (/\bbody(?:_preview)?\b/i.test(`${claimSql}\n${finalizeSql}`)) errors.push('Raw body fields must not be stored');
if (serialized.includes('"credentials"')) errors.push('Workflow must not contain credential IDs');
if (workflow.settings?.saveDataSuccessExecution !== 'none' || workflow.settings?.saveDataErrorExecution !== 'none') errors.push('Execution data must not be persisted');

const claims = new Set();
const claim = (source, messageId) => {
  const key = `${source}\u0000${messageId}`;
  if (claims.has(key)) return false;
  claims.add(key);
  return true;
};
if (!claim('gmail', 'same') || claim('gmail', 'same') || !claim('outlook', 'same')) errors.push('Claim fixture contract is invalid');

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Supabase claim/finalize workflow validation passed.');
