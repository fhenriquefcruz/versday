// api/visual-search.js
import { applyCors, readJsonBody } from './_cors.js';

const UNSPLASH_SEARCH_URL = 'https://api.unsplash.com/search/photos';
const MAX_QUERIES = 4;
const MAX_RESULTS = 30;

function withUtm(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    url.searchParams.set('utm_source', 'VersDay');
    url.searchParams.set('utm_medium', 'referral');
    return url.href;
  } catch {
    return value;
  }
}

function queryText(value) {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') return String(value.query || '').trim();
  return '';
}

function qualityFromSize(width, height) {
  const pixels = Number(width || 0) * Number(height || 0);
  if (pixels >= 8_000_000) return 0.97;
  if (pixels >= 4_000_000) return 0.94;
  if (pixels >= 2_000_000) return 0.88;
  if (pixels >= 921_600) return 0.76;
  return 0.62;
}

function normalizePhoto(photo, query, rank) {
  const photographer = photo.user?.name || 'Fotógrafo do Unsplash';
  const photographerLink = withUtm(photo.user?.links?.html);
  const sourceLink = withUtm(photo.links?.html || 'https://unsplash.com/');

  return {
    id:'unsplash:' + photo.id,
    provider:'unsplash',
    providerUrl:sourceLink,
    sourceLink,
    query,
    imageUrl:photo.urls?.regular || photo.urls?.full,
    previewUrl:photo.urls?.small || photo.urls?.thumb || photo.urls?.regular,
    width:photo.width || 0,
    height:photo.height || 0,
    color:photo.color || null,
    description:photo.alt_description || photo.description || '',
    alt:photo.alt_description || photo.description || '',
    tags:Array.isArray(photo.tags) ? photo.tags.map(tag => tag.title).filter(Boolean) : [],
    photographer,
    photographerLink,
    downloadLocation:photo.links?.download_location || null,
    providerSearchScore:Math.max(0.62, 0.96 - rank * 0.025),
    qualityScore:qualityFromSize(photo.width, photo.height),
    compositionScore:0.68,
    identityScore:0.84,
    hasEmbeddedText:false,
    hasWatermark:false,
    isAdvertising:false,
    nsfw:false
  };
}

async function searchUnsplash(query, accessKey, perPage, orientation) {
  const url = new URL(UNSPLASH_SEARCH_URL);
  url.searchParams.set('query', query);
  url.searchParams.set('orientation', orientation);
  url.searchParams.set('content_filter', 'high');
  url.searchParams.set('per_page', String(Math.max(1, Math.min(perPage, 20))));

  const response = await fetch(url, {
    headers:{
      Authorization:'Client-ID ' + accessKey,
      'Accept-Version':'v1'
    }
  });

  if (!response.ok) {
    const error = new Error('Unsplash ' + response.status);
    error.status = response.status;
    throw error;
  }

  const payload = await response.json();
  return (payload.results || []).map((photo, rank) => normalizePhoto(photo, query, rank));
}

function orientationForPurpose(purpose) {
  if (purpose === 'share-portrait' || purpose === 'background-mobile') return 'portrait';
  if (purpose === 'share-square') return 'squarish';
  return 'landscape';
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return res.status(503).json({
      error:'Image provider not configured',
      candidates:[]
    });
  }

  try {
    const body = await readJsonBody(req);
    const queries = Array.from(new Set(
      (Array.isArray(body.queries) ? body.queries : [])
        .map(queryText)
        .filter(value => value.length >= 8 && value.length <= 420)
    )).slice(0, MAX_QUERIES);

    if (!queries.length) {
      return res.status(400).json({ error:'No valid visual queries', candidates:[] });
    }

    const requestedLimit = Math.max(5, Math.min(Number(body.limit) || MAX_RESULTS, MAX_RESULTS));
    const perQuery = Math.max(5, Math.min(20, Math.ceil(requestedLimit / queries.length)));
    const orientation = orientationForPurpose(String(body.purpose || 'background'));

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
    return res.status(200).json({
      candidates,
      provider:'unsplash',
      queryCount:queries.length
    });
  } catch (error) {
    console.error('[VersDay API] visual-search:', error);
    const status = error.message === 'Payload too large' ? 413 : 502;
    return res.status(status).json({ error:'Visual search failed', candidates:[] });
  }
}
