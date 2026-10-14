import test from 'node:test';
import assert from 'node:assert/strict';

import { FALLBACK_VERSES } from '../js/fallbackVerses.js';
import {
  analyzeVerse,
  VISUAL_ENGINE_VERSION
} from '../js/visualIntelligence.js';
import { CURATED_VISUALS } from '../js/visualCatalog.js';
import {
  VISUAL_THRESHOLDS,
  scoreCandidate,
  buildSceneSignature
} from '../js/visualSelector.js';

const CASES = [
  {
    theme: 'alegria',
    existingId: 'pexels-4262003',
    newId: 'pexels-35174361'
  },
  {
    theme: 'forca',
    existingId: 'pexels-618848',
    newId: 'pexels-3377524'
  },
  {
    theme: 'oracao',
    existingId: 'pexels-1292115',
    newId: 'pexels-30644362'
  },
  {
    theme: 'descanso',
    existingId: 'pexels-19023904',
    newId: 'pexels-39914924'
  }
];

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function verseForTheme(theme) {
  return FALLBACK_VERSES.find(verse => {
    const intent = analyzeVerse(verse);
    return normalize(
      intent.semantic?.primaryTheme ||
      verse.theme ||
      ''
    ) === theme;
  });
}

test('engine visual sobe para 2.12.0 na segunda fase de variedade', () => {
  assert.equal(VISUAL_ENGINE_VERSION, '2.12.0');
});

for (const item of CASES) {
  test(`${item.theme} possui segunda fotografia aceita em família de cena distinta`, () => {
    const verse = verseForTheme(item.theme);
    assert.ok(verse, `versículo ausente: ${item.theme}`);

    const intent = analyzeVerse(verse);
    const existing = CURATED_VISUALS.find(
      candidate => candidate.id === item.existingId
    );
    const alternative = CURATED_VISUALS.find(
      candidate => candidate.id === item.newId
    );

    assert.ok(existing, `existente ausente: ${item.existingId}`);
    assert.ok(alternative, `alternativa ausente: ${item.newId}`);

    const result = scoreCandidate(
      alternative,
      intent,
      []
    );

    assert.ok(
      result.scores.semantic >= VISUAL_THRESHOLDS.semantic,
      `${item.newId} semantic=${result.scores.semantic}; reasons=${result.rejectedReasons.join(',')}`
    );
    assert.ok(
      result.scores.final >= VISUAL_THRESHOLDS.final,
      `${item.newId} final=${result.scores.final}; reasons=${result.rejectedReasons.join(',')}`
    );
    assert.equal(
      result.accepted,
      true,
      `${item.newId}: ${result.rejectedReasons.join(', ')}`
    );

    assert.notEqual(
      buildSceneSignature(existing),
      buildSceneSignature(alternative),
      `${item.theme} ainda usa a mesma família de cena`
    );
  });
}

test('novas alternativas possuem famílias explícitas e composição responsiva completa', () => {
  for (const item of CASES) {
    const candidate = CURATED_VISUALS.find(
      visual => visual.id === item.newId
    );

    assert.ok(candidate.sceneFamily);
    assert.ok(candidate.focalPoint);
    assert.ok(candidate.tabletFocalPoint);
    assert.ok(candidate.mobileFocalPoint);
    assert.ok(candidate.safeTextAreas?.length);
    assert.ok(candidate.tabletSafeTextAreas?.length);
    assert.ok(candidate.mobileSafeTextAreas?.length);
    assert.match(
      candidate.providerUrl,
      /^https:\/\/www\.pexels\.com\/photo\//
    );
  }
});