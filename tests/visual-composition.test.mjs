import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  chooseSafeAreas,
  scoreSafeRegions,
  inferFocalPointFromRegions
} from '../js/visual-analysis.js';
import { deriveOverlayStrength } from '../js/visualEngine.js';

const uniformRegions = [
  { name: 'upper-left', complexity: 0.28, luminance: 0.45 },
  { name: 'upper', complexity: 0.28, luminance: 0.45 },
  { name: 'upper-right', complexity: 0.28, luminance: 0.45 },
  { name: 'left', complexity: 0.28, luminance: 0.45 },
  { name: 'center', complexity: 0.28, luminance: 0.45 },
  { name: 'right', complexity: 0.28, luminance: 0.45 },
  { name: 'lower-left', complexity: 0.28, luminance: 0.45 },
  { name: 'lower', complexity: 0.28, luminance: 0.45 },
  { name: 'lower-right', complexity: 0.28, luminance: 0.45 }
];

test('safe-area focal-aware afasta texto do assunto principal', () => {
  const ranked = scoreSafeRegions(
    uniformRegions,
    { x: 0.16, y: 0.5 },
    []
  );

  assert.notEqual(ranked[0].name, 'left');
  assert.notEqual(ranked[0].name, 'upper-left');
  assert.notEqual(ranked[0].name, 'lower-left');

  const left = ranked.find(region => region.name === 'left');
  const right = ranked.find(region => region.name === 'right');
  assert.ok(right.safe > left.safe);
});

test('safe-area preserva preferência curada quando ela continua visualmente segura', () => {
  const result = chooseSafeAreas(
    uniformRegions,
    { x: 0.5, y: 0.5 },
    ['upper-left'],
    { threshold: 0.5, limit: 4 }
  );

  assert.ok(result.areas.includes('upper-left'));
});

test('overlay adaptativo aumenta em imagem clara, complexa e com pouca área segura', () => {
  const easy = deriveOverlayStrength({
    technicalAnalysis: {
      averageLuminance: 0.2,
      complexity: 0.18,
      bestSafeScore: 0.88
    },
    compositionScore: 0.92
  }, {
    scores: { composition: 0.92 }
  });

  const difficult = deriveOverlayStrength({
    technicalAnalysis: {
      averageLuminance: 0.82,
      complexity: 0.88,
      bestSafeScore: 0.42
    },
    compositionScore: 0.72
  }, {
    scores: { composition: 0.72 }
  });

  assert.ok(difficult > easy);
  assert.ok(easy >= 0.16);
  assert.ok(difficult <= 0.44);
});

test('share e background propagam placement responsivo', async () => {
  const [share, background, styles] = await Promise.all([
    readFile(new URL('../js/share.js', import.meta.url), 'utf8'),
    readFile(new URL('../js/background.js', import.meta.url), 'utf8'),
    readFile(new URL('../css/styles.css', import.meta.url), 'utf8')
  ]);

  assert.match(share, /mobileTextPlacement/);
  assert.match(share, /responsivePlacement/);
  assert.match(background, /dataset\.mobileTextPlacement/);

  for (const placement of ['left', 'right', 'upper', 'lower']) {
    assert.match(styles, new RegExp(`data-text-placement="${placement}"`));
  }
});

test('inferência de focal point preserva assunto fora do centro antes do crop', () => {
  const focal = inferFocalPointFromRegions([
    { name: 'upper-left', x: 1/6, y: 1/6, saliencyScore: 0.12 },
    { name: 'upper', x: 0.5, y: 1/6, saliencyScore: 0.15 },
    { name: 'upper-right', x: 5/6, y: 1/6, saliencyScore: 0.22 },
    { name: 'left', x: 1/6, y: 0.5, saliencyScore: 0.18 },
    { name: 'center', x: 0.5, y: 0.5, saliencyScore: 0.31 },
    { name: 'right', x: 5/6, y: 0.5, saliencyScore: 0.91 },
    { name: 'lower-left', x: 1/6, y: 5/6, saliencyScore: 0.16 },
    { name: 'lower', x: 0.5, y: 5/6, saliencyScore: 0.14 },
    { name: 'lower-right', x: 5/6, y: 5/6, saliencyScore: 0.24 }
  ]);

  assert.ok(focal.x > 0.8);
  assert.ok(focal.y > 0.45 && focal.y < 0.55);
});

test('empate de saliência prefere região mais central e estável', () => {
  const focal = inferFocalPointFromRegions([
    { name: 'left', x: 1/6, y: 0.5, saliencyScore: 0.6 },
    { name: 'center', x: 0.5, y: 0.5, saliencyScore: 0.6 },
    { name: 'right', x: 5/6, y: 0.5, saliencyScore: 0.6 }
  ]);

  assert.deepEqual(focal, { x: 0.5, y: 0.5 });
});

test('análise de provider registra origem do focal sem apagar focal manual', async () => {
  const source = await readFile(
    new URL('../js/visual-analysis.js', import.meta.url),
    'utf8'
  );

  assert.match(source, /candidate\.focalPoint \|\| estimateSourceFocalPoint\(img\)/);
  assert.match(source, /focalSource: candidate\.focalPoint \? 'provided' : 'source-saliency'/);
  assert.match(source, /mobileFocalPoint:\s*derivedMobileFocal/);
});
