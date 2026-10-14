import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeVerse,
  VISUAL_ENGINE_VERSION
} from '../js/visualIntelligence.js';
import {
  VISUAL_THRESHOLDS,
  scoreCandidate
} from '../js/visualSelector.js';
import {
  isVlmPrequalifiedResult
} from '../js/visualEngine.js';

function intent() {
  return analyzeVerse({
    text: 'Confia no Senhor de todo o teu coração.',
    reference: 'pv 3:5',
    book: 'pv',
    chapter: 3,
    verse: 5,
    theme: 'confianca'
  });
}

function externalCandidate(overrides = {}) {
  return {
    id: 'unsplash:dynamic-1',
    provider: 'Unsplash',
    providerUrl: 'https://unsplash.com/photos/dynamic-1',
    imageUrl: 'https://images.unsplash.com/photo-dynamic-1',
    previewUrl: 'https://images.unsplash.com/photo-dynamic-1',
    width: 3200,
    height: 2100,
    description: 'quiet person walking through an uncertain landscape',
    alt: 'quiet person walking through an uncertain landscape',
    tags: ['quiet', 'landscape', 'journey'],
    themes: [],
    moods: [],
    representationModes: [],
    safeTextAreas: ['upper-left'],
    focalPoint: { x: 0.58, y: 0.5 },
    mobileFocalPoint: { x: 0.54, y: 0.5 },
    qualityScore: 0.92,
    compositionScore: 0.84,
    identityScore: 0.82,
    providerSearchScore: 0.9,
    searchIntentTheme: 'confiança',
    query: '',
    technicalAnalysis: {
      bestSafeArea: 'upper-left',
      bestSafeScore: 0.82,
      averageLuminance: 0.42,
      complexity: 0.34
    },
    curationConfidence: 0,
    ...overrides
  };
}

test('engine sobe para 2.12.0 com ponte semântica do provider', () => {
  assert.equal(VISUAL_ENGINE_VERSION, '2.12.0');
});

test('candidato externo sem evidência visual continua abaixo do gate semântico', () => {
  const scored = scoreCandidate(
    externalCandidate(),
    intent(),
    []
  );

  assert.equal(scored.accepted, false);
  assert.ok(
    scored.scores.semantic < VISUAL_THRESHOLDS.semantic
  );
  assert.ok(
    scored.rejectedReasons.includes('SEMANTIC_MISMATCH')
  );
  assert.equal(scored.vlmSignals.applied, false);
});

test('VLM aprovado pode complementar metadados pobres do provider sem alterar qualidade ou composição', () => {
  const candidate = externalCandidate({
    vlmValidation: {
      accepted: true,
      semanticCompatibility: 0.91,
      emotionalCompatibility: 0.82,
      contradiction: false,
      unsafeOrCliche: false,
      reason: 'Scene is compatible with trust under uncertainty.'
    }
  });

  const scored = scoreCandidate(candidate, intent(), []);

  assert.equal(scored.vlmSignals.applied, true);
  assert.equal(scored.scores.semantic, 0.91);
  assert.equal(scored.scores.emotional, 0.82);
  assert.equal(scored.scores.quality, 0.92);
  assert.equal(scored.scores.composition, 0.84);
  assert.ok(
    scored.scores.semantic >= VISUAL_THRESHOLDS.semantic
  );
  assert.ok(
    scored.scores.final >= VISUAL_THRESHOLDS.final
  );
  assert.equal(scored.accepted, true);
});

test('VLM nunca resgata candidato externo abaixo de qualidade ou composição', () => {
  const lowQuality = scoreCandidate(
    externalCandidate({
      qualityScore: 0.4,
      vlmValidation: {
        accepted: true,
        semanticCompatibility: 0.98,
        emotionalCompatibility: 0.95
      }
    }),
    intent(),
    []
  );

  const poorComposition = scoreCandidate(
    externalCandidate({
      compositionScore: 0.4,
      vlmValidation: {
        accepted: true,
        semanticCompatibility: 0.98,
        emotionalCompatibility: 0.95
      }
    }),
    intent(),
    []
  );

  assert.equal(lowQuality.accepted, false);
  assert.ok(
    lowQuality.rejectedReasons.includes('LOW_QUALITY')
  );

  assert.equal(poorComposition.accepted, false);
  assert.ok(
    poorComposition.rejectedReasons.includes('POOR_COMPOSITION')
  );
});

test('pré-validação VLM aceita apenas externo pixel-analisado com rejeições semânticas', () => {
  const base = scoreCandidate(
    externalCandidate(),
    intent(),
    []
  );

  assert.equal(
    isVlmPrequalifiedResult(base),
    true
  );

  const noPixels = scoreCandidate(
    externalCandidate({
      technicalAnalysis: null
    }),
    intent(),
    []
  );
  assert.equal(
    isVlmPrequalifiedResult(noPixels),
    false
  );

  const noSearchEvidence = scoreCandidate(
    externalCandidate({
      providerSearchScore: 0
    }),
    intent(),
    []
  );
  assert.equal(
    isVlmPrequalifiedResult(noSearchEvidence),
    false
  );

  const lowQuality = scoreCandidate(
    externalCandidate({
      qualityScore: 0.4
    }),
    intent(),
    []
  );
  assert.equal(
    isVlmPrequalifiedResult(lowQuality),
    false
  );
});

test('hard filter continua soberano mesmo com VLM aprovado', () => {
  const scored = scoreCandidate(
    externalCandidate({
      description: 'promotional banner with company logo',
      tags: ['brand logo', 'advertising'],
      vlmValidation: {
        accepted: true,
        semanticCompatibility: 0.99,
        emotionalCompatibility: 0.99
      }
    }),
    intent(),
    []
  );

  assert.equal(scored.accepted, false);
  assert.ok(
    scored.rejectedReasons.includes(
      'BRANDING_OR_ADVERTISING_METADATA'
    )
  );
  assert.equal(scored.scores.semantic, 0);
});