import test from 'node:test';
import assert from 'node:assert/strict';

import { FALLBACK_VERSES } from '../js/fallbackVerses.js';
import {
  analyzeVerse,
  VISUAL_ENGINE_VERSION
} from '../js/visualIntelligence.js';
import {
  CURATED_VISUALS,
  getCuratedCandidates
} from '../js/visualCatalog.js';
import {
  VISUAL_THRESHOLDS,
  scoreCandidate,
  selectBestCandidate
} from '../js/visualSelector.js';

const TARGETS = [
  {
    theme: 'confianca',
    visualId: 'pexels-29248081'
  },
  {
    theme: 'fe',
    visualId: 'pexels-10711944'
  },
  {
    theme: 'coragem',
    visualId: 'pexels-3164128'
  },
  {
    theme: 'descanso',
    visualId: 'pexels-19023904'
  },
  {
    theme: 'luz',
    visualId: 'pexels-18820283'
  }
];

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

test('engine visual sobe para 2.6.0 após expansão de cobertura', () => {
  assert.equal(VISUAL_ENGINE_VERSION, '2.6.0');
});

for (const target of TARGETS) {
  test(`cena curada de ${target.theme} supera os gates sem reduzir thresholds`, () => {
    const verse = FALLBACK_VERSES.find(item =>
      normalize(item.theme) === target.theme
    );
    assert.ok(verse, `versículo ausente para ${target.theme}`);

    const intent = analyzeVerse(verse);
    const candidate = CURATED_VISUALS.find(item =>
      item.id === target.visualId
    );
    assert.ok(candidate, `visual ausente: ${target.visualId}`);

    const scored = scoreCandidate(candidate, intent, []);

    assert.ok(
      scored.scores.semantic >= VISUAL_THRESHOLDS.semantic,
      `${target.visualId} semantic=${scored.scores.semantic}`
    );
    assert.ok(
      scored.scores.final >= VISUAL_THRESHOLDS.final,
      `${target.visualId} final=${scored.scores.final}`
    );
    assert.equal(
      scored.accepted,
      true,
      `${target.visualId}: ${scored.rejectedReasons.join(', ')}`
    );
  });
}

test('temas antes zerados passam a ter cobertura fotográfica curada real', t => {
  for (const target of TARGETS) {
    const verses = FALLBACK_VERSES.filter(item =>
      normalize(item.theme) === target.theme
    );
    assert.ok(verses.length >= 1);

    let photo = 0;
    const selectedIds = new Set();

    for (const verse of verses) {
      const intent = analyzeVerse(verse);
      const candidates = getCuratedCandidates(intent, 12);
      const { selected } = selectBestCandidate(
        candidates,
        intent,
        []
      );

      if (selected) {
        photo += 1;
        selectedIds.add(selected.candidate.id);
      }
    }

    const rate = photo / verses.length;
    t.diagnostic(
      `${target.theme}: ${photo}/${verses.length} (${(rate * 100).toFixed(1)}%) · ${[...selectedIds].join(', ')}`
    );

    assert.ok(
      photo > 0,
      `${target.theme} permaneceu com cobertura 0%`
    );
    assert.ok(
      rate >= 0.5,
      `${target.theme} cobertura insuficiente: ${(rate * 100).toFixed(1)}%`
    );
  }
});

test('novas cenas são distintas entre os cinco temas', () => {
  const ids = TARGETS.map(target => target.visualId);
  assert.equal(new Set(ids).size, TARGETS.length);

  const sceneSignatures = TARGETS.map(target => {
    const candidate = CURATED_VISUALS.find(item =>
      item.id === target.visualId
    );
    return [
      candidate.description,
      ...(candidate.tags || [])
    ].join(' ').toLowerCase();
  });

  assert.equal(new Set(sceneSignatures).size, TARGETS.length);
});

test('novas cenas possuem composição independente para desktop tablet e mobile', () => {
  for (const target of TARGETS) {
    const candidate = CURATED_VISUALS.find(item =>
      item.id === target.visualId
    );

    assert.ok(candidate.focalPoint);
    assert.ok(candidate.tabletFocalPoint);
    assert.ok(candidate.mobileFocalPoint);
    assert.ok(candidate.safeTextAreas?.length);
    assert.ok(candidate.tabletSafeTextAreas?.length);
    assert.ok(candidate.mobileSafeTextAreas?.length);
  }
});
