import test from 'node:test';
import assert from 'node:assert/strict';

import { FALLBACK_VERSES } from '../js/fallbackVerses.js';
import { analyzeVerse } from '../js/visualIntelligence.js';
import { CURATED_VISUALS } from '../js/visualCatalog.js';
import {
  rankCandidates,
  buildSceneSignature
} from '../js/visualSelector.js';

const ABSTRACT_FIRST_THEMES = new Set([
  'morte',
  'guerra',
  'julgamento',
  'profecia',
  'ressurreicao',
  'lamento'
]);

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function evaluateCuratedVariety(
  verses = FALLBACK_VERSES
) {
  const byTheme = new Map();

  for (const verse of verses) {
    const intent = analyzeVerse(verse);
    const theme = normalize(
      intent.semantic?.primaryTheme ||
      verse.theme ||
      'uncategorized'
    );

    const entry = byTheme.get(theme) || {
      theme,
      verseCount: 0,
      acceptedIds: new Set(),
      sceneFamilies: new Set(),
      acceptedByReference: new Map()
    };

    entry.verseCount += 1;

    const ranked = rankCandidates(
      CURATED_VISUALS,
      intent,
      []
    );
    const accepted = ranked.filter(item => item.accepted);

    entry.acceptedByReference.set(
      verse.reference,
      accepted.map(item => item.candidate.id)
    );

    for (const item of accepted) {
      entry.acceptedIds.add(item.candidate.id);
      entry.sceneFamilies.add(
        item.candidate.sceneFamily ||
        buildSceneSignature(item.candidate)
      );
    }

    byTheme.set(theme, entry);
  }

  return [...byTheme.values()]
    .map(item => {
      const highFrequency =
        item.verseCount >= 8 &&
        !ABSTRACT_FIRST_THEMES.has(item.theme);

      return {
        theme: item.theme,
        verseCount: item.verseCount,
        uniqueAcceptedPhotos: item.acceptedIds.size,
        uniqueSceneFamilies: item.sceneFamilies.size,
        highFrequency,
        varietyRisk:
          highFrequency &&
          (
            item.acceptedIds.size < 2 ||
            item.sceneFamilies.size < 2
          ),
        acceptedIds: [...item.acceptedIds].sort(),
        sceneFamilies: [...item.sceneFamilies].sort(),
        acceptedByReference: Object.fromEntries(
          item.acceptedByReference
        )
      };
    })
    .sort((a, b) => {
      if (a.varietyRisk !== b.varietyRisk) {
        return a.varietyRisk ? -1 : 1;
      }
      if (a.verseCount !== b.verseCount) {
        return b.verseCount - a.verseCount;
      }
      return a.theme.localeCompare(b.theme);
    });
}

test('audit de variedade curada permanece calculável e não força temas sensíveis', t => {
  const report = evaluateCuratedVariety();

  assert.ok(report.length >= 15);

  const highFrequency = report.filter(
    item => item.highFrequency
  );
  assert.ok(highFrequency.length >= 5);

  for (const item of report) {
    if (ABSTRACT_FIRST_THEMES.has(item.theme)) {
      assert.equal(item.highFrequency, false);
      assert.equal(item.varietyRisk, false);
    }

    const status = item.varietyRisk
      ? 'VARIETY_RISK'
      : 'ok';

    t.diagnostic(
      [
        item.theme,
        `verses=${item.verseCount}`,
        `photos=${item.uniqueAcceptedPhotos}`,
        `scenes=${item.uniqueSceneFamilies}`,
        status,
        `ids=${item.acceptedIds.join(',') || 'none'}`
      ].join(' · ')
    );
  }
});

test('audit mede candidatos aceitos, não somente o vencedor repetido', () => {
  const report = evaluateCuratedVariety();
  const wisdom = report.find(
    item => item.theme === 'sabedoria'
  );

  assert.ok(wisdom);
  assert.equal(wisdom.verseCount, 20);
  assert.ok(
    wisdom.uniqueAcceptedPhotos >= 1,
    'sabedoria deve ter pelo menos uma foto aceita'
  );
});
