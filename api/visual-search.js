import { applyCors, readJsonBody } from './_cors.js';

const UNSPLASH_SEARCH_URL = 'https://api.unsplash.com/search/photos';
const MAX_QUERIES = 4;
const MAX_RESULTS = 30;

function normalizePhoto(photo, query, rank) {
  const photographer = photo.user?.name || 'Fotógrafo do Unsplash';
  const photographerLink = photo.user?.links?.html
    ? `${photo.user.links.html}?utm_source=VersDay&utm_medium=referral`
    : null;
  const sourceLink = photo.links?.html
    ? `${photo.links.html}?utm_source=VersDay&utm_medium=referral`
    : 'https://unsplash.com/?utm_source=VersDay&utm_medium=referral';

  return {
    id: `unsplash:${photo.id}`,
    provider: 'unsplash',
    providerName: 'Unsplash',
    providerPage: sourceLink,
    query,
    imageUrl: photo.urls?.regular || photo.urls?.full,
    previewUrl: photo.urls?.small || photo.urls?.thumb || photo.urls?.regular,
    width: photo.width || null,
    height: photo.height || null,
    color: photo.color || null,
    description: photo.alt_description || photo.description || '',
    alt: photo.alt_description || photo.description || '',
    tags: Array.isArray(photo.tags) ? photo.tags.map(tag => tag.title).filter(Boolean) : [],
    photographer,
    photographerLink,
    sourceLink,
    downloadLocation: photo.links?.download_location || null,
    providerRank: rank + 1,
    providerSearchScore: Math.max(0.58, 0.94 - rank * 0.03),
    attribution: {
      photographer,
      photographerLink,
      source: 'Unsplash',
      sourceLink
    }
  };
}

async function searchUnsplash(query, accessKey, perPage = 10, orientation = 'landscape') {
  const url = new URL(UNSPLASH_SEARCH_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', orientation);
  url.searchParams.set('content_filter', 'high');
  url.searchParams.set('per_page', String(Math.max(1, Math.min(perPage, 20))));

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1'
    }
  });

  if (!response.ok) {
    const error = new Error(`Unsplash ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  return (payload.results || []).map((photo, rank) => normalizePhoto(photo, query, rank));
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(503).json({ error: 'Image provider not configured', candidates: [] });
  }

  try {
    const body = await readJsonBody(req);
    const queries = Array.from(new Set(
      (Array.isArray(body.queries) ? body.queries : [])
        .map(value => String(value || '').trim())
        .filter(value => value.length >= 8 && value.length <= 280)
    )).slice(0, MAX_QUERIES);

    if (!queries.length) return res.status(400).json({ error: 'No valid visual queries', candidates: [] });

    const requestedLimit = Math.max(5, Math.min(Number(body.limit) || MAX_RESULTS, MAX_RESULTS));
    const perQuery = Math.max(5, Math.ceil(requestedLimit / queries.length));
    const purpose = String(body.purpose || 'background');
    const orientation = purpose === 'share-portrait' ? 'portrait' : 'landscape';
    const settled = await Promise.allSettled(
      queries.map(query => searchUnsplash(query, accessKey, perQuery, orientation))
    );

    const seen = new Set();
    const candidates = [];
    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      for (const candidate of result.value) {
        if (!candidate.imageUrl || seen.has(candidate.id)) continue;
        seen.add(candidate.id);
        candidates.push(candidate);
        if (candidates.length >= requestedLimit) break;
      }
      if (candidates.length >= requestedLimit) break;
    }

    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=3600');
    return res.status(200).json({ candidates, provider: 'unsplash' });
  } catch (error) {
    console.error('[VersDay API] visual-search:', error);
    const status = error.message === 'Payload too large' ? 413 : 502;
    return res.status(status).json({ error: 'Visual search failed', candidates: [] });
  }
}
