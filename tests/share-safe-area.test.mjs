import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SHARE_FORMATS,
  buildShareFooterLayout,
  getShareAttributionLabel
} from '../js/share.js';

test('footer de share respeita safe-bottom em todos os formatos', () => {
  for (const [name, format] of Object.entries(SHARE_FORMATS)) {
    const footer = buildShareFooterLayout(
      format,
      format.width,
      format.height,
      {
        mode: 'photo',
        provider: 'Unsplash',
        photographer: 'Fotógrafo Exemplo'
      }
    );

    assert.ok(
      footer.brandY < footer.safeBoundary,
      `${name}: marca fora da safe area`
    );
    assert.ok(
      footer.creditY < footer.brandY,
      `${name}: crédito deve ficar acima da marca`
    );
    assert.ok(
      footer.contentBottom < footer.creditY,
      `${name}: conteúdo deve terminar antes do crédito`
    );
    assert.ok(
      footer.contentBottom > format.safeTop,
      `${name}: área útil colapsou`
    );
  }
});

test('Unsplash recebe atribuição que acompanha a peça compartilhada', () => {
  const label = getShareAttributionLabel({
    mode: 'photo',
    provider: 'Unsplash',
    photographer: 'Annie Example'
  });

  assert.equal(label, 'Foto: Annie Example · Unsplash');
});

test('Pexels curado não recebe crédito obrigatório no bitmap', () => {
  const label = getShareAttributionLabel({
    mode: 'photo',
    provider: 'Pexels'
  });

  assert.equal(label, '');
});

test('fallback abstrato nunca gera crédito fotográfico', () => {
  assert.equal(
    getShareAttributionLabel({ mode: 'abstract' }),
    ''
  );
});
