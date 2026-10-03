import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeVerse } from '../js/visualIntelligence.js';
import { scoreCandidate } from '../js/visualSelector.js';

function trustIntent(purpose = 'background') {
  return {
    ...analyzeVerse({
      text:'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.',
      reference:'pv 3:5-6',
      book:'pv',
      chapter:3,
      verse:5,
      theme:'confianca'
    }),
    visualPurpose:purpose
  };
}

test('clichê religioso é rejeitado mesmo quando veio da query correta', () => {
  const intent = trustIntent();
  const scored = scoreCandidate({
    id:'wrong-cross',
    imageUrl:'https://example.com/cross.jpg',
    width:4000,
    height:2667,
    description:'large cross at sunset with dramatic light',
    tags:['confiança','cross','sunset'],
    searchIntentTheme:intent.semantic.primaryTheme,
    queryMoods:[...intent.semantic.emotionalTone],
    representationModes:['conceptual'],
    providerSearchScore:0.95,
    qualityScore:1,
    compositionScore:1,
    technicalAnalysis:{ complexity:0.2 }
  }, intent, []);

  assert.equal(scored.accepted, false);
  assert.ok(scored.rejectedReasons.includes('RELIGIOUS_OR_STOCK_CLICHE'));
});

test('candidato coerente pode passar sem depender de keyword isolada', () => {
  const intent = trustIntent();
  const scored = scoreCandidate({
    id:'refuge',
    imageUrl:'https://example.com/refuge.jpg',
    width:3600,
    height:2400,
    description:'protected shelter in difficult weather quiet path restrained editorial atmosphere',
    tags:['confiança','shelter','path','weather'],
    searchIntentTheme:intent.semantic.primaryTheme,
    queryMoods:[...intent.semantic.emotionalTone],
    moods:['sereno','encorajador'],
    representationModes:['conceptual'],
    providerSearchScore:0.94,
    qualityScore:0.95,
    compositionScore:0.9,
    identityScore:0.92,
    technicalAnalysis:{ complexity:0.32 }
  }, intent, []);

  assert.ok(scored.scores.semantic >= 0.72, JSON.stringify({ semantic:intent.semantic, representation:intent.representation, scores:scored.scores, rejected:scored.rejectedReasons }));
  assert.ok(scored.scores.final >= 0.74);
  assert.equal(scored.accepted, true);
});

test('share portrait penaliza fotografia landscape extrema', () => {
  const candidate = {
    id:'landscape',
    imageUrl:'https://example.com/landscape.jpg',
    width:4000,
    height:1800,
    description:'protected shelter difficult weather quiet path',
    tags:['confiança','shelter','path'],
    searchIntentTheme:'confiança',
    queryMoods:['seguro','sereno','encorajador'],
    representationModes:['conceptual'],
    providerSearchScore:0.94,
    qualityScore:0.96,
    compositionScore:0.88,
    technicalAnalysis:{ complexity:0.3 }
  };

  const background = scoreCandidate(candidate, trustIntent('background'), []);
  const portrait = scoreCandidate(candidate, trustIntent('share-portrait'), []);

  assert.ok(background.scores.responsive > portrait.scores.responsive);
  assert.ok(portrait.scores.responsive <= 0.5);
});
