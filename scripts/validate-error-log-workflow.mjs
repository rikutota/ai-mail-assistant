import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const workflow = JSON.parse(readFileSync('n8n/workflows/store-error-log.json', 'utf8'));
const sanitize = workflow.nodes.find(({ name }) => name === 'Sanitize Error Log')?.parameters?.jsCode;
const query = workflow.nodes.find(({ name }) => name === 'Insert Error Log')?.parameters?.query ?? '';
assert.ok(sanitize);
for (const field of ['execution_id', 'stage', 'error_code', 'error_summary', 'retry_count']) assert.match(query, new RegExp(field));
assert.doesNotMatch(JSON.stringify(workflow), /credentials|body_preview|stack_trace|apiResponse|authorization/i);

const logged = [];
const input = { stage: 'openai', source: 'gmail', errorCode: 'HTTP 503!', summaryKey: 'retry_exhausted', retryCount: 9, apiResponse: 'must-not-survive', body: 'must-not-survive' };
const context = { $input: { all: () => [{ json: input }] }, console: { error: (value) => logged.push(value) } };
const result = vm.runInNewContext(`(() => { ${sanitize} })()`, context)[0].json;
assert.equal(result.stage, 'openai');
assert.equal(result.errorCode, 'HTTP_503_');
assert.equal(result.errorSummary, 'External service failed after retry limit');
assert.equal(result.retryCount, 3);
assert.ok(!('apiResponse' in result) && !('body' in result));
assert.doesNotMatch(logged[0], /must-not-survive/);

console.log('Safe error log workflow validation passed.');
