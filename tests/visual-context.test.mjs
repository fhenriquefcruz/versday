import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeVerse, buildVisualQueries } from '../js/visualIntelligence.js';
import {
  resolveBiblicalContext,
  enrichVisualIntentWithContext,
  enrichQueriesWithContext
} from '../js/biblicalContext.js';

test('contexto de João 1 impede leitura visual de amanhecer literal', () => {
  const verse = {
    text:'A luz resplandece nas trevas, e as trevas não prevaleceram contra ela.',
    reference:'jo 1:5',
    book:'jo',
    chapter:1,
    verse:5,
    theme:'luz'
  };

  const context = resolveBiblicalContext(verse);
  assert.match(context.text, /revelação|teológico|trevas/i);
  assert.match(context.visualHint, /symbolic light/i);
  assert.match(context.source, /curated-context/);

  const intent = enrichVisualIntentWithContext(analyzeVerse(verse), verse);
  assert.equal(intent.biblicalContext.narrativeSituation, 'prólogo teológico e poético');
  assert.ok(intent.biblicalContext.characters.length >= 1);

  const queries = enrichQueriesWithContext(buildVisualQueries(intent), intent);
  assert.ok(queries.every(item => item.query.includes('symbolic light')));
});

test('contexto local agrega versículos próximos quando existem no acervo', () => {
  const verse = {
    text:'Bem-aventurados os que choram, porque serão consolados.',
    reference:'mt 5:4',
    book:'mt',
    chapter:5,
    verse:4,
    theme:'conforto'
  };

  const context = resolveBiblicalContext(verse);
  assert.ok(Array.isArray(context.nearbyVerses));
  assert.ok(context.nearbyVerses.length >= 1);
  assert.ok(context.text.length > verse.text.length);
});
