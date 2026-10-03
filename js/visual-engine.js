import { analyzeVerseVisualIntent, buildVisualQueries, THEME_PROFILES } from './visual-semantic.js';
import { getCuratedCandidates } from './visual-library.js';
import { searchExternalCandidates, trackExternalSelection, getApiBase } from './visual-provider.js';
import { rankCandidates, passesSelectionThreshold } from './visual-scoring.js';
import { analyzeShortlist } from './visual-analysis.js';
import { getVisualCache, setVisualCache, recordVisualUsage, recordVisualMetric } from './visual-memory.js';

export const VISUAL_VERSIONS = Object.freeze({ semantic:'1.0.0', query:'1.0.0', ranking:'1.0.0', crop:'1.0.0' });

function isDebug() {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('visualDebug') === '1';
}

function abstractSelection(intent, reason='NO_CANDIDATE_ABOVE_THRESHOLD') {
  const theme = intent?.semantic?.primaryTheme || 'fe';
  const palette = THEME_PROFILES[theme]?.palette || ['#0d1117','#203244','#9a815a'];
  return {
    kind:'abstract',
    reason,
    purpose:intent?.visualPurpose || 'background',
    imageId:null,
    imageUrl:'',
    provider:'versday',
    score:1,
    focalPoint:{x:0.5,y:0.5},
    textPlacement:'center',
    overlay:{strength:0},
    abstract:{
      palette,
      css:`radial-gradient(circle at 72% 20%, ${palette[2]}33 0%, transparent 34%), radial-gradient(circle at 18% 78%, ${palette[1]}55 0%, transparent 42%), linear-gradient(145deg, ${palette[0]} 0%, ${palette[1]} 58%, #080c12 100%)`
    },
    attribution:null,
    intent
  };
}

function toSelection(scored, intent) {
  const c = scored.candidate;
  return {
    kind:'image',
    reason:'SELECTED',
    purpose:intent.visualPurpose || 'background',
    imageId:c.id,
    imageUrl:c.imageUrl,
    previewUrl:c.previewUrl,
    provider:c.provider,
    providerName:c.providerName,
    providerPage:c.providerPage,
    score:scored.score,
    dimensions:scored.dimensions,
    focalPoint:c.focalPoint || {x:0.5,y:0.5},
    textPlacement:c.safeAreas?.[0] || 'center',
    overlay:{ strength: scored.dimensions.composition > 0.84 ? 0.28 : 0.4 },
    attribution: c.photographer || c.providerName ? {
      photographer:c.photographer || null,
      photographerLink:c.photographerLink || null,
      providerName:c.providerName || c.provider,
      providerPage:c.providerPage || null
    } : null,
    downloadLocation:c.downloadLocation || null,
    query:c.query || null,
    visualSignature:[...(c.tags || [])].slice(0,4).sort().join('|') || null,
    intent
  };
}

export async function resolveVisualForVerse(verse, options={}) {
  const now = () => (typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now());
  const started = now();
  const intent = analyzeVerseVisualIntent(verse, options.context || {});
  const purpose = options.purpose || 'background';
  intent.visualPurpose = purpose;
  const providerMode = getApiBase() === null ? 'offline' : 'online';
  const rankingVersion = `${VISUAL_VERSIONS.ranking}:${purpose}:${providerMode}`;

  if (!options.forceRefresh) {
    const cached = getVisualCache(intent.verseReference, rankingVersion);
    if (cached?.selection) {
      recordVisualMetric('CACHE_HIT',{reference:intent.verseReference,kind:cached.selection.kind});
      return { ...cached.selection, intent, cacheHit:true };
    }
  }

  const queries = buildVisualQueries(intent);
  const [external, curated] = await Promise.all([
    searchExternalCandidates(intent, queries, 24, purpose),
    Promise.resolve(getCuratedCandidates(intent, 12))
  ]);

  const dedup = new Map();
  [...external, ...curated].forEach(c=>{ if (c?.id && !dedup.has(c.id)) dedup.set(c.id,c); });
  let candidates = [...dedup.values()];
  const preRanked = rankCandidates(candidates, intent);
  const shortlist = preRanked.filter(item=>!item.rejectionReasons?.some(r=>['NO_IMAGE_URL','WATERMARK','UNSAFE_CONTENT','LOW_RESOLUTION'].includes(r))).slice(0,5).map(item=>item.candidate);
  const analyzed = await analyzeShortlist(shortlist,5);
  if (analyzed.length) {
    const analyzedById = new Map(analyzed.map(c=>[c.id,c]));
    candidates = candidates.map(c=>analyzedById.get(c.id) || c);
  }
  const ranked = rankCandidates(candidates, intent);
  const selected = ranked.find(item=>passesSelectionThreshold(item,intent));
  const selection = selected ? toSelection(selected,intent) : abstractSelection(intent, candidates.length ? 'LOW_RELEVANCE' : 'NO_CANDIDATES');

  setVisualCache(intent.verseReference, selection, intent, rankingVersion);
  recordVisualUsage(selection,intent);
  recordVisualMetric('VISUAL_SELECTION',{
    reference:intent.verseReference,
    kind:selection.kind,
    provider:selection.provider,
    candidateCount:candidates.length,
    externalCount:external.length,
    score:selection.score,
    durationMs:Math.round(now()-started),
    reason:selection.reason
  });

  if (selection.kind === 'image') {
    const original = selected?.candidate;
    trackExternalSelection(original);
  }

  if (isDebug()) {
    console.groupCollapsed(`[VersDay Visual] ${intent.verseReference} → ${selection.kind}`);
    console.log('Intent', intent);
    console.log('Queries', queries);
    console.table(ranked.slice(0,5).map(x=>({id:x.candidate?.id,score:x.score,semantic:x.dimensions?.semantic,rejected:x.rejected,reasons:x.rejectionReasons?.join(',')})));
    console.log('Selection', selection);
    console.groupEnd();
  }

  return selection;
}

export function createAbstractFallback(verse, reason='IMAGE_LOAD_FAILURE') {
  return abstractSelection(analyzeVerseVisualIntent(verse),reason);
}
