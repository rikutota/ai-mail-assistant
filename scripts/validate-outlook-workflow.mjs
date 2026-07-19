import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflow = JSON.parse(readFileSync(resolve(root, 'n8n/workflows/outlook-fetch-unread.json'), 'utf8'));
const request = workflow.nodes.find((node) => node.name === 'List Outlook Messages');
const serialized = JSON.stringify(workflow);
const query = Object.fromEntries(request?.parameters?.queryParameters?.parameters?.map(({name, value}) => [name, value]) ?? []);
const errors = [];

if (request?.parameters?.url !== 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages') errors.push('Inbox endpoint is missing');
if (request?.parameters?.authentication !== 'predefinedCredentialType' || request?.parameters?.nodeCredentialType !== 'microsoftOutlookOAuth2Api') {
  errors.push('Microsoft Outlook OAuth2 credential type is missing');
}
if (!query.$filter?.includes('receivedDateTime ge') || !query.$filter?.includes('isRead eq false')) errors.push('Unread 24-hour filter is missing');
if (query.$orderby !== 'receivedDateTime desc') errors.push('Stable received-date ordering is missing');
if (!request?.parameters?.options?.pagination?.pagination?.nextURL?.includes('@odata.nextLink')) errors.push('Graph pagination is missing');
if (request?.parameters?.method && request.parameters.method !== 'GET') errors.push('Outlook retrieval must use GET');
if (/PATCH|isRead\s*[:=]\s*true/i.test(serialized)) errors.push('Workflow must not mark messages as read');
if (serialized.includes('"credentials"')) errors.push('Workflow must not contain credential IDs');
if (workflow.settings?.saveDataSuccessExecution !== 'none' || workflow.settings?.saveDataErrorExecution !== 'none') errors.push('Execution data must not be persisted');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Outlook workflow validation passed.');
}
