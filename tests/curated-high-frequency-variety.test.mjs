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
    theme: 'sabedoria',
    visualId: 'pexels-6774430',
    sceneFamily: 'wisdom-reflective-decision'
  },
  {
    theme: 'confianca',
    visualId: 'pexels-28752538',
    sceneFamily: 'trust-guiding-lighthouse'
  },
  {
    theme: 'fe',
    visualId: 'pexels-12313073',
    sceneFamily: 'faith-misty-presence'
  },
  {
    theme: 'esperanca',
    visualId: 'pexels-11829155',
    sceneFamily: 'hope-storm-light-opening'
  },
  {
    theme: 'amor',
    visualId: 'pexels-31919075',
    sceneFamily: 'love-parent-child-care'
  },
  {
    theme: 'conforto',
    visualId: 'pexels-36037650',
    sceneFamily: 'comfort-rainy-shelter'
  },
  {
    theme: 'paz',
    visualId: 'pexels-14126667',
    sceneFamily: 'peace-sunlit-interior'
  },
  {
    theme: 'coragem',
    visualId: 'pexels-12684611',
    sceneFamily: 'courage-storm-vessel'
  },
  {
    theme: 'perseveranca',
    visualId: 'pexels-40007388',
    sceneFamily: 'perseverance-concrete-sprout'
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

test('engine visual sobe para 2.8.0 após expansão de variedade', () => {
  assert.equal(VISUAL_ENGINE_VERSION, '2.8.0');
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

test('todos os temas de alta frequência possuem duas fotos e duas famílias aceitas', t => {
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

test('memória recente consegue rotacionar para outra foto em cada tema de alta frequência', t => {
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

    const second = selectBestCandidate(
      CURATED_VISUALS,
      intent,
      recentUsage
    ).selected;

    assert.ok(second, `${target.theme}: sem alternativa após repetição`);

    t.diagnostic(
      `${target.theme}: ${candidate.id} → ${second.candidate.id}`
    );

    assert.notEqual(
      second.candidate.id,
      candidate.id,
      `${target.theme}: memória recente não conseguiu variar a foto`
    );
  }
});

test('novas famílias possuem composição desktop tablet mobile e origem Pexels', () => {
  for (const target of TARGETS) {
    const candidate = CURATED_VISUALS.find(item =>
      item.id === target.visualId
    );

    assert.match(candidate.providerUrl, /^https:\/\/www\.pexels\.com\/photo\//);
    assert.ok(candidate.focalPoint);
    assert.ok(candidate.tabletFocalPoint);
    assert.ok(candidate.mobileFocalPoint);
    assert.ok(candidate.safeTextAreas?.length);
    assert.ok(candidate.tabletSafeTextAreas?.length);
    assert.ok(candidate.mobileSafeTextAreas?.length);
  }
});
