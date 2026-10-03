import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  isVisualDebugEnabled,
  buildVisualDebugViewModel
} from '../js/visualDebugPanel.js';

test('visual debug só é habilitado explicitamente pela query flag', () => {
  assert.equal(isVisualDebugEnabled('?visualDebug=1'), true);
  assert.equal(isVisualDebugEnabled('?visualDebug=0'), false);
  assert.equal(isVisualDebugEnabled('?foo=bar'), false);
  assert.equal(isVisualDebugEnabled(''), false);
});

test('view model de debug expõe decisão, performance e ranking sem dados brutos desnecessários', () => {
  const model = buildVisualDebugViewModel({
    intent: {
      verseReference: 'pv 3:5',
      semantic: { primaryTheme: 'confiança' },
      representation: { mode: 'conceptual' },
      biblicalContext: {
        contextSource: 'curated-context',
        contextGranularity: 'chapter',
        contextScope: 'pv 3'
      }
    },
    visual: {
      mode: 'photo',
      id: 'candidate-1',
      provider: 'Unsplash',
      score: 0.86,
      semanticScore: 0.91,
      compositionScore: 0.83,
      textPlacement: 'upper-left',
      mobileTextPlacement: 'lower',
      overlayStrength: 0.24,
      imageUrl: 'https://images.unsplash.com/should-not-appear'
    },
    diagnostics: {
      source: 'Unsplash',
      purpose: 'background',
      decision: {
        code: 'PHOTO_ACCEPTED',
        dominantRejectReason: null
      },
      timings: {
        totalMs: 711.24,
        acquisitionMs: 420.1,
        pixelAnalysisMs: 210.2,
        vlmMs: 0,
        finalRankingMs: 2.1
      },
      candidateCount: 18,
      providerCandidateCount: 12,
      curatedCandidateCount: 6,
      analyzedCandidateCount: 5,
      ranked: [{
        id: 'candidate-1',
        accepted: true,
        scores: {
          final: 0.86,
          semantic: 0.91,
          emotional: 0.8,
          composition: 0.83
        },
        rejectedReasons: [],
        candidate: {
          imageUrl: 'https://images.unsplash.com/raw'
        }
      }]
    }
  });

  assert.equal(model.reference, 'pv 3:5');
  assert.equal(model.decision.code, 'PHOTO_ACCEPTED');
  assert.equal(model.timings.totalMs, 711.2);
  assert.equal(model.ranked.length, 1);
  assert.equal(model.ranked[0].id, 'candidate-1');

  const serialized = JSON.stringify(model);
  assert.doesNotMatch(serialized, /images\.unsplash\.com/);
});

test('módulo do painel usa DOM seguro e não faz chamadas de rede', async () => {
  const source = await readFile(
    new URL('../js/visualDebugPanel.js', import.meta.url),
    'utf8'
  );

  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.match(source, /textContent/);
  assert.match(source, /visualDebug/);
});

test('main renderiza painel somente após uma decisão visual disponível', async () => {
  const source = await readFile(
    new URL('../js/main.js', import.meta.url),
    'utf8'
  );

  assert.match(source, /initVisualDebugPanel\(\)/);
  assert.match(
    source,
    /setBackgroundImage\(verse\)[\s\S]*renderVisualDebugPanel\(selection\)/
  );
});
