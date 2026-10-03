// Telemetria local e efêmera do motor visual.
// Nenhum dado é enviado a servidor; usamos sessionStorage para diagnosticar
// performance e decisões durante a sessão atual.

const STORAGE_KEY = 'versday.visual.telemetry.v1';
const MAX_ENTRIES = 30;

function getStorage() {
  try {
    return typeof sessionStorage !== 'undefined'
      ? sessionStorage
      : null;
  } catch {
    return null;
  }
}

function readEntries() {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES))
    );
  } catch {
    // Observabilidade jamais bloqueia a experiência.
  }
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function sanitizeTiming(timings = {}) {
  return {
    totalMs: round(timings.totalMs),
    acquisitionMs: round(timings.acquisitionMs),
    pixelAnalysisMs: round(timings.pixelAnalysisMs),
    vlmMs: round(timings.vlmMs),
    finalRankingMs: round(timings.finalRankingMs)
  };
}

export function sanitizeVisualDiagnostics(
  reference,
  diagnostics = {}
) {
  return {
    at: new Date().toISOString(),
    reference: String(reference || '').slice(0, 120),
    purpose: String(diagnostics.purpose || 'background'),
    source: String(diagnostics.source || ''),
    decisionCode: String(
      diagnostics.decision?.code ||
      diagnostics.decisionCode ||
      ''
    ),
    dominantRejectReason:
      diagnostics.decision?.dominantRejectReason ||
      diagnostics.dominantRejectReason ||
      null,
    candidateCount: Number(diagnostics.candidateCount || 0),
    providerCandidateCount: Number(
      diagnostics.providerCandidateCount || 0
    ),
    curatedCandidateCount: Number(
      diagnostics.curatedCandidateCount || 0
    ),
    analyzedCandidateCount: Number(
      diagnostics.analyzedCandidateCount || 0
    ),
    vlm: {
      enabled: Boolean(diagnostics.vlm?.enabled),
      evaluatedCount: Number(
        diagnostics.vlm?.evaluatedCount || 0
      ),
      rejectedCount: Array.isArray(
        diagnostics.vlm?.rejectedIds
      )
        ? diagnostics.vlm.rejectedIds.length
        : 0
    },
    timings: sanitizeTiming(diagnostics.timings)
  };
}

export function recordVisualTelemetry(
  reference,
  diagnostics = {}
) {
  const entry = sanitizeVisualDiagnostics(
    reference,
    diagnostics
  );
  const entries = readEntries();
  entries.unshift(entry);
  writeEntries(entries);
  return entry;
}

export function getVisualTelemetryEntries() {
  return readEntries();
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) /
    values.length;
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(sorted.length * p) - 1)
  );
  return sorted[index];
}

export function summarizeVisualTelemetry(
  entries = getVisualTelemetryEntries()
) {
  const list = Array.isArray(entries) ? entries : [];
  const totals = list
    .map(item => Number(item.timings?.totalMs || 0))
    .filter(value => Number.isFinite(value));

  const photoCount = list.filter(item =>
    item.decisionCode === 'PHOTO_ACCEPTED'
  ).length;
  const cacheCount = list.filter(item =>
    item.decisionCode === 'CACHE_HIT'
  ).length;
  const fallbackCount = list.filter(item =>
    item.decisionCode?.startsWith('ABSTRACT_')
  ).length;

  const reasonCounts = {};
  for (const item of list) {
    if (!item.dominantRejectReason) continue;
    reasonCounts[item.dominantRejectReason] =
      (reasonCounts[item.dominantRejectReason] || 0) + 1;
  }

  return {
    samples: list.length,
    photoCount,
    cacheCount,
    fallbackCount,
    photoRate: list.length
      ? round(photoCount / list.length, 3)
      : 0,
    averageTotalMs: round(average(totals)),
    p95TotalMs: round(percentile(totals, 0.95)),
    averageAcquisitionMs: round(average(
      list.map(item => Number(
        item.timings?.acquisitionMs || 0
      ))
    )),
    averagePixelAnalysisMs: round(average(
      list.map(item => Number(
        item.timings?.pixelAnalysisMs || 0
      ))
    )),
    averageVlmMs: round(average(
      list.map(item => Number(
        item.timings?.vlmMs || 0
      ))
    )),
    rejectReasons: reasonCounts
  };
}

export function clearVisualTelemetry() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
