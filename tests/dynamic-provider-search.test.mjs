import test from 'node:test';
import assert from 'node:assert/strict';

import visualSearch, {
  mergeCandidateGroups,
  normalizePhoto,
  UNSPLASH_QUERY_TIMEOUT_MS
} from '../api/visual-search.js';
import {
  analyzeVerse
} from '../js/visualIntelligence.js';
import {
  scoreCandidate,
  buildSceneSignature
} from '../js/visualSelector.js';

function mockReq(body) {
  return {
    method: 'POST',
    headers: {
      origin: 'https://fhenriquefcruz.github.io'
    },
    body
  };
}

function mockRes() {
  const headers = new Map();
  return {
    statusCode: 200,
    payload: null,
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

function photo(id) {
  return {
    id,
    width: 3200,
    height: 2100,
    alt_description: `photo ${id}`,
    description: null,
    urls: {
      regular: `https://images.unsplash.com/${id}`,
      small: `https://images.unsplash.com/${id}?small=1`
    },
    links: {
      html: `https://unsplash.com/photos/${id}`,
      download_location:
        `https://api.unsplash.com/photos/${id}/download`
    },
    user: {
      name: `Photographer ${id}`,
      links: {
        html: `https://unsplash.com/@${id}`
      }
    },
    tags: []
  };
}

function intent() {
  return analyzeVerse({
    text: 'Confia no Senhor de todo o teu coração.',
    reference: 'pv 3:5',
    book: 'pv',
    chapter: 3,
    verse: 5,
    theme: 'confianca'
  });
}

function candidate(query) {
  return {
    id: 'unsplash:evidence',
    provider: 'Unsplash',
    imageUrl:
      'https://images.unsplash.com/photo-evidence',
    width: 3200,
    height: 2100,
    description:
      'quiet neutral landscape with a distant person',
    alt:
      'quiet neutral landscape with a distant person',
    tags: ['landscape', 'person', 'quiet'],
    themes: [],
    moods: [],
    representationModes: [],
    qualityScore: 0.92,
    compositionScore: 0.82,
    identityScore: 0.82,
    providerSearchScore: 0.9,
    searchIntentTheme: 'confiança',
    query
  };
}

test('merge do provider é round-robin e deduplica IDs', () => {
  const merged = mergeCandidateGroups([
    [
      { id: 'a1', imageUrl: 'a1' },
      { id: 'a2', imageUrl: 'a2' },
      { id: 'a3', imageUrl: 'a3' }
    ],
    [
      { id: 'b1', imageUrl: 'b1' },
      { id: 'a1', imageUrl: 'duplicate' },
      { id: 'b2', imageUrl: 'b2' }
    ],
    [
      { id: 'c1', imageUrl: 'c1' }
    ]
  ], 6);

  assert.deepEqual(
    merged.map(item => item.id),
    ['a1', 'b1', 'c1', 'a2', 'b2', 'a3']
  );
});

test('normalização Unsplash preserva proveniência da query sem promovê-la a tema', () => {
  const normalized = normalizePhoto(
    photo('abc'),
    'quiet trust path',
    2,
    3
  );

  assert.equal(normalized.id, 'unsplash:abc');
  assert.equal(normalized.providerRank, 3);
  assert.equal(normalized.providerQueryIndex, 3);
  assert.equal(normalized.query, 'quiet trust path');
  assert.deepEqual(normalized.themes, []);
  assert.deepEqual(normalized.moods, []);
  assert.deepEqual(normalized.representationModes, []);
});

test('query gerada não altera semantic score nem scene signature da imagem', () => {
  const semanticQuery = [
    'trust refuge uncertain path',
    'editorial photography cinematic natural light'
  ].join(' ');
  const unrelatedQuery =
    'completely unrelated generated query';

  const a = candidate(semanticQuery);
  const b = candidate(unrelatedQuery);

  const scoredA = scoreCandidate(a, intent(), []);
  const scoredB = scoreCandidate(b, intent(), []);

  assert.equal(
    scoredA.scores.semantic,
    scoredB.scores.semantic
  );
  assert.equal(
    scoredA.scores.final,
    scoredB.scores.final
  );
  assert.equal(
    buildSceneSignature(a),
    buildSceneSignature(b)
  );
});

test('timeout individual do Unsplash permanece abaixo do budget do cliente', () => {
  assert.ok(UNSPLASH_QUERY_TIMEOUT_MS <= 3200);
});

test('visual-search tolera falha parcial e retorna diagnóstico sem segredo', async () => {
  const oldKey = process.env.UNSPLASH_ACCESS_KEY;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;

  process.env.UNSPLASH_ACCESS_KEY = 'server-secret-test';

  try {
    globalThis.fetch = async urlValue => {
      const url = new URL(String(urlValue));
      const query = url.searchParams.get('query');

      if (query.includes('broken')) {
        return {
          ok: false,
          status: 500,
          async json() {
            return {};
          }
        };
      }

      const prefix = query.includes('quiet')
        ? 'q'
        : 's';

      return {
        ok: true,
        status: 200,
        async json() {
          return {
            results: [
              photo(`${prefix}1`),
              photo(`${prefix}2`)
            ]
          };
        }
      };
    };

    const req = mockReq({
      queries: [
        'quiet trust landscape',
        'broken provider query',
        'soft shelter landscape'
      ],
      limit: 6,
      purpose: 'background'
    });
    const res = mockRes();

    await visualSearch(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.search.queryCount, 3);
    assert.equal(res.payload.search.fulfilledQueries, 2);
    assert.equal(res.payload.search.failedQueries, 1);
    assert.equal(res.payload.search.resultCount, 4);
    assert.deepEqual(
      res.payload.candidates.map(item => item.id),
      [
        'unsplash:q1',
        'unsplash:s1',
        'unsplash:q2',
        'unsplash:s2'
      ]
    );

    const serialized = JSON.stringify(res.payload);
    assert.doesNotMatch(
      serialized,
      /server-secret-test/
    );
  } finally {
    if (oldKey === undefined) {
      delete process.env.UNSPLASH_ACCESS_KEY;
    } else {
      process.env.UNSPLASH_ACCESS_KEY = oldKey;
    }

    if (hadFetch) globalThis.fetch = oldFetch;
    else delete globalThis.fetch;
  }
});

test('visual-search devolve 429 quando todas as queries sofrem rate limit', async () => {
  const oldKey = process.env.UNSPLASH_ACCESS_KEY;
  const hadFetch = Object.hasOwn(globalThis, 'fetch');
  const oldFetch = globalThis.fetch;

  process.env.UNSPLASH_ACCESS_KEY = 'server-secret-test';

  try {
    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
      async json() {
        return {};
      }
    });

    const res = mockRes();
    await visualSearch(
      mockReq({
        queries: [
          'quiet trust landscape',
          'soft shelter landscape'
        ]
      }),
      res
    );

    assert.equal(res.statusCode, 429);
    assert.equal(
      res.payload.error,
      'Image provider rate limited'
    );
    assert.equal(
      res.payload.search.rateLimited,
      true
    );
    assert.equal(
      res.payload.search.failedQueries,
      2
    );
    assert.deepEqual(res.payload.candidates, []);
  } finally {
    if (oldKey === undefined) {
      delete process.env.UNSPLASH_ACCESS_KEY;
    } else {
      process.env.UNSPLASH_ACCESS_KEY = oldKey;
    }

    if (hadFetch) globalThis.fetch = oldFetch;
    else delete globalThis.fetch;
  }
});
