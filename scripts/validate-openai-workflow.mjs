import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = JSON.parse(readFileSync(resolve(root, 'n8n/workflows/openai-analyze-email.json'), 'utf8'));
const serialized = JSON.stringify(workflow);
const httpNode = workflow.nodes.find((node) => node.name === 'OpenAI Responses API');
const validator = workflow.nodes.find((node) => node.name === 'Validate Analysis');
const invalidFixture = JSON.parse(readFileSync(resolve(root, 'tests/fixtures/ai/invalid-response.json'), 'utf8')).response;

function validationError(analysis) {
  const priorities = new Set(['High', 'Medium', 'Low']);
  const categories = new Set(['schedule', 'task', 'notice', 'invoice', 'promotion', 'other']);
  const required = ['summary', 'priority', 'category', 'requiresAction', 'isSchedule', 'event'];
  if (!required.every((key) => Object.hasOwn(analysis, key))) return true;
  if (!priorities.has(analysis.priority) || !categories.has(analysis.category)) return true;
  if (analysis.isSchedule && (!analysis.event?.title || Number.isNaN(Date.parse(analysis.event?.startDateTime)))) return true;
  return false;
}

const errors = [];
if (httpNode?.parameters?.url !== 'https://api.openai.com/v1/responses') errors.push('Responses API endpoint is missing');
if (!httpNode?.parameters?.body?.includes("type: 'json_schema'")) errors.push('Structured Outputs schema is missing');
for (const value of ['High', 'Medium', 'Low', 'schedule', 'task', 'notice', 'invoice', 'promotion', 'other']) {
  if (!httpNode?.parameters?.body?.includes(`'${value}'`)) errors.push(`Schema enum is missing: ${value}`);
}
if (!httpNode?.parameters?.body?.includes("$env.OPENAI_MODEL || 'gpt-5.6-luna'")) errors.push('Configurable model default is missing');
if (!validator?.parameters?.jsCode?.includes('Date.parse')) errors.push('Schedule date validation is missing');
if (!validationError(invalidFixture)) errors.push('Invalid AI fixture was not rejected');
if (!validationError({ ...invalidFixture, priority: 'High', category: 'schedule' })) {
  errors.push('Schedule without event date was not rejected');
}
if (serialized.includes('"credentials"')) errors.push('Workflow must not contain credential IDs');
if (!serialized.includes('$env.OPENAI_API_KEY')) errors.push('Runtime API key reference is missing');
if (workflow.settings?.saveDataSuccessExecution !== 'none' || workflow.settings?.saveDataErrorExecution !== 'none') {
  errors.push('Execution data must not be persisted');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('OpenAI workflow validation passed.');
}
