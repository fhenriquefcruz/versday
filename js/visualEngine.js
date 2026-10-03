// js/visualEngine.js
import {
  analyzeVerse,
  buildVisualQueries,
  buildAbstractVisual,
  VISUAL_ENGINE_VERSION
} from './visualIntelligence.js';
import { getCuratedCandidates } from './visualCatalog.js';
import { rankCandidates, selectBestCandidate } from './visualSelector.js';
import { analyzeShortlist } from './visual-analysis.js';
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

function buildPhotoVisual(candidate, scoring, intent, purpose) {
  const safeAreas = candidate.safeTextAreas?.length ? candidate.safeTextAreas : ['center'];

  return {
    mode: 'photo',
    purpose,
    id: candidate.id,
    provider: candidate.provider || 'VersDay',
    providerUrl: candidate.providerUrl || '',
    imageUrl: candidate.imageUrl,
    previewUrl: candidate.previewUrl || candidate.imageUrl,
    score: scoring.scores.final,
    semanticScore: scoring.scores.semantic,
    emotionalScore: scoring.scores.emotional,
    compositionScore: scoring.scores.composition,
    width: candidate.width || 0,
    height: candidate.height || 0,
    focalPoint: candidate.focalPoint || { x: 0.5, y: 0.5 },
    mobileFocalPoint:
      candidate.mobileFocalPoint ||
      candidate.focalPoint ||
      { x: 0.5, y: 0.5 },
    safeTextAreas: safeAreas,
    textPlacement: safeAreas[0] || 'center',
    overlayStrength: scoring.scores.composition >= 0.88 ? 0.2 : 0.3,
    visualIntent: intent.visualIntent.description,
    photographer: candidate.photographer || null,
    photographerLink: candidate.photographerLink || null,
    query: candidate.query || null
  };
}

function debugEnabled() {
  if (typeof location === 'undefined') return false;
  return new URLSearchParams(location.search).get('visualDebug') === '1';
}

export async function resolveVisualForVerse(verse, options = {}) {
  const force = Boolean(options.force || options.forceRefresh);
  const purpose = String(options.purpose || 'background');
  const reference = verse?.reference || '';

  if (!force) {
    const cached = getCachedVisual(reference, purpose);
    if (cached?.visual) {
      rememberVisualUsage(reference, cached.visual, cached.intent, purpose);
      return {
        intent: cached.intent,
        queries: buildVisualQueries(cached.intent),
        visual: cached.visual,
        diagnostics: {
          source: 'cache',
          purpose,
          engineVersion: VISUAL_ENGINE_VERSION
        }
      };
    }
  }

  const intent = analyzeVerse(verse);
  intent.visualPurpose = purpose;
  const queries = buildVisualQueries(intent);

  // O provedor seguro é opcional. Sem backend, o GitHub Pages permanece
  // funcional com acervo curado e fallback abstrato.
  const [providerCandidates, curatedCandidates] = await Promise.all([
    fetchProviderCandidates(intent, queries, 24, purpose),
    Promise.resolve(getCuratedCandidates(intent, 12))
  ]);

  let candidates = [...providerCandidates, ...curatedCandidates]
    .filter(candidate => getFeedback(reference, candidate.id) !== 'down');

  const recentIds = getRecentVisualIds(8, purpose);

  // Primeiro ranking barato: só os melhores chegam à análise real de pixels.
  const preliminary = rankCandidates(candidates, intent, recentIds);
  const hardReasons = new Set([
    'NO_IMAGE_URL',
    'EMBEDDED_TEXT',
    'WATERMARK',
    'ADVERTISING',
    'UNSAFE_CONTENT',
    'LOW_RESOLUTION',
    'RELIGIOUS_CLICHE',
    'GRAPHIC_OR_EXPLOITATIVE',
    'THEMATIC_CLICHE'
  ]);

  const shortlist = preliminary
    .filter(item => !item.rejectedReasons.some(reason => hardReasons.has(reason)))
    .slice(0, 5)
    .map(item => item.candidate);

  const analyzed = await analyzeShortlist(shortlist, 5);
  if (analyzed.length) {
    const byId = new Map(analyzed.map(candidate => [candidate.id, candidate]));
    candidates = candidates.map(candidate => byId.get(candidate.id) || candidate);
  }

  const { selected, ranked } = selectBestCandidate(candidates, intent, recentIds);

  let visual;
  if (selected) {
    visual = buildPhotoVisual(selected.candidate, selected, intent, purpose);
    await notifyProviderSelection(selected.candidate);
  } else {
    visual = {
      ...buildAbstractVisual(intent),
      purpose
    };
  }

  setCachedVisual(reference, intent, visual, purpose);
  rememberVisualUsage(reference, visual, intent, purpose);

  const diagnostics = {
    source: selected ? selected.candidate.provider || 'catalog' : 'abstract-fallback',
    purpose,
    engineVersion: VISUAL_ENGINE_VERSION,
    contextSource: intent.biblicalContext?.contextSource || 'genre-only',
    candidateCount: candidates.length,
    providerCandidateCount: providerCandidates.length,
    curatedCandidateCount: curatedCandidates.length,
    analyzedCandidateCount: analyzed.length,
    acceptedCandidateId: selected?.candidate?.id || null,
    ranked: ranked.slice(0, 5).map(item => ({
      id: item.candidate.id,
      accepted: item.accepted,
      scores: item.scores,
      rejectedReasons: item.rejectedReasons
    }))
  };

  if (debugEnabled()) {
    console.groupCollapsed(`[VersDay Visual] ${reference || '(sem referência)'} · ${purpose}`);
    console.log('Biblical context', intent.biblicalContext);
    console.log('Intent', intent);
    console.log('Queries', queries);
    console.table(diagnostics.ranked);
    console.log('Selected visual', visual);
    console.groupEnd();
  }

  return { intent, queries, visual, diagnostics };
}