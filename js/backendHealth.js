// js/backendHealth.js
// Descoberta e healthcheck do backend seguro do VersDay.
// Mantém a UI consciente de quais providers estão realmente configurados,
// sem expor valores de credenciais ao navegador.

const SUCCESS_TTL_MS = 60_000;
const FAILURE_TTL_MS = 15_000;

let healthCache = {
  endpoint: '',
  expiresAt: 0,
  payload: null,
  resolved: false
};

function getMeta(name) {
  if (typeof document === 'undefined') return '';
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() || '';
}

function isVercelRuntime() {
  return typeof location !== 'undefined' && /\.vercel\.app$/i.test(location.hostname);
}

export function deriveHealthEndpoint(endpoint = '') {
  const raw = String(endpoint || '').trim();
  if (!raw) return '';

  const clean = raw.split('#')[0].split('?')[0].replace(/\/$/, '');
  const derived = clean.replace(
    /\/api\/(?:chat|visual-search|visual-select)$/,
    '/api/health'
  );

  return derived === clean ? '' : derived;
}

export function getBackendHealthEndpoint() {
  const explicit = getMeta('versday-health-endpoint');
  if (explicit) return explicit;

  if (isVercelRuntime()) return '/api/health';

  const chat = getMeta('versday-chat-endpoint');
  const visual = getMeta('versday-visual-endpoint');
  return deriveHealthEndpoint(chat) || deriveHealthEndpoint(visual);
}

export function clearBackendHealthCache() {
  healthCache = {
    endpoint: '',
    expiresAt: 0,
    payload: null,
    resolved: false
  };
}

function remember(endpoint, payload, success) {
  healthCache = {
    endpoint,
    payload,
    resolved: true,
    expiresAt: Date.now() + (success ? SUCCESS_TTL_MS : FAILURE_TTL_MS)
  };
}

export async function getBackendHealth({ force = false, timeoutMs = 2500 } = {}) {
  const endpoint = getBackendHealthEndpoint();
  if (!endpoint) return null;

  if (
    !force &&
    healthCache.resolved &&
    healthCache.endpoint === endpoint &&
    healthCache.expiresAt > Date.now()
  ) {
    return healthCache.payload;
  }

  const controller = typeof AbortController !== 'undefined'
    ? new AbortController()
    : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller?.signal
    });

    if (!response.ok) {
      remember(endpoint, null, false);
      return null;
    }

    const payload = await response.json();
    if (payload?.ok !== true || payload?.service !== 'versday-api') {
      remember(endpoint, null, false);
      return null;
    }

    remember(endpoint, payload, true);
    return payload;
  } catch {
    remember(endpoint, null, false);
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function isBackendProviderReady(provider, options = {}) {
  const healthEndpoint = getBackendHealthEndpoint();
  if (!healthEndpoint) return null;

  const health = await getBackendHealth(options);
  if (!health) return false;

  if (provider === 'chat') {
    return health.providers?.chatConfigured === true;
  }

  if (provider === 'images') {
    return health.providers?.imagesConfigured === true;
  }

  if (provider === 'vlm') {
    return health.providers?.vlmConfigured === true;
  }

  return false;
}