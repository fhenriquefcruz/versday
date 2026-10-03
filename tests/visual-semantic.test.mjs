import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeVerseVisualIntent, buildVisualQueries } from '../js/visual-semantic.js';

const cases = [
  {
    name:'confiança não vira montanha automaticamente',
    verse:{text:'Confia no Senhor de todo o teu coração e não te estribes no teu próprio entendimento.',reference:'pv 3:5-6',book:'pv',chapter:3,verse:5,theme:'confianca'},
    mode:'conceptual', forbidden:['cross','bible']
  },
  {
    name:'luz espiritual permanece híbrida',
    verse:{text:'A luz resplandece nas trevas, e as trevas não prevaleceram contra ela.',reference:'jo 1:5',book:'jo',chapter:1,verse:5,theme:'luz'},
    mode:'hybrid'
  },
  {
    name:'pastoreio pode ser literal',
    verse:{text:'O Senhor é o meu pastor; nada me faltará. Ele me faz repousar em pastos verdejantes.',reference:'sl 23:1-2',book:'sl',chapter:23,verse:1,theme:'pastor'},
    mode:'literal', literal:'sheep'
  },
  {
    name:'videira respeita elemento narrativo',
    verse:{text:'Eu sou a videira, vós, os ramos; quem permanece em mim dá muito fruto.',reference:'jo 15:5',book:'jo',chapter:15,verse:5,theme:'confianca'},
    mode:'literal', literal:'vine'
  },
  {
    name:'perdão abstrato não força pomba ou pôr do sol',
    verse:{text:'Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar.',reference:'1jo 1:9',book:'1jo',chapter:1,verse:9,theme:'perdao'},
    mode:'abstract', forbidden:['dove cliché','sunrise by default']
  },
  {
    name:'aves são elemento concreto',
    verse:{text:'Olhai para as aves do céu: não semeiam, não colhem e vosso Pai celestial as sustenta.',reference:'mt 6:26',book:'mt',chapter:6,verse:26,theme:'confianca'},
    mode:'literal', literal:'bird'
  }
];

for (const item of cases) {
  test(item.name, () => {
    const intent = analyzeVerseVisualIntent(item.verse);
    assert.equal(intent.representation.mode, item.mode);
    if (item.literal) assert.ok(intent.representation.literalElements.includes(item.literal));
    for (const term of item.forbidden || []) {
      assert.ok(intent.visualIntent.negativeConcepts.some(x => x.includes(term)));
    }
    const queries = buildVisualQueries(intent);
    assert.ok(queries.length >= 2);
    assert.ok(queries.every(q => q.split(/\s+/).length >= 6));
    assert.ok(queries.every(q => !/^(faith|hope|love|prayer)$/i.test(q)));
  });
}


test('contexto pastoral é resolvido antes da intenção visual', () => {
  const intent = analyzeVerseVisualIntent({text:'O Senhor é o meu pastor; nada me faltará.',reference:'sl 23:1',book:'sl',chapter:23,verse:1,theme:'pastor'});
  assert.equal(intent.biblicalContext.contextSource,'curated-context');
  assert.match(intent.biblicalContext.surroundingContext,/pastoral/i);
  assert.ok(intent.biblicalContext.characters.length >= 1);
});
