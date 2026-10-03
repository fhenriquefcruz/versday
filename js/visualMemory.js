// js/visualMemory.js
import { VISUAL_ENGINE_VERSION } from './visualIntelligence.js';

const CACHE_KEY = 'versday.visual.cache.v3';
const USAGE_KEY = 'versday.visual.usage.v3';
const FEEDBACK_KEY = 'versday.visual.feedback.v3';
const METRICS_KEY = 'versday.visual.metrics.v3';
const USAGE_LIMIT = 120;
const CACHE_LIMIT = 240;
const CACHE_TTL = 1000 * 60 * 60 * 24 * 30;

function readJson(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Navegação privada/quota cheia não pode quebrar o app.
  }
}

function cacheKey(reference, purpose) {
  return String(purpose || 'background') + ':' + String(reference || '');
}

function simpleHash(value = '') {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function getCachedVisual(reference, purpose = 'background') {
  const cache = readJson(CACHE_KEY, {});
  const entry = cache[cacheKey(reference, purpose)];
  if (!entry || entry.engineVersion !== VISUAL_ENGINE_VERSION) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) return null;

  const rejected = readJson(FEEDBACK_KEY, []).some(item =>
    item.reference === reference &&
    item.visualId === entry.visual?.id &&
    item.value === 'down'
  );

  return rejected ? null : entry;
}

export function setCachedVisual(reference, intent, visual, purpose = 'background') {
  if (!reference || !visual) return;
  const cache = readJson(CACHE_KEY, {});
  const key = cacheKey(reference, purpose);

  cache[key] = {
    engineVersion:VISUAL_ENGINE_VERSION,
    purpose,
    reference,
    visualIntentHash:simpleHash(JSON.stringify(intent || {})),
    intent,
    visual,
    createdAt:new Date().toISOString(),
    expiresAt:Date.now() + CACHE_TTL
  };

  const keys = Object.keys(cache);
  if (keys.length > CACHE_LIMIT) {
    keys
      .sort((a,b) => new Date(cache[a].createdAt || 0) - new Date(cache[b].createdAt || 0))
      .slice(0, keys.length - CACHE_LIMIT)
      .forEach(keyToDelete => delete cache[keyToDelete]);
  }

  writeJson(CACHE_KEY, cache);
}

export function rememberVisualUsage(reference, visual, intent = null, purpose = 'background') {
  if (!visual?.id) return;
  const usage = readJson(USAGE_KEY, []);
  const tags = visual.tags || visual.visualTags || [];

  usage.unshift({
    visualId:visual.id,
    reference,
    purpose,
    provider:visual.provider || 'VersDay',
    photographer:visual.photographer || visual.attribution?.photographer || null,
    primaryTheme:intent?.semantic?.primaryTheme || null,
    query:visual.query || null,
    visualSignature:tags.slice(0,4).map(String).sort().join('|') || null,
    score:Number(visual.score || 0),
    usedAt:new Date().toISOString()
  });

  writeJson(USAGE_KEY, usage.slice(0, USAGE_LIMIT));
}

export function getRecentVisualUsage(limit = 36) {
  return readJson(USAGE_KEY, []).slice(0, limit);
}

export function getRecentVisualIds(limit = 8) {
  return getRecentVisualUsage(limit).map(item => item.visualId);
}

export function saveVisualFeedback(reference, visualId, value) {
  if (!reference || !visualId || !['up','down'].includes(value)) return;
  const feedback = readJson(FEEDBACK_KEY, [])
    .filter(item => !(item.reference === reference && item.visualId === visualId));

  feedback.unshift({
    reference,
    visualId,
    value,
    createdAt:new Date().toISOString()
  });

  writeJson(FEEDBACK_KEY, feedback.slice(0, 300));

  if (value === 'down') {
    const cache = readJson(CACHE_KEY, {});
    for (const key of Object.keys(cache)) {
      if (cache[key]?.reference === reference && cache[key]?.visual?.id === visualId) {
        delete cache[key];
      }
    }
    writeJson(CACHE_KEY, cache);
  }
}

export function getFeedback(reference, visualId) {
  return readJson(FEEDBACK_KEY, []).find(item =>
    item.reference === reference && item.visualId === visualId
  )?.value || null;
}

export function recordVisualMetric(name, payload = {}) {
  const metrics = readJson(METRICS_KEY, []);
  metrics.unshift({
    name:String(name || 'VISUAL_EVENT'),
    payload,
    createdAt:new Date().toISOString()
  });
  writeJson(METRICS_KEY, metrics.slice(0, 240));
}

export function getVisualMetrics(limit = 50) {
  return readJson(METRICS_KEY, []).slice(0, limit);
}
