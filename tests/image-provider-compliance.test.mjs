import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildVisualCreditModel } from '../js/background.js';

test('Unsplash credit includes photographer and provider links', () => {
  const model = buildVisualCreditModel({
    mode: 'photo',
    provider: 'Unsplash',
    photographer: 'Annie Example',
    photographerLink: 'https://unsplash.com/@annie?utm_source=VersDay&utm_medium=referral',
    providerUrl: 'https://unsplash.com/photos/example?utm_source=VersDay&utm_medium=referral'
  });

  assert.equal(model.type, 'unsplash');
  assert.equal(model.photographer, 'Annie Example');
  assert.match(model.photographerLink, /unsplash\.com\/\@annie/);
  assert.equal(model.providerLabel, 'Unsplash');
  assert.match(model.providerLink, /utm_source=VersDay/);
  assert.match(model.providerLink, /utm_medium=referral/);
});

test('Pexels curated credit remains provider-level and optional-license compatible', () => {
  const model = buildVisualCreditModel({
    mode: 'photo',
    provider: 'Pexels',
    providerUrl: 'https://www.pexels.com/photo/example/'
  });

  assert.equal(model.type, 'provider');
  assert.equal(model.providerLabel, 'Pexels');
  assert.equal(model.providerLink, 'https://www.pexels.com/photo/example/');
});

test('non-photo visual does not render provider attribution', () => {
  assert.equal(buildVisualCreditModel({ mode: 'abstract' }), null);
});

test('visual engine preserves download location and retriggers tracking from cache', async () => {
  const source = await readFile(
    new URL('../js/visualEngine.js', import.meta.url),
    'utf8'
  );

  assert.match(source, /downloadLocation: candidate\.downloadLocation \|\| null/);
  assert.match(
    source,
    /if \(cached\.visual\.mode === 'photo'\) \{\s*await notifyProviderSelection\(cached\.visual\);\s*\}/
  );
});

test('visual engine version invalidates pre-compliance cached visuals', async () => {
  const source = await readFile(
    new URL('../js/visualIntelligence.js', import.meta.url),
    'utf8'
  );

  assert.match(source, /VISUAL_ENGINE_VERSION = '2\\.4\\.0'/);
});