// js/visualMemory.js
import { VISUAL_ENGINE_VERSION } from './visualIntelligence.js';

const CACHE_KEY = 'versday.visual.cache.v3';
const USAGE_KEY = 'versday.visual.usage.v3';
const FEEDBACK_KEY = 'versday.visual.feedback.v3';
const USAGE_LIMIT = 80;

function normalizeTheme(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function resolveVisualFeedback(
  feedback = [],
  reference,
  visualId,
  primaryTheme = null
) {
  const exact = feedback.find(item =>
    item.reference === reference &&
    item.visualId === visualId
  );

  if (exact) return exact.value;

  const normalizedTheme = normalizeTheme(primaryTheme);
  if (!normalizedTheme) return null;

  const thematicDown = feedback.find(item =>
    item.visualId === visualId &&
    item.value === 'down' &&
    normalizeTheme(item.primaryTheme) === normalizedTheme
  );

  return thematicDown ? 'down' : null;
}

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

  const feedback = readJson(FEEDBACK_KEY, []);
  const value = resolveVisualFeedback(
    feedback,
    reference,
    entry.visual?.id,
    entry.intent?.semantic?.primaryTheme || null
  );

  return value === 'down' ? null : entry;
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

export function invalidateCachedVisual(
  reference,
  purpose = 'background',
  visualId = null
) {
  if (!reference) return false;

  const cache = readJson(CACHE_KEY, {});
  const key = cacheKey(reference, purpose);
  const entry = cache[key];

  if (!entry) return false;
  if (visualId && entry.visual?.id !== visualId) return false;

  delete cache[key];
  writeJson(CACHE_KEY, cache);
  return true;
}

export function rememberVisualUsage(reference, visual, intent = null, purpose = 'background') {
  if (!visual?.id) return;
  const usage = readJson(USAGE_KEY, []);

  usage.unshift({
    visualId: visual.id,
    reference,
    purpose,
    provider: visual.provider || 'VersDay',
    photographer: visual.photographer || null,
    primaryTheme: intent?.semantic?.primaryTheme || null,
    score: visual.score ?? null,
    query: visual.query || null,
    sceneSignature: visual.sceneSignature || null,
    compositionSignature: visual.compositionSignature || null,
    usedAt: new Date().toISOString()
  });

  writeJson(USAGE_KEY, usage.slice(0, USAGE_LIMIT));
}

export function getRecentVisualUsage(limit = 12, purpose = null) {
  return readJson(USAGE_KEY, [])
    .filter(item => !purpose || item.purpose === purpose)
    .slice(0, limit);
}

export function getRecentVisualIds(limit = 8, purpose = null) {
  return getRecentVisualUsage(limit, purpose)
    .map(item => item.visualId);
}

export function saveVisualFeedback(
  reference,
  visualId,
  value,
  context = {}
) {
  if (!reference || !visualId || !['up', 'down'].includes(value)) return;

  const primaryTheme = context.primaryTheme || null;
  const feedback = readJson(FEEDBACK_KEY, [])
    .filter(item => !(item.reference === reference && item.visualId === visualId));

  feedback.unshift({
    reference,
    visualId,
    value,
    primaryTheme,
    sceneSignature: context.sceneSignature || null,
    provider: context.provider || null,
    createdAt: new Date().toISOString()
  });

  writeJson(FEEDBACK_KEY, feedback.slice(0, 300));

  if (value === 'down') {
    const cache = readJson(CACHE_KEY, {});
    const normalizedTheme = normalizeTheme(primaryTheme);

    for (const [key, entry] of Object.entries(cache)) {
      const sameVisual = entry?.visual?.id === visualId;
      const sameReference = entry?.reference === reference;
      const sameTheme = Boolean(normalizedTheme) &&
        normalizeTheme(entry?.intent?.semantic?.primaryTheme) === normalizedTheme;

      if (sameVisual && (sameReference || sameTheme)) {
        delete cache[key];
      }
    }

    writeJson(CACHE_KEY, cache);
  }
}

export function getFeedback(reference, visualId, primaryTheme = null) {
  return resolveVisualFeedback(
    readJson(FEEDBACK_KEY, []),
    reference,
    visualId,
    primaryTheme
  );
}