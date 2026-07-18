import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SECRET_PATTERNS = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bAIza[A-Za-z0-9_-]{20,}\b/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

export function markdownLinkErrors(file, content, root) {
  const errors = [];
  const links = content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g);
  for (const match of links) {
    const target = match[1].trim().replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^(?:https?:|mailto:|#)/i.test(target)) continue;
    const decoded = decodeURIComponent(target);
    if (!existsSync(resolve(root, dirname(file), decoded))) {
      errors.push(`${file}: missing Markdown link target: ${target}`);
    }
  }
  return errors;
}

export function jsonErrors(file, content) {
  try {
    JSON.parse(content);
    return [];
  } catch (error) {
    return [`${file}: invalid JSON: ${error.message}`];
  }
}

export function sqlErrors(file, content) {
  const trimmed = content.trim();
  if (!trimmed) return [`${file}: SQL file is empty`];
  if (!trimmed.endsWith(';')) return [`${file}: SQL file must end with a semicolon`];
  if (content.includes('\0')) return [`${file}: SQL file contains a NUL byte`];
  return [];
}

export function secretErrors(file, content) {
  return SECRET_PATTERNS.flatMap((pattern) =>
    pattern.test(content) ? [`${file}: possible secret detected (${pattern.source})`] : [],
  );
}

function trackedFiles(root) {
  const output = execFileSync('git', ['ls-files', '-z'], { cwd: root });
  return output.toString('utf8').split('\0').filter(Boolean);
}

export function validate(root, files) {
  const errors = [];
  const forbiddenEnv = files.filter(
    (file) => /(^|\/)\.env(?:\..+)?$/.test(file.replaceAll('\\', '/')) && file !== '.env.example',
  );
  for (const file of forbiddenEnv) errors.push(`${file}: environment file must not be tracked`);

  for (const file of files) {
    const absolute = resolve(root, file);
    if (!existsSync(absolute)) continue;
    const content = readFileSync(absolute, 'utf8');
    errors.push(...secretErrors(file, content));
    if (extname(file) === '.md') errors.push(...markdownLinkErrors(file, content, root));
    if (file.replaceAll('\\', '/').startsWith('n8n/workflows/') && extname(file) === '.json') {
      errors.push(...jsonErrors(file, content));
    }
    if (file.replaceAll('\\', '/').startsWith('supabase/migrations/') && extname(file) === '.sql') {
      errors.push(...sqlErrors(file, content));
    }
  }
  return errors;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const errors = validate(root, trackedFiles(root));
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('Repository validation passed.');
  }
}
