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
  rankCandidates,
  selectBestCandidate,
  buildSceneSignature,
  buildCompositionSignature
} from '../js/visualSelector.js';

const TARGETS = [
  {
    theme: 'alegria',
    visualId: 'pexels-20243345',
    sceneFamily: 'joy-candid-friends-outdoors'
  },
  {
    theme: 'forca',
    visualId: 'pexels-33247012',
    sceneFamily: 'strength-tree-in-wind'
  },
  {
    theme: 'oracao',
    visualId: 'pexels-16634008',
    sceneFamily: 'prayer-solitary-window-contemplation'
  }
];

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function versesForTheme(theme) {
  return FALLBACK_VERSES.filter(verse => {
    const intent = analyzeVerse(verse);
    return normalize(
      intent.semantic?.primaryTheme || verse.theme
    ) === theme;
  });
}

test('engine visual sobe para 2.9.0 após variedade média', () => {
  assert.equal(VISUAL_ENGINE_VERSION, '2.9.0');
});

for (const target of TARGETS) {
  test(`segunda família de ${target.theme} passa pelos gates`, () => {
    const verse = versesForTheme(target.theme)[0];
    assert.ok(verse, `versículo ausente: ${target.theme}`);

    const intent = analyzeVerse(verse);
    const candidate = CURATED_VISUALS.find(item =>
      item.id === target.visualId
    );
    assert.ok(candidate, `visual ausente: ${target.visualId}`);
    assert.equal(candidate.sceneFamily, target.sceneFamily);

    const scored = scoreCandidate(candidate, intent, []);

    assert.ok(
      scored.scores.semantic >= VISUAL_THRESHOLDS.semantic,
      `${target.visualId} semantic=${scored.scores.semantic}; reasons=${scored.rejectedReasons.join(',')}`
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

test('alegria força e oração possuem duas fotos e duas famílias aceitas', t => {
  for (const target of TARGETS) {
    const acceptedIds = new Set();
    const sceneFamilies = new Set();

    for (const verse of versesForTheme(target.theme)) {
      const intent = analyzeVerse(verse);
      const accepted = rankCandidates(
        CURATED_VISUALS,
        intent,
        []
      ).filter(item => item.accepted);

      for (const item of accepted) {
        acceptedIds.add(item.candidate.id);
        sceneFamilies.add(
          item.candidate.sceneFamily ||
          buildSceneSignature(item.candidate)
        );
      }
    }

    t.diagnostic(
      `${target.theme}: photos=${acceptedIds.size} scenes=${sceneFamilies.size} ids=${[...acceptedIds].join(',')}`
    );

    assert.ok(
      acceptedIds.size >= 2,
      `${target.theme}: apenas ${acceptedIds.size} foto aceita`
    );
    assert.ok(
      sceneFamilies.size >= 2,
      `${target.theme}: apenas ${sceneFamilies.size} família de cena`
    );
  }
});

test('memória recente rotaciona alegria força e oração sem sair dos gates', t => {
  for (const target of TARGETS) {
    const verse = versesForTheme(target.theme)[0];
    const intent = analyzeVerse(verse);

    const first = selectBestCandidate(
      CURATED_VISUALS,
      intent,
      []
    ).selected;
    assert.ok(first, `${target.theme}: sem primeira foto`);

    const candidate = first.candidate;
    const recentUsage = [{
      visualId: candidate.id,
      photographer: candidate.photographer || null,
      sceneSignature: buildSceneSignature(candidate),
      compositionSignature: buildCompositionSignature(candidate)
    }];

    const selection = selectBestCandidate(
      CURATED_VISUALS,
      intent,
      recentUsage
    );
    const second = selection.selected;

    assert.ok(second, `${target.theme}: sem alternativa após repetição`);

    const reranked = rankCandidates(
      CURATED_VISUALS,
      intent,
      recentUsage
    ).filter(item => item.accepted).slice(0, 4);

    t.diagnostic(
      `${target.theme}: ${candidate.id} → ${second.candidate.id} · ` +
      reranked.map(item =>
        `${item.candidate.id}[sem=${item.scores.semantic},final=${item.scores.final},nov=${item.scores.novelty}]`
      ).join(' | ')
    );

    assert.notEqual(
      second.candidate.id,
      candidate.id,
      `${target.theme}: memória recente não variou a cena`
    );
    assert.ok(
      second.scores.semantic >= VISUAL_THRESHOLDS.semantic
    );
    assert.ok(
      second.scores.final >= VISUAL_THRESHOLDS.final
    );
  }
});

test('novas famílias médias têm composição responsiva e origem Pexels', () => {
  for (const target of TARGETS) {
    const candidate = CURATED_VISUALS.find(item =>
      item.id === target.visualId
    );

    assert.match(
      candidate.providerUrl,
      /^https:\/\/www\.pexels\.com\/photo\//
    );
    assert.ok(candidate.focalPoint);
    assert.ok(candidate.tabletFocalPoint);
    assert.ok(candidate.mobileFocalPoint);
    assert.ok(candidate.safeTextAreas?.length);
    assert.ok(candidate.tabletSafeTextAreas?.length);
    assert.ok(candidate.mobileSafeTextAreas?.length);
  }
});
