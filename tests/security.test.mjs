import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function collectJs(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await collectJs(path));
    else if (entry.isFile() && /\.(js|mjs|html)$/.test(entry.name)) files.push(path);
  }
  return files;
}

test('nenhuma chave de provedor é publicada no cliente', async () => {
  const files = [
    ...(await collectJs(new URL('../js', import.meta.url).pathname)),
    new URL('../index.html', import.meta.url).pathname
  ];

  const source = (await Promise.all(files.map(file => readFile(file, 'utf8')))).join('\n');

  assert.doesNotMatch(source, /gsk_[A-Za-z0-9_-]{20,}/, 'possível chave Groq exposta');
  assert.doesNotMatch(source, /const\s+UNSPLASH_ACCESS_KEY\s*=\s*['"][^'"]+['"]/, 'chave Unsplash exposta');
  assert.doesNotMatch(source, /Authorization:\s*['"]Client-ID\s+[A-Za-z0-9_-]{20,}/, 'credencial Unsplash hardcoded');
});
