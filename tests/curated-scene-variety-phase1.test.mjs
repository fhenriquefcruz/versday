import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeVerse } from '../js/visualIntelligence.js';
import { CURATED_VISUALS } from '../js/visualCatalog.js';
import {
  scoreCandidate,
  buildSceneSignature
} from '../js/visualSelector.js';

const CASES = [
  {
    theme: 'sabedoria',
    existingId: 'pexels-37825335',
    newId: 'pexels-35391620',
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
    theme: 'fé',
    existingId: 'pexels-4978541',
    newId: 'pexels-35222682',
    verse: {
      text: 'A fé é a certeza do que se espera e a convicção do que não se vê.',
      reference: 'hb 11:1',
      book: 'hb',
      chapter: 11,
      verse: 1,
      theme: 'fe'
    }
  },
  {
    theme: 'esperança',
    existingId: 'pexels-1493215',
    newId: 'pexels-11840887',
    verse: {
      text: 'Os que esperam no Senhor renovam as suas forças.',
      reference: 'is 40:31',
      book: 'is',
      chapter: 40,
      verse: 31,
      theme: 'esperanca'
    }
  },
  {
    theme: 'amor',
    existingId: 'pexels-29372724',
    newId: 'pexels-5082641',
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
    theme: 'conforto',
    existingId: 'pexels-6670100',
    newId: 'pexels-9002404',
    verse: {
      text: 'Deus de toda consolação, que nos consola em toda a nossa tribulação.',
      reference: '2co 1:3-4',
      book: '2co',
      chapter: 1,
      verse: 3,
      theme: 'conforto'
    }
  },
  {
    theme: 'paz',
    existingId: 'pexels-457881',
    newId: 'pexels-29567505',
    verse: {
      text: 'Em paz me deito e logo pego no sono.',
      reference: 'sl 4:8',
      book: 'sl',
      chapter: 4,
      verse: 8,
      theme: 'paz'
    }
  },
  {
    theme: 'perseverança',
    existingId: 'pexels-2540408',
    newId: 'pexels-9891886',
    verse: {
      text: 'Corramos com perseverança a carreira que nos está proposta.',
      reference: 'hb 12:1',
      book: 'hb',
      chapter: 12,
      verse: 1,
      theme: 'superacao'
    }
  }
];

for (const item of CASES) {
  test(`${item.theme} possui segunda fotografia aceita em família de cena distinta`, () => {
    const intent = analyzeVerse(item.verse);
    const existing = CURATED_VISUALS.find(
      candidate => candidate.id === item.existingId
    );
    const alternative = CURATED_VISUALS.find(
      candidate => candidate.id === item.newId
    );

    assert.ok(existing, `existente ausente: ${item.existingId}`);
    assert.ok(alternative, `alternativa ausente: ${item.newId}`);

    const result = scoreCandidate(alternative, intent, []);

    assert.equal(
      result.accepted,
      true,
      `${item.newId}: ${result.rejectedReasons.join(', ')} · semantic=${result.scores.semantic} final=${result.scores.final}`
    );
    assert.ok(result.scores.semantic >= 0.72);
    assert.ok(result.scores.final >= 0.74);

    assert.notEqual(
      buildSceneSignature(existing),
      buildSceneSignature(alternative),
      `${item.theme} ainda usa a mesma família de cena`
    );
  });
}

test('novas alternativas possuem sceneFamily explícita e composição responsiva completa', () => {
  const newIds = CASES.map(item => item.newId);

  for (const id of newIds) {
    const candidate = CURATED_VISUALS.find(
      item => item.id === id
    );

    assert.ok(candidate.sceneFamily, `sceneFamily ausente: ${id}`);
    assert.ok(candidate.focalPoint);
    assert.ok(candidate.tabletFocalPoint);
    assert.ok(candidate.mobileFocalPoint);
    assert.ok(candidate.safeTextAreas?.length);
    assert.ok(candidate.tabletSafeTextAreas?.length);
    assert.ok(candidate.mobileSafeTextAreas?.length);
  }
});
