import test from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeVerse,
  getThemeProfile
} from '../js/visualIntelligence.js';
import { CURATED_VISUALS } from '../js/visualCatalog.js';
import { scoreCandidate } from '../js/visualSelector.js';

test('luz possui perfil semântico próprio e não cai mais em fé', () => {
  const profile = getThemeProfile('luz');
  assert.equal(profile.primaryTheme, 'luz');
  assert.match(profile.visualIntent, /iluminação|revelação/i);
  assert.ok(profile.avoid.includes('raios divinos artificiais'));
});

test('cena de fé passa pelos gates sem usar estrada ou clichê religioso', () => {
  const intent = analyzeVerse({
    text: 'A fé é a certeza do que se espera e a convicção do que não se vê.',
    reference: 'hb 11:1',
    book: 'hb',
    chapter: 11,
    verse: 1,
    theme: 'fe'
  });

  const candidate = CURATED_VISUALS.find(
    item => item.id === 'pexels-4978541'
  );
  assert.ok(candidate);

  const result = scoreCandidate(candidate, intent, []);

  assert.equal(
    result.accepted,
    true,
    result.rejectedReasons.join(', ')
  );
  assert.ok(result.scores.semantic >= 0.72);
  assert.ok(result.scores.final >= 0.74);
  assert.equal(candidate.tags.includes('road'), false);
  assert.equal(candidate.tags.includes('cross'), false);
});

test('cena de luz passa como iluminação natural física e sem efeito celestial', () => {
  const intent = analyzeVerse({
    text: 'A luz resplandece nas trevas, e as trevas não prevaleceram contra ela.',
    reference: 'jo 1:5',
    book: 'jo',
    chapter: 1,
    verse: 5,
    theme: 'luz'
  });

  assert.equal(intent.semantic.primaryTheme, 'luz');

  const candidate = CURATED_VISUALS.find(
    item => item.id === 'pexels-18820283'
  );
  assert.ok(candidate);

  const result = scoreCandidate(candidate, intent, []);

  assert.equal(
    result.accepted,
    true,
    result.rejectedReasons.join(', ')
  );
  assert.ok(result.scores.semantic >= 0.72);
  assert.ok(result.scores.final >= 0.74);
  assert.ok(
    candidate.tags.includes('natural light')
  );
});

test('fé e luz usam fotografias diferentes e focais responsivos próprios', () => {
  const faith = CURATED_VISUALS.find(
    item => item.id === 'pexels-4978541'
  );
  const light = CURATED_VISUALS.find(
    item => item.id === 'pexels-18820283'
  );

  assert.notEqual(faith.id, light.id);

  for (const candidate of [faith, light]) {
    assert.ok(candidate.focalPoint);
    assert.ok(candidate.tabletFocalPoint);
    assert.ok(candidate.mobileFocalPoint);
    assert.ok(candidate.safeTextAreas?.length);
    assert.ok(candidate.tabletSafeTextAreas?.length);
    assert.ok(candidate.mobileSafeTextAreas?.length);
  }
});
