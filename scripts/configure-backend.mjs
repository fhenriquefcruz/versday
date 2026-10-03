import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function parseBoolean(value, name) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no', ''].includes(normalized)) return false;
  throw new Error(`Invalid boolean for ${name}: ${value}`);
}

export function normalizeBackendBaseUrl(value) {
  const url = new URL(String(value || '').trim());

  if (url.protocol !== 'https:') {
    throw new Error('Backend URL must use HTTPS.');
  }

  if (url.username || url.password) {
    throw new Error('Backend URL must not contain credentials.');
  }

  return url.origin;
}

function replaceMetaContent(html, name, value) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(<meta\\s+name=["']${escapedName}["']\\s+content=["'])[^"']*(["']\\s*\\/?>)`,
    'i'
  );

  if (!pattern.test(html)) {
    throw new Error(`Meta tag not found: ${name}`);
  }

  return html.replace(pattern, `$1${value}$2`);
}

function normalizeCacheTag(value) {
  const tag = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  if (!tag) throw new Error('A non-empty cache tag is required.');
  return tag;
}

export function configureBackendContent(indexHtml, serviceWorker, options) {
  const baseUrl = normalizeBackendBaseUrl(options.baseUrl);
  const imagesConfigured = Boolean(options.imagesConfigured);
  const chatConfigured = Boolean(options.chatConfigured);
  const cacheTag = normalizeCacheTag(options.cacheTag);

  const endpoints = {
    health: `${baseUrl}/api/health`,
    visual: imagesConfigured ? `${baseUrl}/api/visual-search` : '',
    visualSelect: imagesConfigured ? `${baseUrl}/api/visual-select` : '',
    chat: chatConfigured ? `${baseUrl}/api/chat` : ''
  };

  let nextIndex = indexHtml;
  nextIndex = replaceMetaContent(nextIndex, 'versday-health-endpoint', endpoints.health);
  nextIndex = replaceMetaContent(nextIndex, 'versday-visual-endpoint', endpoints.visual);
  nextIndex = replaceMetaContent(nextIndex, 'versday-visual-select-endpoint', endpoints.visualSelect);
  nextIndex = replaceMetaContent(nextIndex, 'versday-chat-endpoint', endpoints.chat);

  const cacheName = `versday-v8-backend-${cacheTag}`;
  const cachePattern = /const CACHE_NAME = '[^']+';/;

  if (!cachePattern.test(serviceWorker)) {
    throw new Error('Service Worker CACHE_NAME declaration not found.');
  }

  const nextServiceWorker = serviceWorker.replace(
    cachePattern,
    `const CACHE_NAME = '${cacheName}';`
  );

  return {
    indexHtml: nextIndex,
    serviceWorker: nextServiceWorker,
    endpoints,
    cacheName
  };
}

function readArg(args, name, fallback = undefined) {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1];
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = readArg(args, '--base-url');
  const imagesConfigured = parseBoolean(readArg(args, '--images', 'false'), '--images');
  const chatConfigured = parseBoolean(readArg(args, '--chat', 'false'), '--chat');
  const cacheTag = readArg(args, '--cache-tag');

  if (!baseUrl) throw new Error('--base-url is required.');
  if (!cacheTag) throw new Error('--cache-tag is required.');

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const root = resolve(scriptDir, '..');
  const indexPath = resolve(root, 'index.html');
  const serviceWorkerPath = resolve(root, 'service-worker.js');

  const [indexHtml, serviceWorker] = await Promise.all([
    readFile(indexPath, 'utf8'),
    readFile(serviceWorkerPath, 'utf8')
  ]);

  const configured = configureBackendContent(indexHtml, serviceWorker, {
    baseUrl,
    imagesConfigured,
    chatConfigured,
    cacheTag
  });

  await Promise.all([
    writeFile(indexPath, configured.indexHtml, 'utf8'),
    writeFile(serviceWorkerPath, configured.serviceWorker, 'utf8')
  ]);

  process.stdout.write(JSON.stringify({
    ok: true,
    endpoints: configured.endpoints,
    cacheName: configured.cacheName
  }, null, 2) + '\n');
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
const currentPath = fileURLToPath(import.meta.url);

if (invokedPath === currentPath) {
  main().catch(error => {
    console.error(`[VersDay] Backend activation failed: ${error.message}`);
    process.exitCode = 1;
  });
}
