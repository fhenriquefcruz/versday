import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  configureBackendContent,
  normalizeBackendBaseUrl
} from '../scripts/configure-backend.mjs';

test('normalizeBackendBaseUrl exige HTTPS e remove path', () => {
  assert.equal(
    normalizeBackendBaseUrl('https://versday-api.example.com/some/path'),
    'https://versday-api.example.com'
  );

  assert.throws(
    () => normalizeBackendBaseUrl('http://versday-api.example.com'),
    /HTTPS/
  );

  assert.throws(
    () => normalizeBackendBaseUrl('https://user:pass@versday-api.example.com'),
    /credentials/
  );
});

test('ativador conecta providers prontos e força nova versão do cache PWA', async () => {
  const [indexHtml, serviceWorker] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../service-worker.js', import.meta.url), 'utf8')
  ]);

  const result = configureBackendContent(indexHtml, serviceWorker, {
    baseUrl: 'https://versday-api.example.com',
    imagesConfigured: true,
    chatConfigured: true,
    cacheTag: 'run-123'
  });

  assert.match(
    result.indexHtml,
    /name="versday-health-endpoint" content="https:\/\/versday-api\.example\.com\/api\/health"/
  );
  assert.match(
    result.indexHtml,
    /name="versday-visual-endpoint" content="https:\/\/versday-api\.example\.com\/api\/visual-search"/
  );
  assert.match(
    result.indexHtml,
    /name="versday-visual-select-endpoint" content="https:\/\/versday-api\.example\.com\/api\/visual-select"/
  );
  assert.match(
    result.indexHtml,
    /name="versday-chat-endpoint" content="https:\/\/versday-api\.example\.com\/api\/chat"/
  );
  assert.match(
    result.serviceWorker,
    /const CACHE_NAME = 'versday-v8-backend-run-123';/
  );
  assert.equal(result.cacheName, 'versday-v8-backend-run-123');
});

test('ativador mantém providers desligados quando health não os confirma', async () => {
  const [indexHtml, serviceWorker] = await Promise.all([
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../service-worker.js', import.meta.url), 'utf8')
  ]);

  const result = configureBackendContent(indexHtml, serviceWorker, {
    baseUrl: 'https://versday-api.example.com',
    imagesConfigured: false,
    chatConfigured: false,
    cacheTag: 'safe-fallback'
  });

  assert.match(
    result.indexHtml,
    /name="versday-health-endpoint" content="https:\/\/versday-api\.example\.com\/api\/health"/
  );
  assert.match(result.indexHtml, /name="versday-visual-endpoint" content=""/);
  assert.match(result.indexHtml, /name="versday-visual-select-endpoint" content=""/);
  assert.match(result.indexHtml, /name="versday-chat-endpoint" content=""/);
  assert.equal(result.endpoints.visual, '');
  assert.equal(result.endpoints.chat, '');
});
