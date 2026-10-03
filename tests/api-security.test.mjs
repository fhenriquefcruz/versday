import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = [
  new URL('../api/visual-search.js', import.meta.url),
  new URL('../api/visual-select.js', import.meta.url),
  new URL('../api/chat.js', import.meta.url)
];

test('endpoints server-side usam somente variáveis de ambiente para segredos', async () => {
  const source = (await Promise.all(files.map(file => readFile(file, 'utf8')))).join('\n');

  assert.match(source, /process\.env\.UNSPLASH_ACCESS_KEY/);
  assert.match(source, /process\.env\.GROQ_API_KEY/);
  assert.doesNotMatch(source, /gsk_[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(source, /UNSPLASH_ACCESS_KEY\s*=\s*['"][A-Za-z0-9_-]{20,}/);
});
