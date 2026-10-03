// js/visualProvider.js
// O navegador NUNCA recebe chave de Unsplash/Pexels.
// Para habilitar busca dinâmica, configure um endpoint seguro via:
// <meta name="versday-visual-endpoint" content="https://.../api/visual-search">
//
// Contrato esperado do proxy:
// POST { verseReference, intent, queries, limit }
// -> { candidates: [{ id, provider, providerUrl, imageUrl, tags, moods,
//       representationModes, safeTextAreas, focalPoint, mobileFocalPoint,
//       qualityScore, compositionScore, identityScore, downloadLocation? }] }

function getEndpoint() {
  if (typeof document === 'undefined') return '';
  return document
    .querySelector('meta[name="versday-visual-endpoint"]')
    ?.getAttribute('content')
    ?.trim() || '';
}

function sanitizeCandidate(raw) {
  if (!raw || !raw.id || !raw.imageUrl) return null;
  return {
    id: String(raw.id),
    provider: String(raw.provider || 'External'),
    providerUrl: String(raw.providerUrl || ''),
    imageUrl: String(raw.imageUrl),
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    moods: Array.isArray(raw.moods) ? raw.moods.map(String) : [],
    representationModes: Array.isArray(raw.representationModes)
      ? raw.representationModes.map(String)
      : ['conceptual'],
    safeTextAreas: Array.isArray(raw.safeTextAreas) ? raw.safeTextAreas.map(String) : ['center'],
    focalPoint: raw.focalPoint || { x: 0.5, y: 0.5 },
    mobileFocalPoint: raw.mobileFocalPoint || raw.focalPoint || { x: 0.5, y: 0.5 },
    qualityScore: Number(raw.qualityScore ?? 0.8),
    compositionScore: Number(raw.compositionScore ?? 0.75),
    identityScore: Number(raw.identityScore ?? 0.78),
    negativeTags: Array.isArray(raw.negativeTags) ? raw.negativeTags.map(String) : [],
    downloadLocation: raw.downloadLocation ? String(raw.downloadLocation) : null
  };
}

export function isDynamicVisualSearchEnabled() {
  return Boolean(getEndpoint());
}

export async function fetchProviderCandidates(intent, queries, limit = 20) {
  const endpoint = getEndpoint();
  if (!endpoint) return [];

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verseReference: intent.verseReference,
        intent,
        queries,
        limit: Math.min(Math.max(limit, 1), 30)
      })
    });

    if (!response.ok) throw new Error(`visual provider HTTP ${response.status}`);
    const payload = await response.json();
    return (payload.candidates || [])
      .map(sanitizeCandidate)
      .filter(Boolean);
  } catch (error) {
    console.warn('[VersDay] Busca visual externa indisponível; usando fallback seguro.', error);
    return [];
  }
}

export async function notifyProviderSelection(candidate) {
  const endpoint = getEndpoint();
  if (!endpoint || !candidate?.downloadLocation) return;

  // O proxy é responsável por cumprir download tracking do provedor sem
  // expor credenciais ao navegador.
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track-download',
        candidateId: candidate.id,
        downloadLocation: candidate.downloadLocation
      })
    });
  } catch {
    // Tracking não bloqueia a experiência visual.
  }
}
