import assert from 'node:assert/strict';
import test from 'node:test';
import { jsonErrors, secretErrors, sqlErrors, validate } from './validate-repository.mjs';

test('rejects invalid workflow JSON', () => {
  assert.equal(jsonErrors('workflow.json', '{invalid').length, 1);
});

test('accepts valid workflow JSON', () => {
  assert.deepEqual(jsonErrors('workflow.json', '{"nodes":[]}'), []);
});

test('requires a SQL terminator', () => {
  assert.equal(sqlErrors('migration.sql', 'select 1').length, 1);
  assert.deepEqual(sqlErrors('migration.sql', 'select 1;'), []);
});

test('detects representative secret formats', () => {
  assert.equal(secretErrors('unsafe.txt', `sk-${'a'.repeat(24)}`).length, 1);
  assert.deepEqual(secretErrors('safe.txt', 'OPENAI_API_KEY='), []);
});

test('rejects tracked env files except .env.example', () => {
  const errors = validate(process.cwd(), ['.env', '.env.local', '.env.example']);
  assert.equal(errors.filter((error) => error.includes('must not be tracked')).length, 2);
});
