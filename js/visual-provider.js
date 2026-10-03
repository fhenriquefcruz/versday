// Provider abstraction. Nenhuma credencial privada vive no navegador.

export function getApiBase() {
  if (typeof window !== 'undefined' && window.VERSDAY_CONFIG?.apiBase) {
    return String(window.VERSDAY_CONFIG.apiBase).replace(/\/$/,'');
  }
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="versday-api-base"]');
    if (meta?.content) return meta.content.replace(/\/$/,'');
  }
  if (typeof location !== 'undefined' && /\.vercel\.app$/i.test(location.hostname)) return '';
  return null;
}

function normalizeCandidate(raw) {
  if (!raw) return null;
  return {
    id: raw.id || raw.imageId,
    provider: raw.provider || 'unsplash',
    providerName: raw.providerName || 'Unsplash',
    providerPage: raw.providerPage || raw.sourceLink || raw.links?.html || raw.pageUrl || null,
    imageUrl: raw.imageUrl || raw.urls?.regular || raw.src?.large2x || raw.src?.large,
    previewUrl: raw.previewUrl || raw.urls?.small || raw.src?.medium,
    width: raw.width || 0,
    height: raw.height || 0,
    color: raw.color || null,
    description: raw.description || raw.alt_description || raw.alt || '',
    alt: raw.alt || raw.alt_description || raw.description || '',
    photographer: raw.photographer || raw.user?.name || null,
    photographerLink: raw.photographerLink || raw.user?.links?.html || null,
    downloadLocation: raw.downloadLocation || raw.links?.download_location || null,
    tags: raw.tags || [],
    themes: raw.themes || [],
    moods: raw.moods || [],
    safeAreas: raw.safeAreas || [],
    focalPoint: raw.focalPoint || null,
    qualityScore: raw.qualityScore,
    compositionScore: raw.compositionScore,
    hasEmbeddedText: !!raw.hasEmbeddedText,
    hasWatermark: !!raw.hasWatermark,
    isAdvertising: !!raw.isAdvertising,
    nsfw: !!raw.nsfw,
    curated: false,
    providerRank: raw.providerRank || null,
    providerSearchScore: raw.providerSearchScore,
    query: raw.query || '',
    vlm: raw.vlm || null
  };
}

export async function searchExternalCandidates(intent, queries, limit=24, purpose='background') {
  const apiBase = getApiBase();
  if (apiBase === null) return [];
  const endpoint = `${apiBase}/api/visual-search`;
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), 5500);
  try {
    const response = await fetch(endpoint, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        intent: {
          verseReference:intent.verseReference,
          semantic:intent.semantic,
          representation:intent.representation,
          visualIntent:intent.visualIntent,
          photography:intent.photography
        },
        queries:queries.slice(0,4),
        purpose,
        limit:Math.min(30,Math.max(5,limit))
      }),
      signal:controller.signal
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.candidates || []).map(normalizeCandidate).filter(x=>x?.imageUrl).map(candidate => ({
      ...candidate,
      themes: candidate.themes?.length ? candidate.themes : [intent.semantic.primaryTheme],
      searchIntentTheme: intent.semantic.primaryTheme
    }));
  } catch (error) {
    console.info('[VersDay Visual] Provider externo indisponível; usando fallback premium.', error?.name || error);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function trackExternalSelection(candidate) {
  if (!candidate?.downloadLocation || candidate.provider !== 'unsplash') return;
  const apiBase = getApiBase();
  if (apiBase === null) return;
  try {
    await fetch(`${apiBase}/api/visual-select`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ downloadLocation:candidate.downloadLocation, imageId:candidate.id }),
      keepalive:true
    });
  } catch {}
}
