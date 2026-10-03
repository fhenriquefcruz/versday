import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deriveHealthEndpoint,
  clearBackendHealthCache,
  getBackendHealth,
  isBackendProviderReady
} from '../js/backendHealth.js';
import {
  askGemini,
  checkChatAvailability
} from '../js/gemini.js';
import { fetchProviderCandidates } from '../js/visualProvider.js';

function installDocumentMeta(values = {}) {
  globalThis.document = {
    querySelector(selector) {
      const match = selector.match(/^meta\[name="([^"]+)"\]$/);
      if (!match) return null;
      const value = values[match[1]] || '';
      return {
        getAttribute(name) {
          return name === 'content' ? value : null;
        }
      };
    }
  };
}

function restoreGlobal(name, value, existed) {
  if (existed) globalThis[name] = value;
  else delete globalThis[name];
}

test('deriveHealthEndpoint resolve chat e visual no mesmo backend', () => {
  assert.equal(
    deriveHealthEndpoint('https://api.example.com/api/chat'),
    'https://api.example.com/api/health'
  );
  assert.equal(
    deriveHealthEndpoint('https://api.example.com/api/visual-search?x=1'),
    'https://api.example.com/api/health'
  );
  assert.equal(
    deriveHealthEndpoint('/api/visual-select'),
    '/api/health'
  );
  assert.equal(deriveHealthEndpoint('https://api.example.com/custom'), '');
});

test('healthcheck valida assinatura do backend e flags sem segredos', async () => {
  const hadDocument = Object.hasOwn(globalThis, 'document');
  const oldDocument = globalThis.document;
  const hadLocation = Object.hasOwn(globalThis, 'location');
  const oldLocation = globalThis.location;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;

  try {
    installDocumentMeta({
      'versday-health-endpoint': 'https://api.example.com/api/health'
    });
    globalThis.location = { hostname: 'fhenriquefcruz.github.io' };
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.example.com/api/health');
      assert.equal(options.method, 'GET');
      assert.equal(options.cache, 'no-store');
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            service: 'versday-api',
            providers: {
              imagesConfigured: true,
              chatConfigured: false
            }
          };
        }
      };
    };

    clearBackendHealthCache();

    const health = await getBackendHealth({ force: true });
    assert.equal(health.service, 'versday-api');
    assert.equal(await isBackendProviderReady('images'), true);
    assert.equal(await isBackendProviderReady('chat'), false);
  } finally {
    clearBackendHealthCache();
    restoreGlobal('document', oldDocument, hadDocument);
    restoreGlobal('location', oldLocation, hadLocation);
    restoreGlobal('fetch', oldFetch, hadFetch);
  }
});

test('chat envia question + history e não duplica pergunta como messages', async () => {
  const hadDocument = Object.hasOwn(globalThis, 'document');
  const oldDocument = globalThis.document;
  const hadLocation = Object.hasOwn(globalThis, 'location');
  const oldLocation = globalThis.location;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;

  let capturedBody = null;

  try {
    installDocumentMeta({
      'versday-chat-endpoint': 'https://api.example.com/api/chat'
    });
    globalThis.location = { hostname: 'fhenriquefcruz.github.io' };
    globalThis.fetch = async (url, options) => {
      assert.equal(url, 'https://api.example.com/api/chat');
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        async json() {
          return { answer: 'Resposta **segura**.' };
        }
      };
    };

    const answer = await askGemini(
      'O que significa esperança?',
      [{ role: 'user', content: 'Pergunta anterior' }]
    );

    assert.deepEqual(capturedBody, {
      question: 'O que significa esperança?',
      history: [{ role: 'user', content: 'Pergunta anterior' }]
    });
    assert.equal('messages' in capturedBody, false);
    assert.match(answer, /<strong>segura<\/strong>/);
  } finally {
    restoreGlobal('document', oldDocument, hadDocument);
    restoreGlobal('location', oldLocation, hadLocation);
    restoreGlobal('fetch', oldFetch, hadFetch);
  }
});

test('checkChatAvailability só libera chat quando health confirma provider', async () => {
  const hadDocument = Object.hasOwn(globalThis, 'document');
  const oldDocument = globalThis.document;
  const hadLocation = Object.hasOwn(globalThis, 'location');
  const oldLocation = globalThis.location;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;

  try {
    installDocumentMeta({
      'versday-chat-endpoint': 'https://api.example.com/api/chat',
      'versday-health-endpoint': 'https://api.example.com/api/health'
    });
    globalThis.location = { hostname: 'fhenriquefcruz.github.io' };
    globalThis.fetch = async () => ({
      ok: true,
      async json() {
        return {
          ok: true,
          service: 'versday-api',
          providers: {
            imagesConfigured: true,
            chatConfigured: true
          }
        };
      }
    });

    clearBackendHealthCache();
    assert.equal(await checkChatAvailability({ force: true }), true);
  } finally {
    clearBackendHealthCache();
    restoreGlobal('document', oldDocument, hadDocument);
    restoreGlobal('location', oldLocation, hadLocation);
    restoreGlobal('fetch', oldFetch, hadFetch);
  }
});

test('visual provider evita POST externo quando health diz imagesConfigured=false', async () => {
  const hadDocument = Object.hasOwn(globalThis, 'document');
  const oldDocument = globalThis.document;
  const hadLocation = Object.hasOwn(globalThis, 'location');
  const oldLocation = globalThis.location;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;

  let calls = 0;

  try {
    installDocumentMeta({
      'versday-visual-endpoint': 'https://api.example.com/api/visual-search',
      'versday-health-endpoint': 'https://api.example.com/api/health'
    });
    globalThis.location = { hostname: 'fhenriquefcruz.github.io' };
    globalThis.fetch = async (url) => {
      calls++;
      assert.equal(url, 'https://api.example.com/api/health');
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            service: 'versday-api',
            providers: {
              imagesConfigured: false,
              chatConfigured: false
            }
          };
        }
      };
    };

    clearBackendHealthCache();

    const candidates = await fetchProviderCandidates(
      {
        verseReference: 'pv 3:5',
        semantic: { primaryTheme: 'confiança' },
        representation: { mode: 'conceptual' },
        visualIntent: { description: 'confiança', preferredScenes: [] },
        photography: {},
        biblicalContext: {}
      },
      [{ query: 'quiet editorial trust under adversity natural light' }],
      20
    );

    assert.deepEqual(candidates, []);
    assert.equal(calls, 1);
  } finally {
    clearBackendHealthCache();
    restoreGlobal('document', oldDocument, hadDocument);
    restoreGlobal('location', oldLocation, hadLocation);
    restoreGlobal('fetch', oldFetch, hadFetch);
  }
});
