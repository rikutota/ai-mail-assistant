import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const path = 'n8n/workflows/gmail-fetch-unread.json';
const workflow = JSON.parse(readFileSync(path, 'utf8'));
const gmail = workflow.nodes.find((node) => node.type === 'n8n-nodes-base.gmail');
const normalize = workflow.nodes.find((node) => node.name === 'Normalize Gmail message');

assert.ok(gmail, 'Gmail node is required');
assert.equal(gmail.parameters.operation, 'getAll');
assert.equal(gmail.parameters.returnAll, true);
assert.equal(gmail.parameters.filters.readStatus, 'unread');
assert.ok(gmail.parameters.filters.labelIds.includes('INBOX'));
assert.match(gmail.parameters.filters.q, /in:inbox/);
assert.match(gmail.parameters.filters.q, /is:unread/);
assert.ok(!('credentials' in gmail), 'Exported workflow must not contain credential references');
assert.ok(normalize, 'Normalization node is required');

const serialized = JSON.stringify(workflow);
assert.doesNotMatch(serialized, /markAsRead|mark as read/i);
assert.doesNotMatch(serialized, /access[_ -]?token|refresh[_ -]?token|client[_ -]?secret/i);

console.log('Gmail workflow validation passed.');
