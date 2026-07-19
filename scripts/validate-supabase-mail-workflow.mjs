import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = JSON.parse(readFileSync(resolve(root, 'n8n/workflows/supabase-store-mail.json'), 'utf8'));
const sql = workflow.nodes.find((node) => node.name === 'Insert Mail Log')?.parameters?.query ?? '';
const serialized = JSON.stringify(workflow);
const errors = [];

if (!sql.includes('ON CONFLICT (source, message_id) DO NOTHING')) errors.push('Atomic duplicate guard is missing');
if (!sql.includes('processing_claimed')) errors.push('Processing claim result is missing');
if (/\bbody(?:_preview)?\b/i.test(sql)) errors.push('Raw body fields must not be stored');
if (serialized.includes('"credentials"')) errors.push('Workflow must not contain credential IDs');
if (workflow.settings?.saveDataSuccessExecution !== 'none' || workflow.settings?.saveDataErrorExecution !== 'none') errors.push('Execution data must not be persisted');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Supabase mail workflow validation passed.');
}
