import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import visualValidate, {
  isTrustedImageUrl,
  normalizeVlmDecision
} from '../api/visual-validate.js';
import health from '../api/health.js';
import {
  clearBackendHealthCache,
  isBackendProviderReady
} from '../js/backendHealth.js';
import { validateVisualFinalists } from '../js/visualProvider.js';
import { hardFilterCandidate } from '../js/visualSelector.js';
import { analyzeVerse } from '../js/visualIntelligence.js';
import { cachedVisualNeedsVlmRefresh } from '../js/visualEngine.js';

function mockReq({
  method = 'POST',
  origin = 'https://fhenriquefcruz.github.io',
  body = undefined
} = {}) {
  return {
    method,
    headers: origin ? { origin } : {},
    body
  };
}

function mockRes() {
  const headers = new Map();
  return {
    statusCode: 200,
    payload: undefined,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    end() {
      return this;
    }
  };
}

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

test('VLM aceita somente hosts HTTPS de imagem aprovados', () => {
  assert.equal(
    isTrustedImageUrl('https://images.unsplash.com/photo-123'),
    true
  );
  assert.equal(
    isTrustedImageUrl('https://images.pexels.com/photos/1/example.jpeg'),
    true
  );
  assert.equal(
    isTrustedImageUrl('http://images.unsplash.com/photo-123'),
    false
  );
  assert.equal(
    isTrustedImageUrl('https://attacker.example/image.jpg'),
    false
  );
});

test('normalização VLM transforma incompatibilidade em rejeição eliminatória', () => {
  const accepted = normalizeVlmDecision({
    id: 'good',
    semanticCompatibility: 0.91,
    emotionalCompatibility: 0.84,
    contradiction: false,
    unsafeOrCliche: false,
    reason: 'Compatible contemplative scene.'
  });

  const rejected = normalizeVlmDecision({
    id: 'bad',
    semanticCompatibility: 0.88,
    emotionalCompatibility: 0.80,
    contradiction: true,
    unsafeOrCliche: false,
    reason: 'Scene contradicts the passage.'
  });

  assert.equal(accepted.accepted, true);
  assert.equal(rejected.accepted, false);
});

test('endpoint VLM permanece desligado por padrão', async () => {
  const oldKey = process.env.GROQ_API_KEY;
  const oldFlag = process.env.VISUAL_VLM_ENABLED;

  process.env.GROQ_API_KEY = 'configured-test-value';
  delete process.env.VISUAL_VLM_ENABLED;

  try {
    const req = mockReq({
      body: {
        candidates: [{
          id: 'photo-1',
          imageUrl: 'https://images.unsplash.com/photo-123'
        }]
      }
    });
    const res = mockRes();

    await visualValidate(req, res);

    assert.equal(res.statusCode, 503);
    assert.equal(res.payload.enabled, false);
    assert.deepEqual(res.payload.decisions, []);
  } finally {
    if (oldKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = oldKey;
    if (oldFlag === undefined) delete process.env.VISUAL_VLM_ENABLED;
    else process.env.VISUAL_VLM_ENABLED = oldFlag;
  }
});

test('endpoint VLM rejeita URL de imagem não confiável antes do provider', async () => {
  const oldKey = process.env.GROQ_API_KEY;
  const oldFlag = process.env.VISUAL_VLM_ENABLED;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;
  let fetchCalls = 0;

  process.env.GROQ_API_KEY = 'configured-test-value';
  process.env.VISUAL_VLM_ENABLED = 'true';
  globalThis.fetch = async () => {
    fetchCalls++;
    throw new Error('provider should not be called');
  };

  try {
    const req = mockReq({
      body: {
        candidates: [{
          id: 'photo-1',
          imageUrl: 'https://attacker.example/image.jpg'
        }]
      }
    });
    const res = mockRes();

    await visualValidate(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.payload.error, 'No trusted visual candidates');
    assert.equal(fetchCalls, 0);
  } finally {
    if (oldKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = oldKey;
    if (oldFlag === undefined) delete process.env.VISUAL_VLM_ENABLED;
    else process.env.VISUAL_VLM_ENABLED = oldFlag;
    restoreGlobal('fetch', oldFetch, hadFetch);
  }
});

test('health só anuncia VLM quando chave e flag estão presentes', async () => {
  const oldKey = process.env.GROQ_API_KEY;
  const oldFlag = process.env.VISUAL_VLM_ENABLED;

  try {
    process.env.GROQ_API_KEY = 'configured-test-value';
    process.env.VISUAL_VLM_ENABLED = 'false';

    let res = mockRes();
    await health(mockReq({ method: 'GET' }), res);
    assert.equal(res.payload.providers.vlmConfigured, false);

    process.env.VISUAL_VLM_ENABLED = 'true';
    res = mockRes();
    await health(mockReq({ method: 'GET' }), res);
    assert.equal(res.payload.providers.vlmConfigured, true);
  } finally {
    if (oldKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = oldKey;
    if (oldFlag === undefined) delete process.env.VISUAL_VLM_ENABLED;
    else process.env.VISUAL_VLM_ENABLED = oldFlag;
  }
});

test('cliente VLM envia no máximo três finalistas e preserva resposta estruturada', async () => {
  const hadDocument = Object.hasOwn(globalThis, 'document');
  const oldDocument = globalThis.document;
  const hadLocation = Object.hasOwn(globalThis, 'location');
  const oldLocation = globalThis.location;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;

  let validateBody = null;
  let call = 0;

  try {
    installDocumentMeta({
      'versday-visual-endpoint':
        'https://api.example.com/api/visual-search',
      'versday-health-endpoint':
        'https://api.example.com/api/health'
    });
    globalThis.location = { hostname: 'fhenriquefcruz.github.io' };
    globalThis.fetch = async (url, options = {}) => {
      call++;

      if (url === 'https://api.example.com/api/health') {
        return {
          ok: true,
          async json() {
            return {
              ok: true,
              service: 'versday-api',
              providers: {
                imagesConfigured: true,
                chatConfigured: true,
                vlmConfigured: true
              }
            };
          }
        };
      }

      assert.equal(
        url,
        'https://api.example.com/api/visual-validate'
      );
      validateBody = JSON.parse(options.body);

      return {
        ok: true,
        async json() {
          return {
            model: 'qwen/qwen3.8-27b',
            decisions: validateBody.candidates.map(candidate => ({
              id: candidate.id,
              semanticCompatibility: 0.9,
              emotionalCompatibility: 0.85,
              contradiction: false,
              unsafeOrCliche: false,
              accepted: true,
              reason: 'Compatible.'
            }))
          };
        }
      };
    };

    clearBackendHealthCache();

    const intent = analyzeVerse({
      text: 'Confia no Senhor de todo o teu coração.',
      reference: 'pv 3:5',
      book: 'pv',
      chapter: 3,
      verse: 5,
      theme: 'confianca'
    });

    const candidates = [1, 2, 3, 4].map(index => ({
      id: `photo-${index}`,
      provider: 'Unsplash',
      imageUrl: `https://images.unsplash.com/photo-${index}`,
      previewUrl: `https://images.unsplash.com/photo-${index}`,
      description: 'quiet path under soft natural light',
      tags: ['path', 'quiet']
    }));

    const result = await validateVisualFinalists(
      intent,
      candidates,
      'background'
    );

    assert.equal(call, 2);
    assert.equal(result.enabled, true);
    assert.equal(validateBody.candidates.length, 3);
    assert.equal(result.decisions.length, 3);
  } finally {
    clearBackendHealthCache();
    restoreGlobal('document', oldDocument, hadDocument);
    restoreGlobal('location', oldLocation, hadLocation);
    restoreGlobal('fetch', oldFetch, hadFetch);
  }
});

test('cliente VLM falha aberto quando validação remota não responde', async () => {
  const hadDocument = Object.hasOwn(globalThis, 'document');
  const oldDocument = globalThis.document;
  const hadLocation = Object.hasOwn(globalThis, 'location');
  const oldLocation = globalThis.location;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;

  try {
    installDocumentMeta({
      'versday-visual-endpoint':
        'https://api.example.com/api/visual-search',
      'versday-health-endpoint':
        'https://api.example.com/api/health'
    });
    globalThis.location = { hostname: 'fhenriquefcruz.github.io' };
    globalThis.fetch = async url => {
      if (url === 'https://api.example.com/api/health') {
        return {
          ok: true,
          async json() {
            return {
              ok: true,
              service: 'versday-api',
              providers: { vlmConfigured: true }
            };
          }
        };
      }

      return { ok: false, status: 502 };
    };

    clearBackendHealthCache();

    const result = await validateVisualFinalists(
      {
        verseReference: 'pv 3:5',
        semantic: {},
        representation: {},
        visualIntent: {},
        biblicalContext: {}
      },
      [{
        id: 'photo-1',
        imageUrl: 'https://images.unsplash.com/photo-1'
      }]
    );

    assert.equal(result.enabled, false);
    assert.equal(result.reason, 'VLM_FAILED_OPEN');
    assert.deepEqual(result.decisions, []);
  } finally {
    clearBackendHealthCache();
    restoreGlobal('document', oldDocument, hadDocument);
    restoreGlobal('location', oldLocation, hadLocation);
    restoreGlobal('fetch', oldFetch, hadFetch);
  }
});

test('VLM_REJECTED é eliminatório no ranking final', () => {
  const intent = analyzeVerse({
    text: 'Confia no Senhor de todo o teu coração.',
    reference: 'pv 3:5',
    book: 'pv',
    chapter: 3,
    verse: 5,
    theme: 'confianca'
  });

  const filtered = hardFilterCandidate({
    id: 'vlm-rejected',
    imageUrl: 'https://images.unsplash.com/photo-1',
    width: 2400,
    height: 1600,
    vlmRejected: true
  }, intent);

  assert.equal(filtered.accepted, false);
  assert.ok(filtered.reasons.includes('VLM_REJECTED'));
});

test('engine aplica VLM somente depois da análise de pixels e antes da seleção final', async () => {
  const source = await readFile(
    new URL('../js/visualEngine.js', import.meta.url),
    'utf8'
  );

  const pixelIndex = source.indexOf('await analyzeShortlist(');
  const vlmIndex = source.indexOf('await validateVisualFinalists(');
  const finalSelectIndex = source.lastIndexOf('selectBestCandidate(');

  assert.ok(pixelIndex >= 0);
  assert.ok(vlmIndex > pixelIndex);
  assert.ok(finalSelectIndex > vlmIndex);
  assert.match(source, /curationConfidence \?\? 0\) < 1/);
});

test('cache externo antigo é revalidado quando VLM passa a estar ativo', async () => {
  const hadDocument = Object.hasOwn(globalThis, 'document');
  const oldDocument = globalThis.document;
  const hadLocation = Object.hasOwn(globalThis, 'location');
  const oldLocation = globalThis.location;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;
  let calls = 0;

  try {
    installDocumentMeta({
      'versday-health-endpoint':
        'https://api.example.com/api/health'
    });
    globalThis.location = { hostname: 'fhenriquefcruz.github.io' };
    globalThis.fetch = async () => {
      calls++;
      return {
        ok: true,
        async json() {
          return {
            ok: true,
            service: 'versday-api',
            providers: { vlmConfigured: true }
          };
        }
      };
    };

    clearBackendHealthCache();

    assert.equal(
      await cachedVisualNeedsVlmRefresh({
        mode: 'photo',
        id: 'external-old',
        provider: 'Unsplash',
        curationConfidence: 0,
        vlmValidation: null
      }),
      true
    );
    assert.equal(calls, 1);

    assert.equal(
      await cachedVisualNeedsVlmRefresh({
        mode: 'photo',
        id: 'curated',
        provider: 'Pexels',
        curationConfidence: 1,
        vlmValidation: null
      }),
      false
    );

    assert.equal(
      await cachedVisualNeedsVlmRefresh({
        mode: 'photo',
        id: 'already-validated',
        provider: 'Unsplash',
        curationConfidence: 0,
        vlmValidation: { accepted: true }
      }),
      false
    );
    assert.equal(calls, 1);
  } finally {
    clearBackendHealthCache();
    restoreGlobal('document', oldDocument, hadDocument);
    restoreGlobal('location', oldLocation, hadLocation);
    restoreGlobal('fetch', oldFetch, hadFetch);
  }
});

test('chat e workflow não usam modelo Groq descontinuado', async () => {
  const [chatSource, workflowSource, readmeSource] = await Promise.all([
    readFile(new URL('../api/chat.js', import.meta.url), 'utf8'),
    readFile(
      new URL('../.github/workflows/deploy-vercel-api.yml', import.meta.url),
      'utf8'
    ),
    readFile(new URL('../README.md', import.meta.url), 'utf8')
  ]);

  for (const source of [chatSource, workflowSource, readmeSource]) {
    assert.doesNotMatch(source, /llama-3\.3-70b-versatile/);
  }

  assert.match(chatSource, /qwen\/qwen3\.8-27b/);
  assert.match(workflowSource, /qwen\/qwen3\.8-27b/);
});
