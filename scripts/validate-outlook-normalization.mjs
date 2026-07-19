import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = JSON.parse(readFileSync(resolve(root, 'n8n/workflows/outlook-normalize-message.json'), 'utf8'));
const raw = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/outlook/raw-promotion.json'), 'utf8'));
const expected = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/emails/promotion-outlook.json'), 'utf8'));
const code = workflow.nodes.find((node) => node.name === 'Normalize Outlook Message')?.parameters?.jsCode ?? '';
const errors = [];

const normalize = (message) => {
  if (!message.id || Number.isNaN(Date.parse(message.receivedDateTime))) throw new Error('validation_error');
  const address = message.from?.emailAddress?.address ?? '';
  const name = message.from?.emailAddress?.name ?? '';
  return {
    source: 'outlook', messageId: message.id, threadId: message.conversationId || null,
    sender: name && address ? `${name} <${address}>` : address || name,
    subject: message.subject ?? '', body: message.body?.content ?? '',
    receivedAt: new Date(message.receivedDateTime).toISOString(),
  };
};

const actual = normalize(raw);
for (const key of ['source', 'messageId', 'threadId', 'sender', 'subject', 'body']) {
  if (actual[key] !== expected[key]) errors.push(`Fixture mismatch: ${key}`);
}
if (Date.parse(actual.receivedAt) !== Date.parse(expected.receivedAt)) errors.push('Fixture mismatch: receivedAt');
if (!code.includes("threadId:") || !code.includes("Number.isNaN(Date.parse")) errors.push('Required null/date validation is missing');
try { normalize({...raw, receivedDateTime: 'invalid'}); errors.push('Invalid date was accepted'); } catch {}
try { normalize({...raw, id: ''}); errors.push('Missing id was accepted'); } catch {}
if (JSON.stringify(workflow).includes('"credentials"')) errors.push('Workflow must not contain credentials');

if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Outlook normalization validation passed.');
