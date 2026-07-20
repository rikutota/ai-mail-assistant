import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = readdirSync('scripts');
const tests = files.filter((file) => file.endsWith('.test.mjs')).map((file) => `scripts/${file}`);
execFileSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' });

for (const file of files.filter((name) => /^validate-.*\.mjs$/.test(name) && !name.endsWith('.test.mjs') && name !== 'validate-all.mjs')) {
  execFileSync(process.execPath, [`scripts/${file}`], { stdio: 'inherit' });
}

console.log('All repository and workflow validations passed.');
