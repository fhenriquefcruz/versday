import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeVerse } from '../js/visualIntelligence.js';
import { CURATED_VISUALS } from '../js/visualCatalog.js';
import {
  scoreCandidate,
  VISUAL_THRESHOLDS
} from '../js/visualSelector.js';

function hopeIntent() {
  return analyzeVerse({
    text: 'Os que esperam no Senhor renovam as suas forças.',
    reference: 'is 40:31',
    book: 'is',
    chapter: 40,
    verse: 31,
    theme: 'esperanca'
  });
}

test('curadoria exata pode alcançar apenas o piso semântico', () => {
  const candidate = CURATED_VISUALS.find(
    item => item.id === 'pexels-1493215'
  );
  assert.ok(candidate);

  const result = scoreCandidate(
    candidate,
    hopeIntent(),
    []
  );

  assert.equal(
    result.curationSignals.floorApplied,
    true
  );
  assert.ok(
    result.curationSignals.rawSemantic <
      VISUAL_THRESHOLDS.semantic
  );
  assert.equal(
    result.scores.semantic,
    VISUAL_THRESHOLDS.semantic
  );
  assert.equal(result.accepted, true);
});

test('curadoria nunca resgata fotografia de tema diferente', () => {
  const candidate = {
    ...CURATED_VISUALS.find(
      item => item.id === 'pexels-1493215'
    ),
    id: 'wrong-theme-curated',
    themes: ['gratidão'],
    tags: ['gratidão', 'harvest', 'warm light'],
    moods: ['caloroso', 'humilde'],
    curationConfidence: 1
  };

  const result = scoreCandidate(
    candidate,
    hopeIntent(),
    []
  );

  assert.equal(
    result.curationSignals.floorApplied,
    false
  );
  assert.ok(
    result.scores.semantic <
      VISUAL_THRESHOLDS.semantic
  );
  assert.equal(result.accepted, false);
  assert.ok(
    result.rejectedReasons.includes(
      'SEMANTIC_MISMATCH'
    )
  );
});

test('curadoria exige modo de representação compatível', () => {
  const original = CURATED_VISUALS.find(
    item => item.id === 'pexels-1493215'
  );
  const candidate = {
    ...original,
    id: 'wrong-mode-curated',
    representationModes: ['literal']
  };

  const result = scoreCandidate(
    candidate,
    hopeIntent(),
    []
  );

  assert.equal(
    result.curationSignals.floorApplied,
    false
  );
  assert.ok(
    result.scores.semantic <
      VISUAL_THRESHOLDS.semantic
  );
});

test('curadoria exige suporte semântico independente', () => {
  const intent = analyzeVerse({
    text: 'Confia no Senhor de todo o teu coração.',
    reference: 'pv 3:5',
    book: 'pv',
    chapter: 3,
    verse: 5,
    theme: 'confianca'
  });

  const candidate = {
    id: 'label-only',
    mode: 'photo',
    provider: 'Pexels',
    imageUrl: 'https://images.pexels.com/photos/1/example.jpeg',
    width: 2400,
    height: 1600,
    themes: ['confiança'],
    tags: ['confiança'],
    moods: ['eufórico'],
    representationModes: ['conceptual'],
    safeTextAreas: ['center'],
    focalPoint: { x: 0.5, y: 0.5 },
    mobileFocalPoint: { x: 0.5, y: 0.5 },
    tabletFocalPoint: { x: 0.5, y: 0.5 },
    qualityScore: 0.9,
    compositionScore: 0.9,
    identityScore: 0.9,
    curationConfidence: 1
  };

  const result = scoreCandidate(
    candidate,
    intent,
    []
  );

  assert.equal(
    result.curationSignals.independentSupport,
    0
  );
  assert.equal(
    result.curationSignals.floorApplied,
    false
  );
  assert.equal(result.accepted, false);
});

test('hard filter continua soberano sobre curadoria', () => {
  const original = CURATED_VISUALS.find(
    item => item.id === 'pexels-1493215'
  );
  const candidate = {
    ...original,
    id: 'watermarked-curated',
    hasWatermark: true
  };

  const result = scoreCandidate(
    candidate,
    hopeIntent(),
    []
  );

  assert.equal(result.accepted, false);
  assert.ok(
    result.rejectedReasons.includes('WATERMARK')
  );
  assert.equal(result.scores.semantic, 0);
});
