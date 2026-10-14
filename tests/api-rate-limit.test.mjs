import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  RATE_LIMIT_POLICIES,
  getClientFingerprint,
  checkRateLimit,
  applyRateLimit,
  resetRateLimitState
} from '../api/_rate-limit.js';
import {
  getAllowedOrigins,
  isProductionRuntime
} from '../api/_cors.js';

function mockReq({
  method = 'POST',
  headers = {},
  remoteAddress = '127.0.0.1'
} = {}) {
  return {
    method,
    headers,
    socket: { remoteAddress }
  };
}

function mockRes() {
  const headers = new Map();
  return {
    statusCode: 200,
    payload: null,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), String(value));
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
    }
  };
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test('fingerprint usa x-forwarded-for e não expõe IP bruto', () => {
  const fingerprint = getClientFingerprint(
    mockReq({
      headers: {
        'x-forwarded-for': '203.0.113.7, 10.0.0.1'
      }
    })
  );

  assert.match(fingerprint, /^[a-f0-9]{24}$/);
  assert.doesNotMatch(fingerprint, /203\.0\.113\.7/);

  const same = getClientFingerprint(
    mockReq({
      headers: {
        'x-forwarded-for': '203.0.113.7'
      }
    })
  );
  const other = getClientFingerprint(
    mockReq({
      headers: {
        'x-forwarded-for': '203.0.113.8'
      }
    })
  );

  assert.equal(fingerprint, same);
  assert.notEqual(fingerprint, other);
});

test('rate limiter bloqueia somente depois do limite e reinicia após a janela', () => {
  resetRateLimitState();

  const base = {
    scope: 'chat-test',
    fingerprint: 'client-a',
    limit: 2,
    windowMs: 1000
  };

  const first = checkRateLimit({ ...base, now: 1000 });
  const second = checkRateLimit({ ...base, now: 1200 });
  const third = checkRateLimit({ ...base, now: 1300 });
  const reset = checkRateLimit({ ...base, now: 2101 });

  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);
  assert.equal(third.allowed, false);
  assert.equal(reset.allowed, true);
  assert.equal(reset.remaining, 1);
});

test('escopos independentes não compartilham quota', () => {
  resetRateLimitState();

  const common = {
    fingerprint: 'same-client',
    limit: 1,
    windowMs: 60_000,
    now: 1000
  };

  assert.equal(
    checkRateLimit({
      ...common,
      scope: 'chat'
    }).allowed,
    true
  );
  assert.equal(
    checkRateLimit({
      ...common,
      scope: 'chat'
    }).allowed,
    false
  );
  assert.equal(
    checkRateLimit({
      ...common,
      scope: 'visual-search'
    }).allowed,
    true
  );
});

test('applyRateLimit devolve 429, retry-after e headers de quota', () => {
  resetRateLimitState();

  const req = mockReq({
    headers: {
      'x-forwarded-for': '198.51.100.44'
    }
  });
  const policy = {
    limit: 1,
    windowMs: 60_000
  };

  let res = mockRes();
  assert.equal(
    applyRateLimit(req, res, 'unit-route', policy),
    false
  );
  assert.equal(res.getHeader('ratelimit-limit'), '1');
  assert.equal(res.getHeader('ratelimit-remaining'), '0');

  res = mockRes();
  assert.equal(
    applyRateLimit(req, res, 'unit-route', policy),
    true
  );
  assert.equal(res.statusCode, 429);
  assert.equal(res.payload.error, 'Too many requests');
  assert.ok(Number(res.getHeader('retry-after')) >= 1);
});

test('políticas custosas são mais restritas que tracking de imagem', () => {
  assert.ok(
    RATE_LIMIT_POLICIES.visualValidate.limit <
    RATE_LIMIT_POLICIES.visualSelect.limit
  );
  assert.ok(
    RATE_LIMIT_POLICIES.chat.limit <
    RATE_LIMIT_POLICIES.visualSearch.limit
  );
  assert.equal(
    RATE_LIMIT_POLICIES.visualValidate.windowMs,
    60_000
  );
});

test('produção não libera localhost por padrão', () => {
  const oldVercel = process.env.VERCEL_ENV;
  const oldNode = process.env.NODE_ENV;
  const oldAllowed = process.env.ALLOWED_ORIGIN;

  try {
    process.env.VERCEL_ENV = 'production';
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOWED_ORIGIN;

    assert.equal(isProductionRuntime(), true);

    const origins = getAllowedOrigins();
    assert.equal(
      origins.has('https://fhenriquefcruz.github.io'),
      true
    );
    assert.equal(
      origins.has('http://localhost:3000'),
      false
    );
    assert.equal(
      origins.has('http://127.0.0.1:5173'),
      false
    );
  } finally {
    restoreEnv('VERCEL_ENV', oldVercel);
    restoreEnv('NODE_ENV', oldNode);
    restoreEnv('ALLOWED_ORIGIN', oldAllowed);
  }
});

test('desenvolvimento mantém localhost e produção aceita origem explicitamente configurada', () => {
  const oldVercel = process.env.VERCEL_ENV;
  const oldNode = process.env.NODE_ENV;
  const oldAllowed = process.env.ALLOWED_ORIGIN;

  try {
    process.env.VERCEL_ENV = 'preview';
    process.env.NODE_ENV = 'development';
    delete process.env.ALLOWED_ORIGIN;

    assert.equal(
      getAllowedOrigins().has('http://localhost:5173'),
      true
    );

    process.env.VERCEL_ENV = 'production';
    process.env.NODE_ENV = 'production';
    process.env.ALLOWED_ORIGIN = 'https://preview.example.com';

    assert.equal(
      getAllowedOrigins().has('https://preview.example.com'),
      true
    );
  } finally {
    restoreEnv('VERCEL_ENV', oldVercel);
    restoreEnv('NODE_ENV', oldNode);
    restoreEnv('ALLOWED_ORIGIN', oldAllowed);
  }
});

test('endpoints de provider usam limiter e health permanece livre', async () => {
  const files = {
    chat: await readFile(
      new URL('../api/chat.js', import.meta.url),
      'utf8'
    ),
    search: await readFile(
      new URL('../api/visual-search.js', import.meta.url),
      'utf8'
    ),
    select: await readFile(
      new URL('../api/visual-select.js', import.meta.url),
      'utf8'
    ),
    validate: await readFile(
      new URL('../api/visual-validate.js', import.meta.url),
      'utf8'
    ),
    health: await readFile(
      new URL('../api/health.js', import.meta.url),
      'utf8'
    )
  };

  for (const name of ['chat', 'search', 'select', 'validate']) {
    assert.match(
      files[name],
      /applyRateLimit/,
      `limiter ausente em ${name}`
    );
  }

  assert.doesNotMatch(files.health, /applyRateLimit/);
});
