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

test('parser HTML dinâmico é proibido fora do renderer sanitizado do chat', async () => {
  const jsDir = new URL('../js', import.meta.url).pathname;
  const files = await collectJs(jsDir);
  const violations = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const relative = file.replace(jsDir, '').replace(/^\//, '');

    if (relative === 'chat.js') {
      const matches = source.match(/\.innerHTML\s*=/g) || [];
      assert.equal(
        matches.length,
        1,
        'chat.js deve ter somente o sink sanitizado esperado'
      );
      assert.match(
        source,
        /formatAssistantHtml\(text\)/
      );
      continue;
    }

    if (
      /\.innerHTML\s*=|insertAdjacentHTML|document\.write|\beval\s*\(|new Function\s*\(/.test(source)
    ) {
      violations.push(relative);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `sinks HTML/código dinâmico fora do chat: ${violations.join(', ')}`
  );
});
