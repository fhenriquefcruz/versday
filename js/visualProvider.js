// js/visualProvider.js
// Provider abstraction. Nenhuma credencial privada vive no navegador.

function metaContent(name) {
  if (typeof document === 'undefined') return '';
  return document.querySelector('meta[name="' + name + '"]')?.getAttribute('content')?.trim() || '';
}

function apiBase() {
  const configured = metaContent('versday-api-base');
  if (configured) return configured.replace(/\/$/, '');

  if (typeof window !== 'undefined' && window.VERSDAY_CONFIG?.apiBase) {
    return String(window.VERSDAY_CONFIG.apiBase).replace(/\/$/, '');
  }

  if (typeof location !== 'undefined' && !/\.github\.io$/i.test(location.hostname)) {
    return '';
  }

  return null;
}

function visualSearchEndpoint() {
  const explicit = metaContent('versday-visual-endpoint');
  if (explicit) return explicit;

  const base = apiBase();
  return base === null ? '' : base + '/api/visual-search';
}

function visualTrackEndpoint() {
  const explicit = metaContent('versday-visual-track-endpoint');
  if (explicit) return explicit;

  const base = apiBase();
  if (base !== null) return base + '/api/visual-select';

  const search = visualSearchEndpoint();
  return search ? search.replace(/\/visual-search(?:\?.*)?$/, '/visual-select') : '';
}

function numeric(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sanitizeCandidate(raw, intent) {
  if (!raw || !raw.id || !raw.imageUrl) return null;

  const width = numeric(raw.width, 0);
  const height = numeric(raw.height, 0);
  const pixels = width * height;
  const inferredQuality = pixels >= 4_000_000 ? 0.93 : pixels >= 2_000_000 ? 0.87 : pixels >= 921_600 ? 0.76 : 0.68;

  return {
    id:String(raw.id),
    provider:String(raw.provider || raw.providerName || 'External'),
    providerUrl:String(raw.providerUrl || raw.providerPage || raw.sourceLink || ''),
    imageUrl:String(raw.imageUrl),
    previewUrl:String(raw.previewUrl || raw.imageUrl),
    width,
    height,
    color:raw.color || null,
    description:String(raw.description || raw.alt || ''),
    alt:String(raw.alt || raw.description || ''),
    photographer:raw.photographer ? String(raw.photographer) : null,
    photographerLink:raw.photographerLink ? String(raw.photographerLink) : null,
    sourceLink:raw.sourceLink ? String(raw.sourceLink) : null,
    tags:Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    themes:Array.isArray(raw.themes) ? raw.themes.map(String) : [],
    moods:Array.isArray(raw.moods) ? raw.moods.map(String) : [],
    queryMoods:[...(intent.semantic?.emotionalTone || [])],
    searchIntentTheme:intent.semantic?.primaryTheme || '',
    representationModes:Array.isArray(raw.representationModes)
      ? raw.representationModes.map(String)
      : [intent.representation?.mode || 'conceptual'],
    safeTextAreas:Array.isArray(raw.safeTextAreas) ? raw.safeTextAreas.map(String) : [],
    focalPoint:raw.focalPoint || null,
    mobileFocalPoint:raw.mobileFocalPoint || raw.focalPoint || null,
    qualityScore:numeric(raw.qualityScore, inferredQuality),
    compositionScore:numeric(raw.compositionScore, 0.68),
    identityScore:numeric(raw.identityScore, 0.82),
    negativeTags:Array.isArray(raw.negativeTags) ? raw.negativeTags.map(String) : [],
    providerSearchScore:numeric(raw.providerSearchScore, 0.82),
    query:String(raw.query || ''),
    downloadLocation:raw.downloadLocation ? String(raw.downloadLocation) : null,
    hasEmbeddedText:Boolean(raw.hasEmbeddedText),
    hasWatermark:Boolean(raw.hasWatermark),
    isAdvertising:Boolean(raw.isAdvertising),
    nsfw:Boolean(raw.nsfw),
    curated:false
  };
}

export function isDynamicVisualSearchEnabled() {
  return Boolean(visualSearchEndpoint());
}

export async function fetchProviderCandidates(intent, queries, limit = 20, purpose = 'background') {
  const endpoint = visualSearchEndpoint();
  if (!endpoint) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6500);

  try {
    const response = await fetch(endpoint, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({
        verseReference:intent.verseReference,
        intent:{
          semantic:intent.semantic,
          representation:intent.representation,
          visualIntent:intent.visualIntent,
          photography:intent.photography,
          biblicalContext:intent.biblicalContext
        },
        queries:queries.slice(0,4),
        purpose,
        limit:Math.min(Math.max(limit, 5), 30)
      }),
      signal:controller.signal
    });

    if (!response.ok) throw new Error('visual provider HTTP ' + response.status);

    const payload = await response.json();
    return (payload.candidates || [])
      .map(raw => sanitizeCandidate(raw, intent))
      .filter(Boolean);
  } catch (error) {
    console.info('[VersDay Visual] Busca externa indisponível; usando fallback premium.', error?.name || error);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function notifyProviderSelection(candidate) {
  if (!candidate?.downloadLocation || String(candidate.provider || '').toLowerCase() !== 'unsplash') return;
  const endpoint = visualTrackEndpoint();
  if (!endpoint) return;

  try {
    await fetch(endpoint, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({
        candidateId:candidate.id,
        downloadLocation:candidate.downloadLocation
      }),
      keepalive:true
    });
  } catch {
    // Tracking não bloqueia a experiência.
  }
}
