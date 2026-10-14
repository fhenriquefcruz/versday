import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const indexUrl = new URL('../index.html', import.meta.url);
const mainUrl = new URL('../js/main.js', import.meta.url);

test('index.html possui shell estrutural completo', async () => {
  const html = await readFile(indexUrl, 'utf8');

  assert.match(html, /<div id="historyList"><\/div>/);
  assert.match(
    html,
    /<script type="module" src="\.\/js\/main\.js"><\/script>/
  );
  assert.match(html, /<\/body>\s*<\/html>\s*$/);
  assert.ok(html.length > 7900, `HTML suspeitamente curto: ${html.length}`);
});

test('todos os elementos essenciais do runtime permanecem no HTML', async () => {
  const html = await readFile(indexUrl, 'utf8');

  for (const id of [
    'verseDynamicZone',
    'refreshBtn',
    'shareWABtn',
    'shareIGBtn',
    'copyTextBtn',
    'favoritesBtn',
    'historyBtn',
    'favoritesModal',
    'historyModal',
    'favoritesList',
    'historyList',
    'favoriteCurrentBtn',
    'visualFeedback',
    'initialQuestion',
    'chatContainer',
    'chatMessages'
  ]) {
    assert.match(
      html,
      new RegExp(`id="${id}"`),
      `elemento obrigatório ausente: ${id}`
    );
  }
});

test('CSP restringe scripts, imagens e conexões aos destinos necessários', async () => {
  const html = await readFile(indexUrl, 'utf8');
  const match = html.match(
    /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/
  );

  assert.ok(match, 'CSP meta ausente');
  const csp = match[1];

  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /script-src 'self'/);
  assert.match(
    csp,
    /img-src 'self' data: blob: https:\/\/images\.pexels\.com https:\/\/images\.unsplash\.com/
  );
  assert.match(
    csp,
    /connect-src 'self' data: blob: https:\/\/\*\.vercel\.app/
  );
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-src 'none'/);
  assert.doesNotMatch(csp, /unsafe-eval/);
  assert.doesNotMatch(
    csp,
    /connect-src[^;]*\shttps:\s/
  );
});

test('index não contém script inline incompatível com script-src self', async () => {
  const html = await readFile(indexUrl, 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];

  assert.equal(scripts.length, 1);
  assert.match(scripts[0][1], /src="\.\/js\/main\.js"/);
  assert.equal(scripts[0][2].trim(), '');
});

test('registro do service worker vive no módulo confiável main.js', async () => {
  const source = await readFile(mainUrl, 'utf8');

  assert.match(source, /function initServiceWorker\(\)/);
  assert.match(
    source,
    /navigator\.serviceWorker[\s\S]*\.register\('\.\/service-worker\.js'\)/
  );
  assert.match(source, /initServiceWorker\(\)/);
});

test('referrer policy evita envio de path completo a terceiros', async () => {
  const html = await readFile(indexUrl, 'utf8');

  assert.match(
    html,
    /<meta name="referrer" content="strict-origin-when-cross-origin">/
  );
});
