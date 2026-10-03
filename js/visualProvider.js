import { isBackendProviderReady } from './backendHealth.js';

// js/visualProvider.js
// Integração segura com provedores externos.
// Nenhuma credencial privada vive no navegador.

function getMeta(name) {
  if (typeof document === 'undefined') return '';
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() || '';
}

function isVercelRuntime() {
  return typeof location !== 'undefined' && /\.vercel\.app$/i.test(location.hostname);
}

function getSearchEndpoint() {
  return getMeta('versday-visual-endpoint') || (isVercelRuntime() ? '/api/visual-search' : '');
}

function getSelectEndpoint() {
  const explicit = getMeta('versday-visual-select-endpoint');
  if (explicit) return explicit;
  if (isVercelRuntime()) return '/api/visual-select';

  const search = getSearchEndpoint();
  if (!search) return '';
  return search.replace(/\/visual-search(?:\?.*)?$/, '/visual-select');
}

function sanitizeCandidate(raw) {
  if (!raw || !raw.id || !raw.imageUrl) return null;

  return {
    id: String(raw.id),
    provider: String(raw.provider || 'External'),
    providerUrl: String(raw.providerUrl || raw.sourceLink || ''),
    imageUrl: String(raw.imageUrl),
    previewUrl: String(raw.previewUrl || raw.imageUrl),
    width: Number(raw.width || 0),
    height: Number(raw.height || 0),
    description: String(raw.description || ''),
    alt: String(raw.alt || raw.description || ''),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    themes: Array.isArray(raw.themes) ? raw.themes.map(String) : [],
    moods: Array.isArray(raw.moods) ? raw.moods.map(String) : [],
    representationModes: Array.isArray(raw.representationModes)
      ? raw.representationModes.map(String)
      : [],
    safeTextAreas: Array.isArray(raw.safeTextAreas) ? raw.safeTextAreas.map(String) : [],
    focalPoint: raw.focalPoint || null,
    mobileFocalPoint: raw.mobileFocalPoint || raw.focalPoint || null,
    qualityScore: Number(raw.qualityScore ?? 0.8),
    compositionScore: Number(raw.compositionScore ?? 0.74),
    identityScore: Number(raw.identityScore ?? 0.78),
    negativeTags: Array.isArray(raw.negativeTags) ? raw.negativeTags.map(String) : [],
    providerSearchScore: Number(raw.providerSearchScore ?? 0),
    query: String(raw.query || ''),
    photographer: raw.photographer ? String(raw.photographer) : null,
    photographerLink: raw.photographerLink ? String(raw.photographerLink) : null,
    downloadLocation: raw.downloadLocation ? String(raw.downloadLocation) : null,
    hasEmbeddedText: Boolean(raw.hasEmbeddedText),
    hasWatermark: Boolean(raw.hasWatermark),
    isAdvertising: Boolean(raw.isAdvertising),
    nsfw: Boolean(raw.nsfw)
  };
}

export function isDynamicVisualSearchEnabled() {
  return Boolean(getSearchEndpoint());
}

export async function fetchProviderCandidates(intent, queries, limit = 20, purpose = 'background') {
  const endpoint = getSearchEndpoint();
  if (!endpoint) return [];

  const providerReady = await isBackendProviderReady('images');
  if (providerReady === false) {
    console.info('[VersDay] Provider visual não configurado; usando fallback premium.');
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verseReference: intent.verseReference,
        intent: {
          semantic: intent.semantic,
          representation: intent.representation,
          visualIntent: intent.visualIntent,
          photography: intent.photography,
          biblicalContext: intent.biblicalContext
        },
        queries: queries.slice(0, 4),
        purpose,
        limit: Math.min(Math.max(limit, 5), 30)
      }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`visual provider HTTP ${response.status}`);
    const payload = await response.json();

    return (payload.candidates || [])
      .map(sanitizeCandidate)
      .filter(Boolean)
      .map(candidate => ({
        ...candidate,
        searchIntentTheme: intent.semantic.primaryTheme
      }));
  } catch (error) {
    console.info(
      '[VersDay] Busca visual externa indisponível; fallback premium será usado.',
      error?.name || error
    );
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function notifyProviderSelection(candidate) {
  if (!candidate?.downloadLocation) return;

  const endpoint = getSelectEndpoint();
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: candidate.id,
        downloadLocation: candidate.downloadLocation
      }),
      keepalive: true
    });
  } catch {
    // Tracking do provedor jamais bloqueia a experiência.
  }
}