import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const swUrl = new URL('../service-worker.js', import.meta.url);

test('service worker usa network-first para assets locais', async () => {
  const source = await readFile(swUrl, 'utf8');

  assert.match(source, /versday-v11-debug-panel/);
  assert.match(source, /fetch\(request, \{ cache: 'no-cache' \}\)/);
  assert.match(source, /const cached = await caches\.match\(request\)/);
  assert.match(source, /url\.origin !== self\.location\.origin/);

  const fetchIndex = source.indexOf("fetch(request, { cache: 'no-cache' })");
  const cacheFallbackIndex = source.indexOf('const cached = await caches.match(request)');

  assert.ok(fetchIndex >= 0);
  assert.ok(cacheFallbackIndex > fetchIndex);
});

test('service worker não intercepta APIs nem providers externos', async () => {
  const source = await readFile(swUrl, 'utf8');

  assert.match(source, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(source, /unsplash\.com/);
  assert.match(source, /pexels\.com/);
  assert.match(source, /fonts\.googleapis\.com/);
  assert.match(source, /if \(isBypassedRequest\(url\)\) return;/);
});

test('service worker mantém fallback offline do app shell', async () => {
  const source = await readFile(swUrl, 'utf8');

  assert.match(source, /request\.mode === 'navigate'/);
  assert.match(source, /caches\.match\('\.\/index\.html'\)/);
  assert.match(source, /'\.\/js\/visual-analysis\.js'/);
  assert.match(source, /'\.\/js\/visualEngine\.js'/);
  assert.match(source, /'\.\/js\/visualTelemetry\.js'/);
  assert.match(source, /'\.\/js\/visualDebugPanel\.js'/);
});