import test from 'node:test';
import assert from 'node:assert/strict';

import { FALLBACK_VERSES } from '../js/fallbackVerses.js';
import {
  analyzeVerse,
  buildVisualQueries,
  buildAbstractVisual
} from '../js/visualIntelligence.js';
import { CURATED_VISUALS, getCuratedCandidates } from '../js/visualCatalog.js';
import { hardFilterCandidate, selectBestCandidate, scoreCandidate } from '../js/visualSelector.js';

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

    assert.ok(queries.length >= 1 && queries.length <= 4);
    for (const query of queries) {
      assert.ok(query.query.split(/\s+/).length >= 10, `query simplista em ${verse.reference}`);
      assert.notEqual(query.query.trim().toLowerCase(), String(verse.theme || '').toLowerCase());
    }

    const abstract = buildAbstractVisual(intent);
    assert.equal(abstract.mode, 'abstract');
    assert.ok(abstract.cssBackground.includes('gradient'));
  }
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
  assert.equal(selected.candidate.id, 'pexels-115141');
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
  const candidate = getCuratedCandidates().find(item => item.id === 'pexels-115141');

  const fresh = scoreCandidate(candidate, intent, []);
  const repeated = scoreCandidate(candidate, intent, [candidate.id]);

  assert.ok(fresh.scores.final > repeated.scores.final);
  assert.equal(fresh.scores.semantic, repeated.scores.semantic);
});


test('acervo curado premium possui pelo menos 18 imagens classificadas', () => {
  assert.ok(CURATED_VISUALS.length >= 18);
  for (const candidate of CURATED_VISUALS) {
    assert.ok(candidate.imageUrl);
    assert.ok(candidate.themes.length >= 1);
    assert.ok(candidate.tags.length >= 3);
    assert.ok(candidate.moods.length >= 1);
    assert.ok(candidate.safeTextAreas.length >= 1);
    assert.ok(candidate.focalPoint);
    assert.ok(candidate.mobileFocalPoint);
  }
});

test('contexto bíblico curado entra na intenção antes da busca visual', () => {
  const intent = analyzeVerse({
    text: 'O Senhor é o meu pastor; nada me faltará.',
    reference: 'sl 23:1',
    book: 'sl',
    chapter: 23,
    verse: 1,
    theme: 'pastor'
  });

  assert.equal(intent.biblicalContext.contextSource, 'curated-context');
  assert.match(intent.biblicalContext.surroundingContext, /pastoral/i);
  assert.ok(intent.biblicalContext.characters.length >= 1);
});

test('metáfora com elemento visual forte pode usar representação literal deliberada', () => {
  const intent = analyzeVerse({
    text: 'Eu sou a videira, vós, os ramos; quem permanece em mim dá muito fruto.',
    reference: 'jo 15:5',
    book: 'jo',
    chapter: 15,
    verse: 5,
    theme: 'confianca'
  });

  assert.equal(intent.representation.mode, 'literal');
  assert.ok(intent.representation.literalElements.includes('vinha'));
});

test('hard filters removem watermark, baixa resolução e clichê religioso automático', () => {
  const intent = analyzeVerse({
    text: 'Confia no Senhor de todo o teu coração.',
    reference: 'pv 3:5',
    book: 'pv',
    chapter: 3,
    verse: 5,
    theme: 'confianca'
  });

  const technical = hardFilterCandidate({
    id: 'bad-tech',
    imageUrl: 'https://example.com/bad.jpg',
    width: 640,
    height: 480,
    hasWatermark: true
  }, intent);

  assert.equal(technical.accepted, false);
  assert.ok(technical.reasons.includes('WATERMARK'));
  assert.ok(technical.reasons.includes('LOW_RESOLUTION'));

  const cliche = hardFilterCandidate({
    id: 'cross-cliche',
    imageUrl: 'https://example.com/cross.jpg',
    width: 2400,
    height: 1600,
    tags: ['cross', 'sunset'],
    description: 'large cross at sunset'
  }, intent);

  assert.equal(cliche.accepted, false);
  assert.ok(cliche.reasons.includes('RELIGIOUS_CLICHE'));
});

test('clichê religioso só é permitido quando o elemento é literal e explícito', () => {
  const intent = analyzeVerse({
    text: 'Tome a sua cruz e siga-me.',
    reference: 'mt 16:24',
    book: 'mt',
    chapter: 16,
    verse: 24,
    theme: 'fe'
  });

  const literalCross = hardFilterCandidate({
    id: 'literal-cross',
    imageUrl: 'https://example.com/cross.jpg',
    width: 2400,
    height: 1600,
    tags: ['cross', 'wood'],
    description: 'wooden cross in restrained natural light'
  }, intent);

  assert.equal(literalCross.accepted, true);
});

test('foto bonita e sem contradição explícita ainda falha quando é semanticamente irrelevante', () => {
  const intent = analyzeVerse({
    text: 'Se confessarmos os nossos pecados, ele é fiel e justo para nos perdoar.',
    reference: '1jo 1:9',
    book: '1jo',
    chapter: 1,
    verse: 9,
    theme: 'perdao'
  });

  const scored = scoreCandidate({
    id: 'beautiful-unrelated',
    imageUrl: 'https://example.com/architecture.jpg',
    width: 4000,
    height: 2600,
    tags: ['architecture', 'glass', 'city'],
    moods: ['neutral'],
    representationModes: ['conceptual'],
    safeTextAreas: ['center'],
    focalPoint: { x: 0.5, y: 0.5 },
    mobileFocalPoint: { x: 0.5, y: 0.5 },
    qualityScore: 1,
    compositionScore: 1,
    identityScore: 1
  }, intent, []);

  assert.equal(scored.accepted, false);
  assert.ok(scored.rejectedReasons.includes('SEMANTIC_MISMATCH'));
});

test('acervo curado cobre temas humanos sem forçar temas sensíveis', () => {
  const themes = new Set(
    CURATED_VISUALS.flatMap(candidate => candidate.themes)
  );

  for (const theme of [
    'alegria',
    'gratidão',
    'relacionamento',
    'reconciliação',
    'sofrimento',
    'lamento',
    'justiça'
  ]) {
    assert.ok(themes.has(theme), `tema curado ausente: ${theme}`);
  }

  for (const abstractFirst of [
    'morte',
    'guerra',
    'julgamento',
    'profecia',
    'ressurreição'
  ]) {
    assert.equal(
      themes.has(abstractFirst),
      false,
      `tema sensível deve permanecer abstract-first: ${abstractFirst}`
    );
  }
});

test('confiança de curadoria só ajuda quando o tema primário coincide', () => {
  const intent = analyzeVerse({
    text: 'Confia no Senhor de todo o teu coração.',
    reference: 'pv 3:5',
    book: 'pv',
    chapter: 3,
    verse: 5,
    theme: 'confianca'
  });

  const unrelated = scoreCandidate({
    id: 'curated-but-wrong',
    imageUrl: 'https://example.com/joy.jpg',
    width: 3000,
    height: 2000,
    themes: ['alegria'],
    tags: ['alegria', 'authentic joy', 'natural light'],
    moods: ['luminoso', 'vivo', 'leve'],
    representationModes: ['conceptual'],
    safeTextAreas: ['center'],
    focalPoint: { x: 0.5, y: 0.5 },
    mobileFocalPoint: { x: 0.5, y: 0.5 },
    qualityScore: 0.95,
    compositionScore: 0.95,
    identityScore: 0.95,
    curationConfidence: 1
  }, intent, []);

  assert.equal(unrelated.scores.curation, 0);
  assert.equal(unrelated.accepted, false);
  assert.ok(unrelated.rejectedReasons.includes('SEMANTIC_MISMATCH'));
});

test('novas fotos curadas conseguem superar o limiar apenas com alinhamento semântico forte', () => {
  const cases = [
    {
      theme: 'gratidao',
      text: 'Em tudo dai graças.',
      reference: '1ts 5:18',
      expectedId: 'pexels-9511828'
    },
    {
      theme: 'relacionamento',
      text: 'Levai as cargas uns dos outros.',
      reference: 'gl 6:2',
      expectedId: 'pexels-5055239'
    },
    {
      theme: 'sofrimento',
      text: 'Os sofrimentos do tempo presente não podem ser comparados com a glória a ser revelada.',
      reference: 'rm 8:18',
      expectedId: 'pexels-6670100'
    },
    {
      theme: 'lamento',
      text: 'Junto aos rios da Babilônia nos assentamos e choramos.',
      reference: 'sl 137:1',
      expectedId: 'pexels-5028920'
    },
    {
      theme: 'justica',
      text: 'Não façais acepção de pessoas.',
      reference: 'tg 2:1',
      expectedId: 'pexels-6994855'
    }
  ];

  for (const item of cases) {
    const intent = analyzeVerse({
      text: item.text,
      reference: item.reference,
      book: item.reference.split(' ')[0],
      chapter: Number(item.reference.match(/\d+/)?.[0] || 1),
      verse: 1,
      theme: item.theme
    });

    const candidate = CURATED_VISUALS.find(entry => entry.id === item.expectedId);
    assert.ok(candidate, `candidato ausente: ${item.expectedId}`);

    const scored = scoreCandidate(candidate, intent, []);
    assert.ok(
      scored.scores.semantic >= 0.72,
      `${item.expectedId} semantic=${scored.scores.semantic}`
    );
    assert.equal(scored.accepted, true, `${item.expectedId}: ${scored.rejectedReasons.join(', ')}`);
  }
});
