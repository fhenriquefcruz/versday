import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeVerse } from '../js/visualIntelligence.js';
import { CURATED_VISUALS } from '../js/visualCatalog.js';
import { scoreCandidate } from '../js/visualSelector.js';

const CASES = [
  {
    theme: 'sabedoria',
    expectedId: 'pexels-37825335',
    verse: {
      text: 'O temor do Senhor é o princípio da sabedoria.',
      reference: 'pv 9:10',
      book: 'pv',
      chapter: 9,
      verse: 10,
      theme: 'sabedoria'
    }
  },
  {
    theme: 'amor',
    expectedId: 'pexels-29372724',
    verse: {
      text: 'O amor é paciente, o amor é bondoso.',
      reference: '1co 13:4',
      book: '1co',
      chapter: 13,
      verse: 4,
      theme: 'amor'
    }
  },
  {
    theme: 'perseverança',
    expectedId: 'pexels-2540408',
    verse: {
      text: 'Corramos com perseverança a carreira que nos está proposta.',
      reference: 'hb 12:1',
      book: 'hb',
      chapter: 12,
      verse: 1,
      theme: 'superacao'
    }
  },
  {
    theme: 'perdão',
    expectedId: 'pexels-4746768',
    verse: {
      text: 'Perdoai-vos uns aos outros, como Deus vos perdoou.',
      reference: 'ef 4:32',
      book: 'ef',
      chapter: 4,
      verse: 32,
      theme: 'perdao'
    }
  }
];

for (const item of CASES) {
  test(`cena curada de ${item.theme} passa por semântica, qualidade e composição`, () => {
    const intent = analyzeVerse(item.verse);
    const candidate = CURATED_VISUALS.find(
      entry => entry.id === item.expectedId
    );

    assert.ok(candidate, `candidato ausente: ${item.expectedId}`);

    const result = scoreCandidate(candidate, intent, []);

    assert.equal(
      result.accepted,
      true,
      `${item.expectedId}: ${result.rejectedReasons.join(', ')} · semantic=${result.scores.semantic} final=${result.scores.final}`
    );
    assert.ok(result.scores.semantic >= 0.72);
    assert.ok(result.scores.final >= 0.74);
    assert.ok(result.scores.composition >= 0.70);
  });
}

test('novas cenas não usam um único visual genérico para temas distintos', () => {
  const ids = CASES.map(item => item.expectedId);
  assert.equal(new Set(ids).size, CASES.length);
});

test('novas cenas possuem focais independentes para desktop tablet e mobile', () => {
  for (const item of CASES) {
    const candidate = CURATED_VISUALS.find(
      entry => entry.id === item.expectedId
    );

    assert.ok(candidate.focalPoint);
    assert.ok(candidate.tabletFocalPoint);
    assert.ok(candidate.mobileFocalPoint);
    assert.ok(candidate.safeTextAreas?.length);
    assert.ok(candidate.tabletSafeTextAreas?.length);
    assert.ok(candidate.mobileSafeTextAreas?.length);
  }
});
