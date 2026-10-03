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

function getValidateEndpoint() {
  if (isVercelRuntime()) return '/api/visual-validate';

  const search = getSearchEndpoint();
  if (!search) return '';

  return search.replace(
    /\/visual-search(?:\?.*)?$/,
    '/visual-validate'
  );
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

export async function validateVisualFinalists(
  intent,
  candidates,
  purpose = 'background'
) {
  const shortlist = Array.isArray(candidates)
    ? candidates.slice(0, 3)
    : [];

  if (!shortlist.length) {
    return {
      enabled: false,
      reason: 'NO_CANDIDATES',
      decisions: []
    };
  }

  const ready = await isBackendProviderReady('vlm');
  if (ready !== true) {
    return {
      enabled: false,
      reason: ready === false ? 'VLM_NOT_CONFIGURED' : 'NO_BACKEND_HEALTH',
      decisions: []
    };
  }

  const endpoint = getValidateEndpoint();
  if (!endpoint) {
    return {
      enabled: false,
      reason: 'NO_VLM_ENDPOINT',
      decisions: []
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verseReference: intent.verseReference,
        purpose,
        intent: {
          semantic: intent.semantic,
          representation: intent.representation,
          visualIntent: intent.visualIntent,
          biblicalContext: intent.biblicalContext
        },
        candidates: shortlist.map(candidate => ({
          id: candidate.id,
          provider: candidate.provider,
          imageUrl: candidate.previewUrl || candidate.imageUrl,
          description: candidate.description,
          alt: candidate.alt,
          tags: candidate.tags
        }))
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`visual validator HTTP ${response.status}`);
    }

    const payload = await response.json();
    const decisions = Array.isArray(payload.decisions)
      ? payload.decisions
          .map(decision => ({
            id: String(decision?.id || ''),
            semanticCompatibility: Number(
              decision?.semanticCompatibility ?? 0
            ),
            emotionalCompatibility: Number(
              decision?.emotionalCompatibility ?? 0
            ),
            contradiction: Boolean(decision?.contradiction),
            unsafeOrCliche: Boolean(decision?.unsafeOrCliche),
            accepted: Boolean(decision?.accepted),
            reason: String(decision?.reason || '').slice(0, 240)
          }))
          .filter(decision => decision.id)
      : [];

    return {
      enabled: true,
      model: String(payload.model || ''),
      decisions
    };
  } catch (error) {
    console.info(
      '[VersDay] VLM indisponível; ranking local permanece soberano.',
      error?.name || error
    );

    return {
      enabled: false,
      reason:
        error?.name === 'AbortError'
          ? 'VLM_TIMEOUT'
          : 'VLM_FAILED_OPEN',
      decisions: []
    };
  } finally {
    clearTimeout(timeout);
  }
}
