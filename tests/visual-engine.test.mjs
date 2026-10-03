import test from 'node:test';
import assert from 'node:assert/strict';

import { FALLBACK_VERSES } from '../js/fallbackVerses.js';
import {
  analyzeVerse,
  buildVisualQueries,
  buildAbstractVisual
} from '../js/visualIntelligence.js';
import { getCuratedCandidates } from '../js/visualCatalog.js';
import { selectBestCandidate, scoreCandidate } from '../js/visualSelector.js';

test('benchmark possui pelo menos 100 passagens reais', () => {
  assert.ok(FALLBACK_VERSES.length >= 100, `benchmark insuficiente: ${FALLBACK_VERSES.length}`);
});

test('todas as passagens produzem intenção visual estruturada e queries ricas', () => {
  for (const verse of FALLBACK_VERSES) {
    const intent = analyzeVerse(verse);
    const queries = buildVisualQueries(intent);

    assert.equal(intent.verseReference, verse.reference);
    assert.ok(intent.semantic.primaryTheme);
    assert.ok(['literal', 'conceptual', 'abstract', 'hybrid'].includes(intent.representation.mode));
    assert.ok(intent.visualIntent.description.length > 20);
    assert.ok(intent.visualIntent.negativeConcepts.length >= 2);
    assert.ok(intent.photography.paletteHints.length >= 4);
    assert.ok(intent.confidence >= 0.6);

    assert.ok(queries.length >= 1 && queries.length <= 3);
    for (const query of queries) {
      assert.ok(query.query.split(/\s+/).length >= 10, `query simplista em ${verse.reference}`);
      assert.notEqual(query.query.trim().toLowerCase(), String(verse.theme || '').toLowerCase());
    }

    const abstract = buildAbstractVisual(intent);
    assert.equal(abstract.mode, 'abstract');
    assert.ok(abstract.cssBackground.includes('gradient'));
  }
});

test('termos literais não são detectados dentro de outras palavras', () => {
  const intent = analyzeVerse({
    text: 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.',
    reference: 'pv 3:5-6',
    book: 'pv',
    chapter: 3,
    verse: 5,
    theme: 'confianca'
  });

  assert.ok(!intent.representation.literalElements.includes('água'));
  assert.ok(!intent.representation.literalElements.includes('mar'));
});

test('luz metafórica não é convertida cegamente em elemento físico', () => {
  const intent = analyzeVerse({
    text: 'A luz resplandece nas trevas, e as trevas não prevaleceram contra ela.',
    reference: 'jo 1:5',
    book: 'jo',
    chapter: 1,
    verse: 5,
    theme: 'luz'
  });

  assert.ok(intent.representation.symbolicElements.some(item => item.includes('metáfora')));
  assert.ok(!intent.representation.literalElements.includes('luz'));
});

test('pastoreio literal encontra fotografia pastoral coerente', () => {
  const verse = {
    text: 'O Senhor é o meu pastor; nada me faltará. Em verdes pastos me faz repousar.',
    reference: 'sl 23:1-2',
    book: 'sl',
    chapter: 23,
    verse: 1,
    theme: 'pastor'
  };
  const intent = analyzeVerse(verse);
  const candidates = getCuratedCandidates();
  const { selected } = selectBestCandidate(candidates, intent, []);

  assert.ok(selected);
  assert.equal(selected.candidate.id, 'pexels-pastoral-115141');
  assert.ok(selected.scores.semantic >= 0.72);
});

test('confiança abstrata não aceita montanha/estrada apenas por serem bonitas', () => {
  const verse = {
    text: 'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.',
    reference: 'pv 3:5',
    book: 'pv',
    chapter: 3,
    verse: 5,
    theme: 'confianca'
  };
  const intent = analyzeVerse(verse);
  const { selected } = selectBestCandidate(getCuratedCandidates(), intent, []);

  assert.equal(selected, null);
});

test('qualidade estética não mascara baixa coerência semântica', () => {
  const intent = analyzeVerse({
    text: 'Bem-aventurados os que choram, porque serão consolados.',
    reference: 'mt 5:4',
    book: 'mt',
    chapter: 5,
    verse: 4,
    theme: 'conforto'
  });

  const beautifulButWrong = {
    id: 'wrong-party',
    tags: ['festa', 'multidão', 'celebração'],
    moods: ['eufórico', 'alegre'],
    representationModes: ['conceptual'],
    safeTextAreas: ['center'],
    mobileFocalPoint: { x: 0.5, y: 0.5 },
    qualityScore: 1,
    compositionScore: 1,
    identityScore: 1,
    negativeTags: ['conforto']
  };

  const scored = scoreCandidate(beautifulButWrong, intent, []);
  assert.equal(scored.accepted, false);
  assert.ok(scored.rejectedReasons.includes('EMOTIONAL_MISMATCH'));
  assert.ok(scored.rejectedReasons.includes('SEMANTIC_MISMATCH'));
});

test('memória de novidade reduz repetição sem superar semântica', () => {
  const verse = {
    text: 'O Senhor é o meu pastor; nada me faltará. Em verdes pastos me faz repousar.',
    reference: 'sl 23:1-2',
    book: 'sl',
    chapter: 23,
    verse: 1,
    theme: 'pastor'
  };
  const intent = analyzeVerse(verse);
  const candidate = getCuratedCandidates().find(item => item.id === 'pexels-pastoral-115141');

  const fresh = scoreCandidate(candidate, intent, []);
  const repeated = scoreCandidate(candidate, intent, [candidate.id]);

  assert.ok(fresh.scores.final > repeated.scores.final);
  assert.equal(fresh.scores.semantic, repeated.scores.semantic);
});
