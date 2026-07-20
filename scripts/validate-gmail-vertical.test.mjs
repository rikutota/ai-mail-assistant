import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const fixtureRoot = 'tests/fixtures';
const { scenarios } = readJson(`${fixtureRoot}/orchestrator/gmail-vertical-scenarios.json`);
const analyses = readJson(`${fixtureRoot}/expected/analysis-results.json`);

function analysisFor(message) {
  if (message.messageId.includes('schedule')) return analyses['schedule-gmail'];
  return analyses['normal-gmail'];
}

function runScenario(scenario, state = { claimedKeys: new Set(), digestKeys: new Set() }) {
  const counts = { claimed: 0, analyzed: 0, finalized: 0, calendar: 0, line: 0 };
  for (const file of scenario.messages) {
    const mail = readJson(`${fixtureRoot}/emails/${file}`);
    const key = `${mail.source}:${mail.messageId}`;
    if (state.claimedKeys.has(key)) continue;
    state.claimedKeys.add(key);
    counts.claimed += 1;
    if (scenario.failures.openai?.includes(mail.messageId)) continue;
    counts.analyzed += 1;
    const analysis = analysisFor(mail);
    counts.finalized += 1;
    if (analysis.isSchedule && analysis.event && !scenario.failures.calendar?.includes(mail.messageId)) counts.calendar += 1;
  }
  const digestKey = scenario.digestKey ?? scenario.name;
  if (!state.digestKeys.has(digestKey)) {
    state.digestKeys.add(digestKey);
    counts.line += 1;
  }
  return { counts, state };
}

for (const scenario of scenarios) {
  test(`Gmail vertical contract: ${scenario.name}`, () => {
    assert.deepEqual(runScenario(scenario).counts, scenario.expected);
  });
}

test('same mail and digest batch are idempotent when re-submitted', () => {
  const scenario = scenarios.find(({ name }) => name === 'normal-and-schedule');
  const first = runScenario(scenario);
  assert.deepEqual(first.counts, scenario.expected);
  const second = runScenario(scenario, first.state);
  assert.deepEqual(second.counts, { claimed: 0, analyzed: 0, finalized: 0, calendar: 0, line: 0 });
});

test('orchestrator routes duplicates and service failures back to the loop', () => {
  const workflow = readJson('n8n/workflows/gmail-daily-orchestrator.json');
  assert.equal(workflow.connections['Processing Claimed?'].main[1][0].node, 'Loop Over Mail');
  for (const node of ['Claim Mail', 'Analyze Mail', 'Finalize Mail', 'Register Calendar']) {
    assert.equal(workflow.connections[node].main[1][0].node, 'Loop Over Mail');
  }
  assert.equal(workflow.connections['Loop Over Mail'].main[0][0].node, 'Send LINE Digest');
});
