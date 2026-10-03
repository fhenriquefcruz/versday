import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeVerseVisualIntent } from '../js/visual-semantic.js';
import { scoreCandidate, passesSelectionThreshold } from '../js/visual-scoring.js';

const verse={text:'O Senhor é o meu pastor; nada me faltará.',reference:'sl 23:1',book:'sl',chapter:23,verse:1,theme:'pastor'};
const intent=analyzeVerseVisualIntent(verse);

test('candidato coerente e curado passa o threshold', () => {
  const scored=scoreCandidate({
    id:'good', imageUrl:'https://example.com/good.jpg', width:2000,height:1333,
    themes:['pastor'],tags:['sheep','pasture','meadow'],moods:['pastoral','sereno','protetor'],
    qualityScore:.94,compositionScore:.9,safeAreas:['upper-right'],focalPoint:{x:.5,y:.5},curated:true
  },intent);
  assert.ok(scored.dimensions.semantic >= .72);
  assert.ok(passesSelectionThreshold(scored,intent));
});

test('foto bonita porém semanticamente errada é rejeitada', () => {
  const scored=scoreCandidate({
    id:'wrong',imageUrl:'https://example.com/wrong.jpg',width:5000,height:3333,
    themes:['alegria'],tags:['party','confetti','city'],moods:['festivo'],
    qualityScore:1,compositionScore:1,safeAreas:['center'],focalPoint:{x:.5,y:.5},curated:true
  },intent);
  assert.ok(scored.dimensions.quality >= .9);
  assert.ok(scored.rejectionReasons.includes('SEMANTIC_MISMATCH'));
  assert.equal(passesSelectionThreshold(scored,intent),false);
});

test('hard filters eliminam watermark e baixa resolução', () => {
  const scored=scoreCandidate({id:'bad',imageUrl:'x',width:600,height:400,hasWatermark:true},intent);
  assert.equal(scored.rejected,true);
  assert.ok(scored.rejectionReasons.includes('WATERMARK'));
  assert.ok(scored.rejectionReasons.includes('LOW_RESOLUTION'));
});
