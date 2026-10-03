// js/visualEngine.js
import {
  analyzeVerse,
  buildVisualQueries,
  buildAbstractVisual,
  VISUAL_ENGINE_VERSION
} from './visualIntelligence.js';
import { getCuratedCandidates } from './visualCatalog.js';
import { selectBestCandidate } from './visualSelector.js';
import {
  getCachedVisual,
  setCachedVisual,
  rememberVisualUsage,
  getRecentVisualIds,
  getFeedback
} from './visualMemory.js';
import {
  fetchProviderCandidates,
  notifyProviderSelection
} from './visualProvider.js';

function buildPhotoVisual(candidate, scoring, intent) {
  const safeAreas = candidate.safeTextAreas || ['center'];
  return {
    mode: 'photo',
    id: candidate.id,
    provider: candidate.provider || 'VersDay',
    providerUrl: candidate.providerUrl || '',
    imageUrl: candidate.imageUrl,
    score: scoring.scores.final,
    semanticScore: scoring.scores.semantic,
    emotionalScore: scoring.scores.emotional,
    compositionScore: scoring.scores.composition,
    focalPoint: candidate.focalPoint || { x: 0.5, y: 0.5 },
    mobileFocalPoint: candidate.mobileFocalPoint || candidate.focalPoint || { x: 0.5, y: 0.5 },
    safeTextAreas: safeAreas,
    textPlacement: safeAreas[0] || 'center',
    overlayStrength: scoring.scores.composition >= 0.88 ? 0.22 : 0.3,
    visualIntent: intent.visualIntent.description
  };
}

function debugEnabled() {
  if (typeof location === 'undefined') return false;
  return new URLSearchParams(location.search).get('visualDebug') === '1';
}

export async function resolveVisualForVerse(verse, options = {}) {
  const force = Boolean(options.force);
  const reference = verse?.reference || '';

  if (!force) {
    const cached = getCachedVisual(reference);
    if (cached?.visual) {
      rememberVisualUsage(reference, cached.visual);
      return {
        intent: cached.intent,
        queries: buildVisualQueries(cached.intent),
        visual: cached.visual,
        diagnostics: { source: 'cache', engineVersion: VISUAL_ENGINE_VERSION }
      };
    }
  }

  const intent = analyzeVerse(verse);
  const queries = buildVisualQueries(intent);

  // O provedor seguro é opcional. No GitHub Pages, sem endpoint server-side,
  // retorna [] e o motor usa somente catálogo curado + fallback abstrato.
  const [providerCandidates, curatedCandidates] = await Promise.all([
    fetchProviderCandidates(intent, queries, 20),
    Promise.resolve(getCuratedCandidates())
  ]);

  const candidates = [...providerCandidates, ...curatedCandidates]
    .filter(candidate => getFeedback(reference, candidate.id) !== 'down');

  const recentIds = getRecentVisualIds(8);
  const { selected, ranked } = selectBestCandidate(candidates, intent, recentIds);

  let visual;
  if (selected) {
    visual = buildPhotoVisual(selected.candidate, selected, intent);
    await notifyProviderSelection(selected.candidate);
  } else {
    visual = buildAbstractVisual(intent);
  }

  setCachedVisual(reference, intent, visual);
  rememberVisualUsage(reference, visual);

  const diagnostics = {
    source: selected ? selected.candidate.provider || 'catalog' : 'abstract-fallback',
    engineVersion: VISUAL_ENGINE_VERSION,
    candidateCount: candidates.length,
    acceptedCandidateId: selected?.candidate?.id || null,
    ranked: ranked.slice(0, 5).map(item => ({
      id: item.candidate.id,
      accepted: item.accepted,
      scores: item.scores,
      rejectedReasons: item.rejectedReasons
    }))
  };

  if (debugEnabled()) {
    console.groupCollapsed(`[VersDay Visual] ${reference || '(sem referência)'}`);
    console.log('Intent', intent);
    console.log('Queries', queries);
    console.table(diagnostics.ranked);
    console.log('Selected visual', visual);
    console.groupEnd();
  }

  return { intent, queries, visual, diagnostics };
}
