import { applyCors, readJsonBody } from './_cors.js';

const UNSPLASH_SEARCH_URL = 'https://api.unsplash.com/search/photos';
const MAX_QUERIES = 4;
const MAX_RESULTS = 30;
export const UNSPLASH_QUERY_TIMEOUT_MS = 3200;

function normalizeQuery(value) {
  const raw = typeof value === 'string' ? value : value?.query;
  return String(raw || '').trim();
}

export function normalizePhoto(photo, query, rank, queryIndex = 0) {
  const photographer = photo.user?.name || 'Fotógrafo do Unsplash';
  const photographerLink = photo.user?.links?.html
    ? `${photo.user.links.html}?utm_source=VersDay&utm_medium=referral`
    : null;
  const providerUrl = photo.links?.html
    ? `${photo.links.html}?utm_source=VersDay&utm_medium=referral`
    : 'https://unsplash.com/?utm_source=VersDay&utm_medium=referral';

  const tags = [
    ...(Array.isArray(photo.tags)
      ? photo.tags
          .map(tag => tag?.title)
          .filter(Boolean)
      : []),
    photo.alt_description,
    photo.description
  ].filter(Boolean);

  return {
    id: `unsplash:${photo.id}`,
    provider: 'Unsplash',
    providerUrl,
    imageUrl: photo.urls?.regular || photo.urls?.full,
    previewUrl:
      photo.urls?.small ||
      photo.urls?.thumb ||
      photo.urls?.regular,
    width: photo.width || 0,
    height: photo.height || 0,
    color: photo.color || null,
    description:
      photo.alt_description ||
      photo.description ||
      '',
    alt:
      photo.alt_description ||
      photo.description ||
      '',
    tags,
    moods: [],
    themes: [],
    representationModes: [],
    safeTextAreas: [],
    focalPoint: null,
    mobileFocalPoint: null,
    qualityScore:
      photo.width >= 2400 && photo.height >= 1400
        ? 0.92
        : 0.84,
    compositionScore: 0.74,
    identityScore: 0.8,
    negativeTags: [],
    photographer,
    photographerLink,
    downloadLocation:
      photo.links?.download_location || null,
    providerRank: rank + 1,
    providerQueryIndex: queryIndex,
    providerSearchScore: Math.max(
      0.56,
      0.9 - rank * 0.025
    ),
    query,
    hasEmbeddedText: false,
    hasWatermark: false,
    isAdvertising: false,
    nsfw: false
  };
}

export function mergeCandidateGroups(
  groups = [],
  limit = MAX_RESULTS
) {
  const normalizedGroups = Array.isArray(groups)
    ? groups.filter(Array.isArray)
    : [];
  const max = Math.max(
    1,
    Math.min(Number(limit) || MAX_RESULTS, MAX_RESULTS)
  );
  const cursors = normalizedGroups.map(() => 0);
  const seen = new Set();
  const merged = [];

  let progressed = true;

  while (merged.length < max && progressed) {
    progressed = false;

    for (
      let groupIndex = 0;
      groupIndex < normalizedGroups.length;
      groupIndex++
    ) {
      const group = normalizedGroups[groupIndex];

      while (cursors[groupIndex] < group.length) {
        const candidate = group[cursors[groupIndex]++];
        progressed = true;

        if (
          !candidate?.imageUrl ||
          !candidate?.id ||
          seen.has(candidate.id)
        ) {
          continue;
        }

        seen.add(candidate.id);
        merged.push(candidate);
        break;
      }

      if (merged.length >= max) break;
    }
  }

  return merged;
}

async function searchUnsplash(
  query,
  accessKey,
  perPage = 10,
  orientation = 'landscape',
  queryIndex = 0
) {
  const url = new URL(UNSPLASH_SEARCH_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', orientation);
  url.searchParams.set('content_filter', 'high');
  url.searchParams.set(
    'per_page',
    String(Math.max(1, Math.min(perPage, 20)))
  );

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    UNSPLASH_QUERY_TIMEOUT_MS
  );

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1'
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const error = new Error(`Unsplash ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();

  return (payload.results || []).map(
    (photo, rank) =>
      normalizePhoto(
        photo,
        query,
        rank,
        queryIndex
      )
  );
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(503).json({
      error: 'Image provider not configured',
      candidates: []
    });
  }

  try {
    const body = await readJsonBody(req);
    const queries = Array.from(new Set(
      (Array.isArray(body.queries)
        ? body.queries
        : [])
        .map(normalizeQuery)
        .filter(
          value =>
            value.length >= 8 &&
            value.length <= 320
        )
    )).slice(0, MAX_QUERIES);

    if (!queries.length) {
      return res.status(400).json({
        error: 'No valid visual queries',
        candidates: []
      });
    }

    const requestedLimit = Math.max(
      5,
      Math.min(
        Number(body.limit) || MAX_RESULTS,
        MAX_RESULTS
      )
    );
    const perQuery = Math.max(
      5,
      Math.ceil(requestedLimit / queries.length)
    );
    const purpose = String(
      body.purpose || 'background'
    );
    const orientation =
      /portrait|mobile/i.test(purpose)
        ? 'portrait'
        : 'landscape';

    const settled = await Promise.allSettled(
      queries.map((query, queryIndex) =>
        searchUnsplash(
          query,
          accessKey,
          perQuery,
          orientation,
          queryIndex
        )
      )
    );

    const groups = [];
    const failures = [];

    settled.forEach((result, queryIndex) => {
      if (result.status === 'fulfilled') {
        groups.push(result.value);
        return;
      }

      failures.push({
        queryIndex,
        status: Number(result.reason?.status || 0),
        timeout: result.reason?.name === 'AbortError'
      });
    });

    const candidates = mergeCandidateGroups(
      groups,
      requestedLimit
    );

    const search = {
      queryCount: queries.length,
      fulfilledQueries:
        queries.length - failures.length,
      failedQueries: failures.length,
      timedOutQueries:
        failures.filter(item => item.timeout).length,
      rateLimited:
        failures.some(item => item.status === 429),
      resultCount: candidates.length
    };

    if (
      !candidates.length &&
      failures.length === queries.length
    ) {
      return res.status(
        search.rateLimited ? 429 : 502
      ).json({
        error: search.rateLimited
          ? 'Image provider rate limited'
          : 'Visual search failed',
        candidates: [],
        provider: 'unsplash',
        purpose,
        search
      });
    }

    res.setHeader(
      'Cache-Control',
      'public, max-age=300, s-maxage=900, stale-while-revalidate=3600'
    );

    return res.status(200).json({
      candidates,
      provider: 'unsplash',
      purpose,
      search
    });
  } catch (error) {
    console.error(
      '[VersDay API] visual-search:',
      error
    );
    const status =
      error.message === 'Payload too large'
        ? 413
        : 502;

    return res.status(status).json({
      error: 'Visual search failed',
      candidates: []
    });
  }
}
