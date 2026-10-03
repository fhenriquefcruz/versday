import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  sanitizeVisualDiagnostics,
  recordVisualTelemetry,
  getVisualTelemetryEntries,
  summarizeVisualTelemetry,
  clearVisualTelemetry
} from '../js/visualTelemetry.js';
import { deriveVisualDecision } from '../js/visualEngine.js';
import {
  VISUAL_PROVIDER_TIMEOUT_MS,
  VLM_CLIENT_TIMEOUT_MS
} from '../js/visualProvider.js';
import {
  VISUAL_PIXEL_TIMEOUT_MS
} from '../js/visual-analysis.js';

function createStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    }
  };
}

test('telemetria visual salva somente campos técnicos permitidos', () => {
  const entry = sanitizeVisualDiagnostics('pv 3:5', {
    source: 'Unsplash',
    purpose: 'background',
    candidateCount: 24,
    providerCandidateCount: 20,
    curatedCandidateCount: 4,
    analyzedCandidateCount: 5,
    decision: {
      code: 'PHOTO_ACCEPTED',
      dominantRejectReason: null
    },
    timings: {
      totalMs: 812.456,
      acquisitionMs: 410.22,
      pixelAnalysisMs: 230.91,
      vlmMs: 0,
      finalRankingMs: 3.11
    },
    ranked: [{
      imageUrl: 'https://images.unsplash.com/secret',
      description: 'raw candidate text'
    }],
    verseText: 'não deve persistir'
  });

  assert.equal(entry.reference, 'pv 3:5');
  assert.equal(entry.decisionCode, 'PHOTO_ACCEPTED');
  assert.equal(entry.timings.totalMs, 812.5);
  assert.equal('ranked' in entry, false);
  assert.equal('verseText' in entry, false);

  const serialized = JSON.stringify(entry);
  assert.doesNotMatch(serialized, /images\.unsplash\.com/);
  assert.doesNotMatch(serialized, /não deve persistir/);
});

test('telemetria fica limitada às 30 decisões mais recentes da sessão', () => {
  const hadStorage = Object.hasOwn(globalThis, 'sessionStorage');
  const oldStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = createStorage();

  try {
    clearVisualTelemetry();

    for (let i = 0; i < 35; i++) {
      recordVisualTelemetry(`ref-${i}`, {
        source: 'catalog',
        purpose: 'background',
        decision: { code: 'PHOTO_ACCEPTED' },
        timings: { totalMs: i + 1 }
      });
    }

    const entries = getVisualTelemetryEntries();
    assert.equal(entries.length, 30);
    assert.equal(entries[0].reference, 'ref-34');
    assert.equal(entries.at(-1).reference, 'ref-5');
  } finally {
    if (hadStorage) globalThis.sessionStorage = oldStorage;
    else delete globalThis.sessionStorage;
  }
});

test('resumo de telemetria calcula média, p95 e taxa fotográfica', () => {
  const summary = summarizeVisualTelemetry([
    {
      decisionCode: 'PHOTO_ACCEPTED',
      dominantRejectReason: null,
      timings: {
        totalMs: 100,
        acquisitionMs: 40,
        pixelAnalysisMs: 30,
        vlmMs: 0
      }
    },
    {
      decisionCode: 'ABSTRACT_NO_ACCEPTED_CANDIDATE',
      dominantRejectReason: 'SEMANTIC_MISMATCH',
      timings: {
        totalMs: 300,
        acquisitionMs: 100,
        pixelAnalysisMs: 80,
        vlmMs: 0
      }
    },
    {
      decisionCode: 'CACHE_HIT',
      dominantRejectReason: null,
      timings: {
        totalMs: 10,
        acquisitionMs: 0,
        pixelAnalysisMs: 0,
        vlmMs: 0
      }
    }
  ]);

  assert.equal(summary.samples, 3);
  assert.equal(summary.photoCount, 1);
  assert.equal(summary.cacheCount, 1);
  assert.equal(summary.fallbackCount, 1);
  assert.equal(summary.photoRate, 0.333);
  assert.equal(summary.p95TotalMs, 300);
  assert.equal(summary.rejectReasons.SEMANTIC_MISMATCH, 1);
});

test('códigos de decisão distinguem foto, ausência e gate VLM', () => {
  assert.deepEqual(
    deriveVisualDecision({
      selected: { candidate: { id: 'x' } },
      ranked: [],
      candidateCount: 1
    }),
    {
      code: 'PHOTO_ACCEPTED',
      dominantRejectReason: null
    }
  );

  assert.deepEqual(
    deriveVisualDecision({
      selected: null,
      ranked: [],
      candidateCount: 0
    }),
    {
      code: 'ABSTRACT_NO_CANDIDATES',
      dominantRejectReason: 'NO_CANDIDATES'
    }
  );

  const vlmDecision = deriveVisualDecision({
    selected: null,
    candidateCount: 2,
    vlm: { enabled: true },
    ranked: [
      {
        rejectedReasons: ['VLM_REJECTED']
      },
      {
        rejectedReasons: ['VLM_REJECTED']
      }
    ]
  });

  assert.equal(vlmDecision.code, 'ABSTRACT_VLM_GATE');
  assert.equal(
    vlmDecision.dominantRejectReason,
    'VLM_REJECTED'
  );
});

test('budgets do cliente visual permanecem limitados', () => {
  assert.ok(VISUAL_PROVIDER_TIMEOUT_MS <= 4500);
  assert.ok(VISUAL_PIXEL_TIMEOUT_MS <= 2500);
  assert.ok(VLM_CLIENT_TIMEOUT_MS <= 5000);
});

test('shortlist de pixels é analisada em paralelo', async () => {
  const source = await readFile(
    new URL('../js/visual-analysis.js', import.meta.url),
    'utf8'
  );

  const start = source.indexOf(
    'export async function analyzeShortlist'
  );
  const block = source.slice(start, start + 500);

  assert.match(block, /Promise\.all/);
  assert.doesNotMatch(block, /for\s*\(/);
});

test('engine registra timings e resumo apenas em visualDebug', async () => {
  const source = await readFile(
    new URL('../js/visualEngine.js', import.meta.url),
    'utf8'
  );

  assert.match(source, /recordVisualTelemetry\(reference, diagnostics\)/);
  assert.match(source, /acquisitionMs/);
  assert.match(source, /pixelAnalysisMs/);
  assert.match(source, /vlmMs/);
  assert.match(source, /finalRankingMs/);
  assert.match(source, /summarizeVisualTelemetry\(\)/);
});
