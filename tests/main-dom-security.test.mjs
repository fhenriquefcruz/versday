import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mainUrl = new URL('../js/main.js', import.meta.url);

test('main não usa parser HTML para dados de versículo, favoritos ou histórico', async () => {
  const source = await readFile(mainUrl, 'utf8');

  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.doesNotMatch(source, /insertAdjacentHTML/);
  assert.doesNotMatch(source, /document\.write/);
  assert.match(source, /replaceChildren\(/);
  assert.match(source, /textContent\s*=/);
  assert.match(source, /document\.createElement\(/);
});

test('links de capítulo só são montados a partir de livro conhecido e inteiro positivo', async () => {
  const source = await readFile(mainUrl, 'utf8');

  assert.match(
    source,
    /Object\.prototype\.hasOwnProperty\.call\(BOOK_NAMES, code\)/
  );
  assert.match(
    source,
    /Number\.isInteger\(number\)/
  );
  assert.match(
    source,
    /encodeURIComponent\(book\)/
  );
  assert.match(
    source,
    /if \(!book \|\| !chapter\) return '';/
  );
});

test('favoritos e histórico usam closures/DOM em vez de data attributes interpolados', async () => {
  const source = await readFile(mainUrl, 'utf8');

  assert.match(source, /function createVerseListItem\(/);
  assert.match(source, /createElement\('button'/);
  assert.match(
    source,
    /entry => entry\.reference === item\.reference/
  );
  assert.doesNotMatch(source, /data-ref="\$\{/);
  assert.doesNotMatch(source, /data-text="\$\{/);
});

test('preview de texto persistido entra apenas via textContent', async () => {
  const source = await readFile(mainUrl, 'utf8');

  assert.match(
    source,
    /text: `\$\{String\(item\.text \|\| ''\)\.slice\(0, 90\)\}…`/
  );
  assert.match(
    source,
    /element\.textContent = String\(options\.text\)/
  );
});
