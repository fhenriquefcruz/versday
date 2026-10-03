import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveVisualFeedback,
  saveVisualFeedback,
  getFeedback,
  setCachedVisual,
  getCachedVisual,
  invalidateCachedVisual
} from '../js/visualMemory.js';

function createStorage() {
  const data = new Map();
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    }
  };
}

test('feedback exato tem prioridade sobre blacklist temática', () => {
  const feedback = [
    {
      reference: 'pv 3:5',
      visualId: 'img-1',
      value: 'down',
      primaryTheme: 'confiança'
    },
    {
      reference: 'pv 4:23',
      visualId: 'img-1',
      value: 'up',
      primaryTheme: 'confiança'
    }
  ];

  assert.equal(
    resolveVisualFeedback(feedback, 'pv 4:23', 'img-1', 'confiança'),
    'up'
  );
  assert.equal(
    resolveVisualFeedback(feedback, 'pv 16:3', 'img-1', 'confianca'),
    'down'
  );
  assert.equal(
    resolveVisualFeedback(feedback, 'sl 23:1', 'img-1', 'paz'),
    null
  );
});

test('feedback negativo remove caches da mesma imagem dentro do mesmo tema', () => {
  const hadLocalStorage = Object.hasOwn(globalThis, 'localStorage');
  const oldLocalStorage = globalThis.localStorage;
  globalThis.localStorage = createStorage();

  try {
    const confidenceIntent = {
      semantic: { primaryTheme: 'confiança' }
    };
    const peaceIntent = {
      semantic: { primaryTheme: 'paz' }
    };
    const visual = {
      id: 'shared-photo',
      mode: 'photo'
    };

    setCachedVisual('pv 3:5', confidenceIntent, visual);
    setCachedVisual('pv 16:3', confidenceIntent, visual);
    setCachedVisual('sl 4:8', peaceIntent, visual);

    saveVisualFeedback(
      'pv 3:5',
      'shared-photo',
      'down',
      { primaryTheme: 'confiança' }
    );

    assert.equal(getCachedVisual('pv 3:5'), null);
    assert.equal(getCachedVisual('pv 16:3'), null);
    assert.ok(getCachedVisual('sl 4:8'));

    assert.equal(
      getFeedback('pv 16:3', 'shared-photo', 'confiança'),
      'down'
    );
    assert.equal(
      getFeedback('sl 4:8', 'shared-photo', 'paz'),
      null
    );
  } finally {
    if (hadLocalStorage) globalThis.localStorage = oldLocalStorage;
    else delete globalThis.localStorage;
  }
});

test('feedback antigo sem tema continua válido para a referência original', () => {
  const feedback = [{
    reference: 'jo 3:16',
    visualId: 'legacy-image',
    value: 'down'
  }];

  assert.equal(
    resolveVisualFeedback(feedback, 'jo 3:16', 'legacy-image', 'amor'),
    'down'
  );
  assert.equal(
    resolveVisualFeedback(feedback, '1co 13:4', 'legacy-image', 'amor'),
    null
  );
});

test('invalidação explícita do cache remove somente o visual esperado', () => {
  const hadLocalStorage = Object.hasOwn(globalThis, 'localStorage');
  const oldLocalStorage = globalThis.localStorage;
  globalThis.localStorage = createStorage();

  try {
    const intent = { semantic: { primaryTheme: 'paz' } };

    setCachedVisual(
      'sl 4:8',
      intent,
      { id: 'photo-a', mode: 'photo' },
      'background'
    );
    setCachedVisual(
      'sl 4:8',
      intent,
      { id: 'photo-share', mode: 'photo' },
      'share-portrait'
    );

    assert.equal(
      invalidateCachedVisual('sl 4:8', 'background', 'wrong-id'),
      false
    );
    assert.ok(getCachedVisual('sl 4:8', 'background'));

    assert.equal(
      invalidateCachedVisual('sl 4:8', 'background', 'photo-a'),
      true
    );
    assert.equal(getCachedVisual('sl 4:8', 'background'), null);
    assert.ok(getCachedVisual('sl 4:8', 'share-portrait'));
  } finally {
    if (hadLocalStorage) globalThis.localStorage = oldLocalStorage;
    else delete globalThis.localStorage;
  }
});

test('background invalida foto quebrada antes do fallback abstrato', async () => {
  const source = await import('node:fs/promises')
    .then(({ readFile }) =>
      readFile(new URL('../js/background.js', import.meta.url), 'utf8')
    );

  assert.match(source, /invalidateCachedVisual\(/);
  assert.match(
    source,
    /if \(!loaded\)[\s\S]*invalidateCachedVisual[\s\S]*resolveAndApplyFallback/
  );
});
