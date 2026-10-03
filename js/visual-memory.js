const PREFIX = 'versday.visual.';
const CACHE_KEY = `${PREFIX}cache.v1`;
const USAGE_KEY = `${PREFIX}usage.v1`;
const FEEDBACK_KEY = `${PREFIX}feedback.v1`;
const METRICS_KEY = `${PREFIX}metrics.v1`;
const MAX_USAGE = 120;

function storageAvailable() {
  return typeof localStorage !== 'undefined';
}

function read(key, fallback) {
  if (!storageAvailable()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function write(key, value) {
  if (!storageAvailable()) return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function cacheId(reference, rankingVersion='1') {
  return `${rankingVersion}:${reference}`;
}

export function getVisualCache(reference, rankingVersion='1') {
  const all = read(CACHE_KEY, {});
  const item = all[cacheId(reference, rankingVersion)];
  if (!item) return null;
  if (item.expiresAt && Date.now() > item.expiresAt) return null;
  if (item.selection?.imageId && isImageRejected(reference, item.selection.imageId)) return null;
  return item;
}

export function setVisualCache(reference, selection, intent, rankingVersion='1', ttlMs=1000*60*60*24*30) {
  const all = read(CACHE_KEY, {});
  all[cacheId(reference, rankingVersion)] = {
    reference,
    selection,
    visualIntentHash: simpleHash(JSON.stringify(intent)),
    generatedAt: Date.now(),
    expiresAt: Date.now() + ttlMs
  };
  const keys = Object.keys(all);
  if (keys.length > 220) keys.sort((a,b)=>(all[a].generatedAt||0)-(all[b].generatedAt||0)).slice(0,keys.length-220).forEach(k=>delete all[k]);
  write(CACHE_KEY, all);
}

export function recordVisualUsage(selection, intent) {
  if (!selection?.imageId) return;
  const usage = read(USAGE_KEY, []);
  usage.unshift({
    imageId: selection.imageId,
    provider: selection.provider,
    photographer: selection.attribution?.photographer || null,
    verseReference: intent?.verseReference,
    primaryTheme: intent?.semantic?.primaryTheme,
    query: selection.query || null,
    visualSignature: selection.visualSignature || null,
    score: selection.score,
    usedAt: Date.now()
  });
  write(USAGE_KEY, usage.slice(0,MAX_USAGE));
}

export function noveltyScore(candidate) {
  const usage = read(USAGE_KEY, []);
  const recent = usage.slice(0,36);
  if (recent.some(x=>x.imageId===candidate.id)) return 0.05;
  const photographer = candidate.photographer || candidate.attribution?.photographer;
  if (photographer && recent.slice(0,10).some(x=>x.photographer===photographer)) return 0.45;
  const signature = [...(candidate.tags || [])].slice(0,4).sort().join('|');
  if (signature && recent.slice(0,8).some(x=>x.visualSignature===signature)) return 0.62;
  return 1;
}

export function recordVisualFeedback(reference, imageId, value) {
  if (!reference || !imageId || !['up','down'].includes(value)) return;
  const feedback = read(FEEDBACK_KEY, []);
  feedback.unshift({ reference, imageId, value, timestamp: Date.now() });
  write(FEEDBACK_KEY, feedback.slice(0,300));

  if (value === 'down') {
    const all = read(CACHE_KEY, {});
    Object.keys(all).forEach(k => {
      if (all[k]?.reference === reference && all[k]?.selection?.imageId === imageId) delete all[k];
    });
    write(CACHE_KEY, all);
  }
}

export function isImageRejected(reference, imageId) {
  return read(FEEDBACK_KEY, []).some(x=>x.reference===reference && x.imageId===imageId && x.value==='down');
}

export function recordVisualMetric(name, payload={}) {
  const metrics = read(METRICS_KEY, []);
  metrics.unshift({ name, payload, timestamp: Date.now() });
  write(METRICS_KEY, metrics.slice(0,200));
}

export function simpleHash(value='') {
  let h = 2166136261;
  for (let i=0;i<value.length;i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
