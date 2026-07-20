import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = JSON.parse(readFileSync('n8n/workflows/gmail-daily-orchestrator.json', 'utf8'));
const nodes = new Map(workflow.nodes.map((node) => [node.name, node]));
const schedule = nodes.get('Daily 08:00 JST');
assert.equal(schedule?.parameters?.rule?.interval?.[0]?.expression, '0 8 * * *');
assert.equal(workflow.settings.timezone, 'Asia/Tokyo');
assert.equal(workflow.active, false);

const expected = {
  'Fetch Gmail': 'GMAIL_FETCH_WORKFLOW_ID',
  'Claim Mail': 'SUPABASE_MAIL_WORKFLOW_ID',
  'Analyze Mail': 'OPENAI_ANALYZE_WORKFLOW_ID',
  'Finalize Mail': 'SUPABASE_MAIL_WORKFLOW_ID',
  'Register Calendar': 'CALENDAR_REGISTER_WORKFLOW_ID',
  'Send LINE Digest': 'LINE_DIGEST_WORKFLOW_ID',
};
for (const [name, envName] of Object.entries(expected)) {
  const node = nodes.get(name);
  assert.equal(node?.type, 'n8n-nodes-base.executeWorkflow', `${name} must execute a sub-workflow`);
  assert.match(node.parameters.workflowId.value, new RegExp(`\\$env\\.${envName}`));
  assert.ok(!('credentials' in node), `${name} must not export credentials`);
  assert.equal(node.parameters.options.waitForSubWorkflow, true);
}

assert.equal(nodes.get('Fetch Gmail').onError, 'continueErrorOutput');
assert.equal(nodes.get('Claim Mail').onError, 'continueErrorOutput');
assert.equal(nodes.get('Analyze Mail').onError, 'continueErrorOutput');
assert.equal(nodes.get('Finalize Mail').onError, 'continueErrorOutput');
assert.equal(nodes.get('Register Calendar').onError, 'continueErrorOutput');
assert.equal(nodes.get('Send LINE Digest').onError, 'continueErrorOutput');

const loop = workflow.connections['Loop Over Mail'].main;
assert.equal(loop[0][0].node, 'Send LINE Digest', 'digest must run once after the loop');
assert.equal(loop[1][0].node, 'Has Mail?', 'mail items must enter the processing loop');
assert.equal(workflow.connections['Processing Claimed?'].main[1][0].node, 'Loop Over Mail', 'duplicates must skip AI');
assert.equal(workflow.connections['Analyze Mail'].main[1][0].node, 'Loop Over Mail', 'AI failure must continue');
assert.equal(workflow.connections['Register Calendar'].main[1][0].node, 'Loop Over Mail', 'Calendar failure must continue');

console.log('Gmail daily orchestrator validation passed.');
