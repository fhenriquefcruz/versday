import test from 'node:test';
import assert from 'node:assert/strict';
import { FALLBACK_VERSES } from '../js/fallbackVerses.js';
import { analyzeVerseVisualIntent, buildVisualQueries } from '../js/visual-semantic.js';

const benchmark=FALLBACK_VERSES.slice(0,100);

test('benchmark visual possui pelo menos 100 passagens fixas do acervo', () => {
  assert.ok(FALLBACK_VERSES.length >= 100, `Acervo tem apenas ${FALLBACK_VERSES.length} passagens`);
  assert.equal(benchmark.length,100);
});

test('100 passagens produzem intent estruturado e queries contextualizadas', () => {
  for (const verse of benchmark) {
    const intent=analyzeVerseVisualIntent(verse);
    assert.ok(intent.verseReference);
    assert.ok(['literal','conceptual','abstract','hybrid'].includes(intent.representation.mode));
    assert.ok(intent.semantic.primaryTheme);
    assert.ok(intent.visualIntent.description.length > 20);
    assert.ok(intent.visualIntent.negativeConcepts.length >= 5);
    assert.ok(intent.photography.composition.includes('negative space'));
    const queries=buildVisualQueries(intent);
    assert.ok(queries.length >= 2, verse.reference);
    assert.ok(queries.every(q=>q.split(/\s+/).length >= 6), verse.reference);
  }
});
