import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const workflow = JSON.parse(readFileSync('n8n/workflows/api-retry-policy.json', 'utf8'));
const code = workflow.nodes.find(({ name }) => name === 'Classify Retry')?.parameters?.jsCode;
assert.ok(code, 'Classify Retry code is required');
assert.equal(workflow.active, false);
assert.equal(workflow.settings.timezone, 'Asia/Tokyo');
assert.ok(!JSON.stringify(workflow).includes('credentials'));

function classify(input) {
  const context = { $input: { all: () => [{ json: input }] } };
  return vm.runInNewContext(`(() => { ${code} })()`, context)[0].json;
}

for (const statusCode of [429, 500, 503, 599]) {
  const result = classify({ statusCode, retryAttempt: 1 });
  assert.equal(result.shouldRetry, true);
  assert.equal(result.retryDelaySeconds, 1);
  assert.equal(result.nextRetryAttempt, 2);
}
for (const statusCode of [400, 401, 403, 404]) {
  const result = classify({ statusCode, retryAttempt: 1 });
  assert.equal(result.shouldRetry, false);
  assert.equal(result.retryDecision, 'fail');
}
assert.equal(classify({ errorCode: 'ETIMEDOUT', retryAttempt: 2 }).retryDelaySeconds, 2);
assert.equal(classify({ statusCode: 503, retryAttempt: 3 }).retryDelaySeconds, 4);
assert.equal(classify({ statusCode: 503, retryAttempt: 3 }).shouldRetry, true);
assert.equal(classify({ statusCode: 503, retryAttempt: 4 }).retryExhausted, true);
assert.equal(classify({ statusCode: 503, retryAttempt: 4 }).shouldRetry, false);

console.log('API retry policy validation passed.');

const wrapper = JSON.parse(readFileSync('n8n/workflows/execute-workflow-with-retry.json', 'utf8'));
const wrapperNodes = new Map(wrapper.nodes.map((node) => [node.name, node]));
assert.match(wrapperNodes.get('Execute Target Workflow').parameters.workflowId.value, /targetWorkflowId/);
assert.match(wrapperNodes.get('Classify Target Error').parameters.workflowId.value, /API_RETRY_POLICY_WORKFLOW_ID/);
assert.equal(wrapperNodes.get('Execute Target Workflow').onError, 'continueErrorOutput');
assert.match(String(wrapperNodes.get('Wait Before Retry').parameters.amount), /retryDelaySeconds/);
assert.equal(wrapper.connections['Prepare Next Attempt'].main[0][0].node, 'Execute Target Workflow');
assert.equal(wrapper.connections['Should Retry?'].main[1][0].node, 'Final Failure');
assert.ok(!JSON.stringify(wrapper).includes('credentials'));

console.log('API retry wrapper validation passed.');
