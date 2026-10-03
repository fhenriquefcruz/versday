// js/visualEngine.js
import {
  analyzeVerse,
  buildVisualQueries,
  buildAbstractVisual,
  VISUAL_ENGINE_VERSION
} from './visualIntelligence.js';
import { enrichVisualIntentWithContext, enrichQueriesWithContext } from './biblicalContext.js';
import { getCuratedCandidates } from './visualCatalog.js';
import { rankCandidates, selectBestCandidate } from './visualSelector.js';
import { analyzeShortlist } from './visualAnalysis.js';
import {
  getCachedVisual,
  setCachedVisual,
  rememberVisualUsage,
  getRecentVisualUsage,
  getFeedback,
  recordVisualMetric
} from './visualMemory.js';
import {
  fetchProviderCandidates,
  notifyProviderSelection
} from './visualProvider.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function buildPhotoVisual(candidate, scoring, intent, purpose) {
  const safeAreas = candidate.safeTextAreas?.length ? candidate.safeTextAreas : ['center'];
  const analysis = candidate.technicalAnalysis || {};
  const overlayStrength = clamp(
    0.14 +
    Number(analysis.complexity || 0.35) * 0.2 +
    (Number(analysis.averageLuminance || 0.5) > 0.76 ? 0.06 : 0),
    0.14,
    0.38
  );

  return {
    mode:'photo',
    purpose,
    id:candidate.id,
    provider:candidate.provider || 'VersDay',
    providerUrl:candidate.providerUrl || candidate.sourceLink || '',
    imageUrl:candidate.imageUrl,
    previewUrl:candidate.previewUrl || candidate.imageUrl,
    photographer:candidate.photographer || null,
    photographerLink:candidate.photographerLink || null,
    sourceLink:candidate.sourceLink || candidate.providerUrl || '',
    score:scoring.scores.final,
    semanticScore:scoring.scores.semantic,
    emotionalScore:scoring.scores.emotional,
    qualityScore:scoring.scores.quality,
    compositionScore:scoring.scores.composition,
    responsiveScore:scoring.scores.responsive,
    focalPoint:candidate.focalPoint || { x:0.5, y:0.5 },
    mobileFocalPoint:candidate.mobileFocalPoint || candidate.focalPoint || { x:0.5, y:0.5 },
    safeTextAreas:safeAreas,
    textPlacement:safeAreas[0] || 'center',
    overlayStrength,
    visualIntent:intent.visualIntent.description,
    query:candidate.query || null,
    tags:[...(candidate.tags || [])],
    downloadLocation:candidate.downloadLocation || null,
    technicalAnalysis:analysis,
    attribution:{
      photographer:candidate.photographer || null,
      photographerLink:candidate.photographerLink || null,
      provider:candidate.provider || 'VersDay',
      providerUrl:candidate.providerUrl || candidate.sourceLink || ''
    }
  };
}

function debugEnabled() {
  if (typeof location === 'undefined') return false;
  return new URLSearchParams(location.search).get('visualDebug') === '1';
}

function contextualIntent(verse, purpose) {
  const base = analyzeVerse(verse);
  const enriched = enrichVisualIntentWithContext(base, verse);
  return {
    ...enriched,
    visualPurpose:purpose
  };
}

function buildAbstract(intent, purpose, reason) {
  const visual = buildAbstractVisual(intent);
  return {
    ...visual,
    id:String(visual.id || 'abstract') + ':' + purpose,
    purpose,
    reason:reason || visual.reason
  };
}

function severeRejection(item) {
  const reasons = item.rejectedReasons || [];
  return reasons.some(reason => [
    'NO_IMAGE_URL',
    'WATERMARK',
    'EMBEDDED_TEXT',
    'ADVERTISING',
    'UNSAFE_CONTENT',
    'LOW_RESOLUTION',
    'RELIGIOUS_OR_STOCK_CLICHE'
  ].includes(reason));
}

export async function resolveVisualForVerse(verse, options = {}) {
  const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const force = Boolean(options.force || options.forceRefresh);
  const purpose = String(options.purpose || 'background');
  const reference = verse?.reference || '';
  const intent = contextualIntent(verse, purpose);

  if (!force) {
    const cached = getCachedVisual(reference, purpose);
    if (cached?.visual) {
      rememberVisualUsage(reference, cached.visual, cached.intent || intent, purpose);
      recordVisualMetric('CACHE_HIT', { reference, purpose, visualId:cached.visual.id });
      return {
        intent:cached.intent || intent,
        queries:enrichQueriesWithContext(buildVisualQueries(cached.intent || intent), cached.intent || intent),
        visual:cached.visual,
        diagnostics:{
          source:'cache',
          purpose,
          engineVersion:VISUAL_ENGINE_VERSION
        }
      };
    }
  }

  const queries = enrichQueriesWithContext(buildVisualQueries(intent), intent);

  const [providerCandidates, curatedCandidates] = await Promise.all([
    fetchProviderCandidates(intent, queries, 24, purpose),
    Promise.resolve(getCuratedCandidates())
  ]);

  let candidates = [...providerCandidates, ...curatedCandidates]
    .filter(candidate => getFeedback(reference, candidate.id) !== 'down');

  const recentUsage = getRecentVisualUsage(36);
  const preRanked = rankCandidates(candidates, intent, recentUsage);
  const shortlist = preRanked
    .filter(item => !severeRejection(item))
    .slice(0, 5)
    .map(item => item.candidate);

  const analyzed = await analyzeShortlist(shortlist, 5);
  if (analyzed.length) {
    const byId = new Map(analyzed.map(candidate => [candidate.id, candidate]));
    candidates = candidates.map(candidate => byId.get(candidate.id) || candidate);
  }

  const { selected, ranked } = selectBestCandidate(candidates, intent, recentUsage);

  let visual;
  if (selected) {
    visual = buildPhotoVisual(selected.candidate, selected, intent, purpose);
    await notifyProviderSelection(selected.candidate);
  } else {
    visual = buildAbstract(
      intent,
      purpose,
      candidates.length ? 'NO_CANDIDATE_ABOVE_THRESHOLD' : 'NO_CANDIDATES'
    );
  }

  setCachedVisual(reference, intent, visual, purpose);
  rememberVisualUsage(reference, visual, intent, purpose);

  const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const diagnostics = {
    source:selected ? selected.candidate.provider || 'catalog' : 'abstract-fallback',
    purpose,
    engineVersion:VISUAL_ENGINE_VERSION,
    contextSource:intent.biblicalContext?.contextSource || 'genre-only',
    candidateCount:candidates.length,
    externalCandidateCount:providerCandidates.length,
    curatedCandidateCount:curatedCandidates.length,
    analyzedCandidateCount:analyzed.length,
    acceptedCandidateId:selected?.candidate?.id || null,
    durationMs:Math.round(ended - started),
    ranked:ranked.slice(0, 5).map(item => ({
      id:item.candidate.id,
      provider:item.candidate.provider,
      accepted:item.accepted,
      scores:item.scores,
      rejectedReasons:item.rejectedReasons,
      technicalAnalysis:item.candidate.technicalAnalysis || null
    }))
  };

  recordVisualMetric('VISUAL_SELECTION', {
    reference,
    purpose,
    source:diagnostics.source,
    candidateCount:diagnostics.candidateCount,
    externalCandidateCount:diagnostics.externalCandidateCount,
    visualId:visual.id,
    score:Number(visual.score || 0),
    durationMs:diagnostics.durationMs,
    reason:visual.reason || 'SELECTED'
  });

  if (debugEnabled()) {
    console.groupCollapsed('[VersDay Visual] ' + (reference || '(sem referência)') + ' · ' + purpose);
    console.log('Intent', intent);
    console.log('Context', intent.biblicalContext);
    console.log('Queries', queries);
    console.table(diagnostics.ranked);
    console.log('Selected visual', visual);
    console.groupEnd();
  }

  return { intent, queries, visual, diagnostics };
}
