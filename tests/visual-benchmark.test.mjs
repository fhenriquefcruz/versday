import test from 'node:test';
import assert from 'node:assert/strict';

import { FALLBACK_VERSES } from '../js/fallbackVerses.js';
import {
  analyzeVerse,
  buildVisualQueries,
  buildAbstractVisual
} from '../js/visualIntelligence.js';
import {
  CURATED_VISUALS,
  getCuratedCandidates
} from '../js/visualCatalog.js';
import {
  VISUAL_THRESHOLDS,
  selectBestCandidate
} from '../js/visualSelector.js';

export const VISUAL_BENCHMARK_MIN_APPROVAL = 0.95;

const REQUIRED_CATEGORIES = [
  'amor',
  'fé',
  'medo',
  'morte',
  'ressurreição',
  'perdão',
  'sabedoria',
  'justiça',
  'guerra',
  'oração',
  'alegria',
  'sofrimento',
  'esperança',
  'natureza',
  'profecia',
  'narrativa',
  'poesia',
  'epístolas'
];

const EDGE_CASES = [
  {
    text: 'O amor é paciente e bondoso.',
    reference: '1co 13:4',
    book: '1co',
    chapter: 13,
    verse: 4,
    theme: 'amor',
    benchmarkCategory: 'amor'
  },
  {
    text: 'A fé é a certeza do que se espera.',
    reference: 'hb 11:1',
    book: 'hb',
    chapter: 11,
    verse: 1,
    theme: 'fe',
    benchmarkCategory: 'fé'
  },
  {
    text: 'Em me vindo o temor, hei de confiar em ti.',
    reference: 'sl 56:3',
    book: 'sl',
    chapter: 56,
    verse: 3,
    theme: 'confianca',
    benchmarkCategory: 'medo'
  },
  {
    text: 'Nem a morte poderá separar-nos do amor de Deus.',
    reference: 'rm 8:38',
    book: 'rm',
    chapter: 8,
    verse: 38,
    theme: 'morte',
    benchmarkCategory: 'morte'
  },
  {
    text: 'Ele não está aqui; ressuscitou.',
    reference: 'mt 28:6',
    book: 'mt',
    chapter: 28,
    verse: 6,
    theme: 'ressurreicao',
    benchmarkCategory: 'ressurreição'
  },
  {
    text: 'Perdoai-vos uns aos outros, como Deus vos perdoou.',
    reference: 'ef 4:32',
    book: 'ef',
    chapter: 4,
    verse: 32,
    theme: 'perdao',
    benchmarkCategory: 'perdão'
  },
  {
    text: 'O temor do Senhor é o princípio da sabedoria.',
    reference: 'pv 9:10',
    book: 'pv',
    chapter: 9,
    verse: 10,
    theme: 'sabedoria',
    benchmarkCategory: 'sabedoria'
  },
  {
    text: 'Pratica a justiça, ama a misericórdia e anda humildemente.',
    reference: 'mq 6:8',
    book: 'mq',
    chapter: 6,
    verse: 8,
    theme: 'justica',
    benchmarkCategory: 'justiça'
  },
  {
    text: 'Há tempo de guerra e tempo de paz.',
    reference: 'ec 3:8',
    book: 'ec',
    chapter: 3,
    verse: 8,
    theme: 'guerra',
    benchmarkCategory: 'guerra'
  },
  {
    text: 'Aproximem-se de Deus, e ele se aproximará de vocês.',
    reference: 'tg 4:8',
    book: 'tg',
    chapter: 4,
    verse: 8,
    theme: 'oracao',
    benchmarkCategory: 'oração'
  },
  {
    text: 'Alegrai-vos sempre no Senhor.',
    reference: 'fp 4:4',
    book: 'fp',
    chapter: 4,
    verse: 4,
    theme: 'alegria',
    benchmarkCategory: 'alegria'
  },
  {
    text: 'O sofrimento produz perseverança; e a perseverança, esperança.',
    reference: 'rm 5:3-4',
    book: 'rm',
    chapter: 5,
    verse: 3,
    theme: 'sofrimento',
    benchmarkCategory: 'sofrimento'
  },
  {
    text: 'Os que esperam no Senhor renovam as suas forças.',
    reference: 'is 40:31',
    book: 'is',
    chapter: 40,
    verse: 31,
    theme: 'esperanca',
    benchmarkCategory: 'esperança'
  },
  {
    text: 'Os céus proclamam a glória de Deus.',
    reference: 'sl 19:1',
    book: 'sl',
    chapter: 19,
    verse: 1,
    theme: 'criacao',
    benchmarkCategory: 'natureza'
  },
  {
    text: 'Um menino nos nasceu, e o governo está sobre os seus ombros.',
    reference: 'is 9:6',
    book: 'is',
    chapter: 9,
    verse: 6,
    theme: 'profecia',
    benchmarkCategory: 'profecia'
  },
  {
    text: 'Levantou-se grande tempestade, e as ondas cobriam o barco.',
    reference: 'mc 4:37',
    book: 'mc',
    chapter: 4,
    verse: 37,
    theme: 'tempestade',
    benchmarkCategory: 'narrativa'
  },
  {
    text: 'O Senhor é o meu pastor; nada me faltará.',
    reference: 'sl 23:1',
    book: 'sl',
    chapter: 23,
    verse: 1,
    theme: 'pastor',
    benchmarkCategory: 'poesia'
  },
  {
    text: 'Agora permanecem a fé, a esperança e o amor.',
    reference: '1co 13:13',
    book: '1co',
    chapter: 13,
    verse: 13,
    theme: 'amor',
    benchmarkCategory: 'epístolas'
  }
];

function queryIsRich(query) {
  return String(query?.query || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length >= 10;
}

function abstractIsSafe(visual) {
  return Boolean(
    visual &&
    visual.mode === 'abstract' &&
    Array.isArray(visual.palette) &&
    visual.palette.length >= 4 &&
    String(visual.cssBackground || '').includes('gradient') &&
    Number(visual.overlayStrength) >= 0 &&
    Number(visual.overlayStrength) <= 0.45 &&
    visual.textPlacement === 'center'
  );
}

function evaluateVerse(verse) {
  const intent = analyzeVerse(verse);
  const queries = buildVisualQueries(intent);
  const candidates = getCuratedCandidates(intent, 12);
  const { selected } = selectBestCandidate(candidates, intent, []);

  const semantic = Boolean(
    intent.semantic?.primaryTheme &&
    intent.visualIntent?.description?.length > 20 &&
    Array.isArray(intent.visualIntent?.negativeConcepts) &&
    intent.visualIntent.negativeConcepts.length >= 2 &&
    intent.confidence >= 0.6
  );

  const emotional = Boolean(
    Array.isArray(intent.semantic?.emotionalTone) &&
    intent.semantic.emotionalTone.length >= 1 &&
    Array.isArray(intent.visualIntent?.negativeConcepts) &&
    intent.visualIntent.negativeConcepts.length >= 2
  );

  const queryQuality = Boolean(
    queries.length >= 1 &&
    queries.length <= 4 &&
    queries.every(queryIsRich)
  );

  let outcome = 'abstract';
  let visualId = null;
  let quality = true;
  let composition = true;
  let legibility = true;
  let mobile = true;
  let tablet = true;
  let desktop = true;

  if (selected) {
    outcome = 'photo';
    visualId = selected.candidate.id;
    quality = selected.scores.quality >= VISUAL_THRESHOLDS.quality;
    composition =
      selected.scores.composition >= VISUAL_THRESHOLDS.composition;
    legibility =
      Array.isArray(selected.candidate.safeTextAreas) &&
      selected.candidate.safeTextAreas.length >= 1;
    mobile = Boolean(selected.candidate.mobileFocalPoint);
    tablet = Boolean(selected.candidate.tabletFocalPoint);
    desktop = Boolean(selected.candidate.focalPoint);

    if (
      selected.scores.semantic < VISUAL_THRESHOLDS.semantic ||
      selected.scores.final < VISUAL_THRESHOLDS.final
    ) {
      quality = false;
    }
  } else {
    const fallback = buildAbstractVisual(intent);
    const safe = abstractIsSafe(fallback);
    quality = safe;
    composition = safe;
    legibility = safe;
    mobile = safe;
    tablet = safe;
    desktop = safe;
  }

  const checks = {
    semantic,
    emotional,
    queryQuality,
    quality,
    composition,
    legibility,
    mobile,
    tablet,
    desktop
  };

  return {
    reference: verse.reference,
    category: verse.benchmarkCategory || verse.theme || 'uncategorized',
    outcome,
    visualId,
    checks,
    approved: Object.values(checks).every(Boolean)
  };
}

test('benchmark visual possui 150+ passagens reais e casos sensíveis dedicados', () => {
  assert.ok(FALLBACK_VERSES.length >= 150);
  assert.ok(EDGE_CASES.length >= REQUIRED_CATEGORIES.length);

  const categories = new Set(
    EDGE_CASES.map(item => item.benchmarkCategory)
  );

  for (const category of REQUIRED_CATEGORIES) {
    assert.ok(
      categories.has(category),
      `categoria obrigatória ausente: ${category}`
    );
  }
});

test('approval rate visual permanece em pelo menos 95%', t => {
  const benchmark = [
    ...FALLBACK_VERSES,
    ...EDGE_CASES
  ];

  const results = benchmark.map(evaluateVerse);
  const approved = results.filter(item => item.approved);
  const rejected = results.filter(item => !item.approved);
  const approvalRate = approved.length / results.length;

  const photoCount = results.filter(item => item.outcome === 'photo').length;
  const abstractCount = results.length - photoCount;

  t.diagnostic(
    `VersDay Visual Benchmark: ${approved.length}/${results.length} aprovados (${(approvalRate * 100).toFixed(1)}%), fotos=${photoCount}, abstratos=${abstractCount}`
  );

  if (rejected.length) {
    t.diagnostic(
      `Reprovações: ${rejected.map(item =>
        `${item.reference}[${Object.entries(item.checks)
          .filter(([, ok]) => !ok)
          .map(([name]) => name)
          .join(',')}]`
      ).join(' | ')}`
    );
  }

  assert.ok(
    approvalRate >= VISUAL_BENCHMARK_MIN_APPROVAL,
    `approval rate ${(approvalRate * 100).toFixed(1)}% abaixo do mínimo de ${VISUAL_BENCHMARK_MIN_APPROVAL * 100}%`
  );
});

test('cada categoria crítica possui ao menos um caso aprovado', () => {
  const results = EDGE_CASES.map(evaluateVerse);

  for (const category of REQUIRED_CATEGORIES) {
    const cases = results.filter(item => item.category === category);
    assert.ok(cases.length >= 1, `sem caso para ${category}`);
    assert.ok(
      cases.some(item => item.approved),
      `nenhuma saída segura para ${category}`
    );
  }
});

test('catálogo curado mantém variedade mínima de tema e composição', () => {
  const ids = new Set(CURATED_VISUALS.map(item => item.id));
  const themes = new Set(
    CURATED_VISUALS.flatMap(item => item.themes || [])
  );
  const primarySafeAreas = new Set(
    CURATED_VISUALS
      .map(item => item.safeTextAreas?.[0])
      .filter(Boolean)
  );

  assert.ok(ids.size >= 18, `imagens únicas insuficientes: ${ids.size}`);
  assert.ok(themes.size >= 20, `temas curados insuficientes: ${themes.size}`);
  assert.ok(
    primarySafeAreas.size >= 4,
    `composições primárias insuficientes: ${primarySafeAreas.size}`
  );
});