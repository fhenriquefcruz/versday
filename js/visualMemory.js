// js/visualMemory.js
import { VISUAL_ENGINE_VERSION } from './visualIntelligence.js';

const CACHE_KEY = 'versday.visual.cache.v3';
const USAGE_KEY = 'versday.visual.usage.v3';
const FEEDBACK_KEY = 'versday.visual.feedback.v3';
const USAGE_LIMIT = 80;

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // O app continua funcional em navegação privada/quota cheia.
  }
}

function cacheKey(reference, purpose = 'background') {
  return `${reference}::${purpose}`;
}

export function getCachedVisual(reference, purpose = 'background') {
  const cache = readJson(CACHE_KEY, {});
  const entry = cache[cacheKey(reference, purpose)];
  if (!entry || entry.engineVersion !== VISUAL_ENGINE_VERSION) return null;

  const negative = readJson(FEEDBACK_KEY, []).some(item =>
    item.reference === reference &&
    item.visualId === entry.visual?.id &&
    item.value === 'down'
  );

  return negative ? null : entry;
}

export function setCachedVisual(reference, intent, visual, purpose = 'background') {
  if (!reference || !visual) return;
  const cache = readJson(CACHE_KEY, {});
  cache[cacheKey(reference, purpose)] = {
    engineVersion: VISUAL_ENGINE_VERSION,
    reference,
    purpose,
    intent,
    visual,
    createdAt: new Date().toISOString()
  };
  writeJson(CACHE_KEY, cache);
}

export function rememberVisualUsage(reference, visual, intent = null, purpose = 'background') {
  if (!visual?.id) return;
  const usage = readJson(USAGE_KEY, []);

  usage.unshift({
    visualId: visual.id,
    reference,
    purpose,
    provider: visual.provider || 'VersDay',
    primaryTheme: intent?.semantic?.primaryTheme || null,
    score: visual.score ?? null,
    query: visual.query || null,
    usedAt: new Date().toISOString()
  });

  writeJson(USAGE_KEY, usage.slice(0, USAGE_LIMIT));
}

export function getRecentVisualIds(limit = 8, purpose = null) {
  return readJson(USAGE_KEY, [])
    .filter(item => !purpose || item.purpose === purpose)
    .slice(0, limit)
    .map(item => item.visualId);
}

export function saveVisualFeedback(reference, visualId, value) {
  if (!reference || !visualId || !['up', 'down'].includes(value)) return;

  const feedback = readJson(FEEDBACK_KEY, [])
    .filter(item => !(item.reference === reference && item.visualId === visualId));

  feedback.unshift({
    reference,
    visualId,
    value,
    createdAt: new Date().toISOString()
  });

  writeJson(FEEDBACK_KEY, feedback.slice(0, 300));

  if (value === 'down') {
    const cache = readJson(CACHE_KEY, {});
    for (const [key, entry] of Object.entries(cache)) {
      if (entry?.reference === reference && entry?.visual?.id === visualId) {
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
