import test from 'node:test';
import assert from 'node:assert/strict';

import health from '../api/health.js';
import visualSearch from '../api/visual-search.js';
import visualSelect from '../api/visual-select.js';
import chat from '../api/chat.js';

function mockReq({ method='GET', origin='https://fhenriquefcruz.github.io', body=undefined } = {}) {
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
    ended: false,
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
      this.ended = true;
      return this;
    },
    end() {
      this.ended = true;
      return this;
    }
  };
}

test('healthcheck responde sem expor valores de segredo', async () => {
  const oldUnsplash = process.env.UNSPLASH_ACCESS_KEY;
  const oldGroq = process.env.GROQ_API_KEY;
  process.env.UNSPLASH_ACCESS_KEY = 'configured-test-value';
  process.env.GROQ_API_KEY = 'configured-test-value';

  try {
    const req = mockReq({ method: 'GET' });
    const res = mockRes();

    await health(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.ok, true);
    assert.equal(res.payload.service, 'versday-api');
    assert.equal(res.payload.providers.imagesConfigured, true);
    assert.equal(res.payload.providers.chatConfigured, true);

    const serialized = JSON.stringify(res.payload);
    assert.equal(serialized.includes('configured-test-value'), false);
    assert.equal(res.getHeader('access-control-allow-origin'), 'https://fhenriquefcruz.github.io');
    assert.match(res.getHeader('access-control-allow-methods'), /GET/);
  } finally {
    if (oldUnsplash === undefined) delete process.env.UNSPLASH_ACCESS_KEY;
    else process.env.UNSPLASH_ACCESS_KEY = oldUnsplash;
    if (oldGroq === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = oldGroq;
  }
});

test('origem não autorizada é rejeitada antes do handler', async () => {
  const req = mockReq({
    method: 'POST',
    origin: 'https://evil.example',
    body: { queries: ['quiet editorial landscape with soft natural light'] }
  });
  const res = mockRes();

  await visualSearch(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.payload, { error: 'Origin not allowed' });
});

test('visual search sem credencial server-side degrada com 503', async () => {
  const old = process.env.UNSPLASH_ACCESS_KEY;
  delete process.env.UNSPLASH_ACCESS_KEY;

  try {
    const req = mockReq({
      method: 'POST',
      body: { queries: ['quiet editorial landscape with soft natural light'] }
    });
    const res = mockRes();

    await visualSearch(req, res);

    assert.equal(res.statusCode, 503);
    assert.equal(res.payload.error, 'Image provider not configured');
    assert.deepEqual(res.payload.candidates, []);
  } finally {
    if (old !== undefined) process.env.UNSPLASH_ACCESS_KEY = old;
  }
});

test('download tracking rejeita URL fora do Unsplash antes de chamar provedor', async () => {
  const old = process.env.UNSPLASH_ACCESS_KEY;
  process.env.UNSPLASH_ACCESS_KEY = 'test-key';

  try {
    const req = mockReq({
      method: 'POST',
      body: { downloadLocation: 'https://attacker.example/photos/123/download' }
    });
    const res = mockRes();

    await visualSelect(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.payload.error, 'Invalid download location');
  } finally {
    if (old === undefined) delete process.env.UNSPLASH_ACCESS_KEY;
    else process.env.UNSPLASH_ACCESS_KEY = old;
  }
});

test('chat sem credencial server-side degrada com 503', async () => {
  const old = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;

  try {
    const req = mockReq({
      method: 'POST',
      body: { question: 'O que significa esperança?' }
    });
    const res = mockRes();

    await chat(req, res);

    assert.equal(res.statusCode, 503);
    assert.equal(res.payload.error, 'Chat provider not configured');
  } finally {
    if (old !== undefined) process.env.GROQ_API_KEY = old;
  }
});

test('healthcheck rejeita métodos diferentes de GET/OPTIONS', async () => {
  const req = mockReq({ method: 'POST' });
  const res = mockRes();

  await health(req, res);

  assert.equal(res.statusCode, 405);
  assert.equal(res.payload.error, 'Method not allowed');
});
