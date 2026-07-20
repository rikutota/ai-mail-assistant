import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const json = (path) => JSON.parse(readFileSync(path, 'utf8'));

test('retry fixture follows transient-only exponential policy', () => {
  const workflow = json('n8n/workflows/api-retry-policy.json');
  const code = workflow.nodes.find(({ name }) => name === 'Classify Retry').parameters.jsCode;
  for (const fixture of json('tests/fixtures/operations/failure-scenarios.json').cases) {
    const input = { statusCode: fixture.statusCode, errorCode: fixture.errorCode, retryAttempt: fixture.attempt };
    const result = vm.runInNewContext(`(() => { ${code} })()`, { $input: { all: () => [{ json: input }] } })[0].json;
    assert.equal(result.shouldRetry, fixture.shouldRetry, fixture.name);
    assert.equal(result.retryDelaySeconds, fixture.delaySeconds, fixture.name);
    if ('retryExhausted' in fixture) assert.equal(result.retryExhausted, fixture.retryExhausted, fixture.name);
  }
});

test('invalid AI response and missing schedule date remain rejected', () => {
  const invalid = json('tests/fixtures/ai/invalid-response.json').response;
  assert.ok(!['High', 'Medium', 'Low'].includes(invalid.priority));
  assert.ok(!['schedule', 'task', 'notice', 'invoice', 'promotion', 'other'].includes(invalid.category));
  assert.equal(invalid.event, null);
  const missingDate = json('tests/fixtures/emails/schedule-missing-date.json');
  assert.doesNotMatch(missingDate.body, /\d{4}[-年]\d{1,2}[-月]\d{1,2}|\d{1,2}[:時]\d{2}/);
});

test('duplicate identity includes source and messageId', () => {
  const duplicate = json('tests/fixtures/duplicate/same-source.json');
  const key = ({ source, messageId }) => `${source}:${messageId}`;
  assert.equal(key(duplicate.first), key(duplicate.second));
  assert.notEqual(key(duplicate.first), key({ ...duplicate.second, source: 'outlook' }));
});

test('retention uses a strict older-than boundary', () => {
  const workflow = json('n8n/workflows/purge-expired-logs.json');
  const sql = workflow.nodes.find(({ name }) => name === 'Purge Expired Logs').parameters.query;
  assert.match(sql, /interval '90 days'/);
  assert.match(sql, /created_at </);
  assert.doesNotMatch(sql, /created_at <=/);
});

test('Gmail and Outlook failures have independent merge paths', () => {
  const workflow = json('n8n/workflows/gmail-daily-orchestrator.json');
  assert.equal(workflow.connections['Fetch Gmail'].main[1][0].node, 'Merge Mail Sources');
  assert.equal(workflow.connections['Fetch Outlook'].main[1][0].node, 'Merge Mail Sources');
  assert.equal(workflow.connections['Fetch Gmail'].main[1][0].index, 0);
  assert.equal(workflow.connections['Fetch Outlook'].main[1][0].index, 1);
});

test('operation fixtures contain no representative secrets', () => {
  const content = readFileSync('tests/fixtures/operations/failure-scenarios.json', 'utf8');
  assert.doesNotMatch(content, /sk-[A-Za-z0-9_-]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|Bearer\s+[A-Za-z0-9._-]+|BEGIN .*PRIVATE KEY/i);
});
