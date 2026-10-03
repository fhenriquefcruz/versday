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
  getRecentVisualUsage,
  getFeedback
} from './visualMemory.js';
import {
  fetchProviderCandidates,
  notifyProviderSelection,
  validateVisualFinalists
} from './visualProvider.js';
import { isBackendProviderReady } from './backendHealth.js';
import {
  recordVisualTelemetry,
  summarizeVisualTelemetry
} from './visualTelemetry.js';

function clampVisual(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function nowMs() {
  return typeof performance !== 'undefined' &&
    typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function elapsedMs(start) {
  return Number(Math.max(0, nowMs() - start).toFixed(1));
}

function dominantRejectReason(ranked = []) {
  const counts = new Map();

  for (const item of ranked) {
    for (const reason of item.rejectedReasons || []) {
      counts.set(reason, (counts.get(reason) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })[0]?.[0] || null;
}

export function deriveVisualDecision({
  selected = null,
  ranked = [],
  candidateCount = 0,
  vlm = {}
} = {}) {
  if (selected) {
    return {
      code: 'PHOTO_ACCEPTED',
      dominantRejectReason: null
    };
  }

  if (!candidateCount) {
    return {
      code: 'ABSTRACT_NO_CANDIDATES',
      dominantRejectReason: 'NO_CANDIDATES'
    };
  }

  const dominant = dominantRejectReason(ranked);
  const vlmDriven = ['VLM_REJECTED', 'VLM_NOT_VALIDATED']
    .includes(dominant);

  return {
    code:
      vlm?.enabled && vlmDriven
        ? 'ABSTRACT_VLM_GATE'
        : 'ABSTRACT_NO_ACCEPTED_CANDIDATE',
    dominantRejectReason: dominant
  };
}

export function deriveOverlayStrength(candidate = {}, scoring = {}) {
  const analysis = candidate.technicalAnalysis || {};
  const luminance = clampVisual(Number(analysis.averageLuminance ?? 0.5));
  const complexity = clampVisual(Number(analysis.complexity ?? 0.5));
  const safeScore = clampVisual(Number(analysis.bestSafeScore ?? 0.6));
  const composition = clampVisual(Number(scoring?.scores?.composition ?? candidate.compositionScore ?? 0.78));

  return Number(clampVisual(
    0.14 +
    luminance * 0.08 +
    complexity * 0.11 +
    (1 - safeScore) * 0.10 +
    (composition < 0.82 ? 0.04 : 0),
    0.16,
    0.44
  ).toFixed(3));
}

function buildPhotoVisual(candidate, scoring, intent, purpose) {
  const safeAreas = candidate.safeTextAreas?.length
    ? candidate.safeTextAreas
    : ['center'];
  const mobileSafeAreas = candidate.mobileSafeTextAreas?.length
    ? candidate.mobileSafeTextAreas
    : safeAreas;

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
    mobileSafeTextAreas: mobileSafeAreas,
    textPlacement: safeAreas[0] || 'center',
    mobileTextPlacement: mobileSafeAreas[0] || safeAreas[0] || 'center',
    overlayStrength: deriveOverlayStrength(candidate, scoring),
    visualIntent: intent.visualIntent.description,
    photographer: candidate.photographer || null,
    photographerLink: candidate.photographerLink || null,
    downloadLocation: candidate.downloadLocation || null,
    query: candidate.query || null,
    sceneSignature: scoring.noveltySignals?.sceneSignature || null,
    compositionSignature: scoring.noveltySignals?.compositionSignature || null,
    technicalAnalysis: candidate.technicalAnalysis || null,
    curationConfidence: Number(candidate.curationConfidence ?? 0),
    vlmValidation: candidate.vlmValidation || null
  };
}

function debugEnabled() {
  if (typeof location === 'undefined') return false;
  return new URLSearchParams(location.search).get('visualDebug') === '1';
}

export async function cachedVisualNeedsVlmRefresh(visual) {
  if (!visual || visual.mode !== 'photo') return false;
  if (visual.vlmValidation) return false;
  if (Number(visual.curationConfidence ?? 0) >= 1) return false;

  return (await isBackendProviderReady('vlm')) === true;
}

export async function resolveVisualForVerse(verse, options = {}) {
  const resolutionStarted = nowMs();
  const timings = {
    acquisitionMs: 0,
    pixelAnalysisMs: 0,
    vlmMs: 0,
    finalRankingMs: 0,
    totalMs: 0
  };
  const force = Boolean(options.force || options.forceRefresh);
  const purpose = String(options.purpose || 'background');
  const reference = verse?.reference || '';

  if (!force) {
    const cached = getCachedVisual(reference, purpose);
    const requiresVlmRefresh = cached?.visual
      ? await cachedVisualNeedsVlmRefresh(cached.visual)
      : false;

    if (cached?.visual && !requiresVlmRefresh) {
      rememberVisualUsage(reference, cached.visual, cached.intent, purpose);
      if (cached.visual.mode === 'photo') {
        await notifyProviderSelection(cached.visual);
      }

      timings.totalMs = elapsedMs(resolutionStarted);
      const diagnostics = {
        source: 'cache',
        purpose,
        engineVersion: VISUAL_ENGINE_VERSION,
        decision: {
          code: 'CACHE_HIT',
          dominantRejectReason: null
        },
        timings
      };

      recordVisualTelemetry(reference, diagnostics);

      return {
        intent: cached.intent,
        queries: buildVisualQueries(cached.intent),
        visual: cached.visual,
        diagnostics
      };
    }
  }

  const intent = analyzeVerse(verse);
  intent.visualPurpose = purpose;
  const queries = buildVisualQueries(intent);

  // O provedor seguro é opcional. Sem backend, o GitHub Pages permanece
  // funcional com acervo curado e fallback abstrato.
  const acquisitionStarted = nowMs();
  const [providerCandidates, curatedCandidates] = await Promise.all([
    fetchProviderCandidates(intent, queries, 24, purpose),
    Promise.resolve(getCuratedCandidates(intent, 12))
  ]);
  timings.acquisitionMs = elapsedMs(acquisitionStarted);

  let candidates = [...providerCandidates, ...curatedCandidates]
    .filter(candidate =>
      getFeedback(
        reference,
        candidate.id,
        intent.semantic.primaryTheme
      ) !== 'down'
    );

  const recentUsage = getRecentVisualUsage(12, purpose);

  // Primeiro ranking barato: só os melhores chegam à análise real de pixels.
  const preliminary = rankCandidates(candidates, intent, recentUsage);
  const hardReasons = new Set([
    'NO_IMAGE_URL',
    'EMBEDDED_TEXT',
    'WATERMARK',
    'ADVERTISING',
    'UNSAFE_CONTENT',
    'LOW_RESOLUTION',
    'RELIGIOUS_CLICHE',
    'GRAPHIC_OR_EXPLOITATIVE',
    'THEMATIC_CLICHE',
    'EMBEDDED_TEXT_METADATA',
    'BRANDING_OR_ADVERTISING_METADATA',
    'GENERIC_STOCK_CLICHE'
  ]);

  const shortlist = preliminary
    .filter(item => !item.rejectedReasons.some(reason => hardReasons.has(reason)))
    .slice(0, 5)
    .map(item => item.candidate);

  const pixelStarted = nowMs();
  const analyzed = await analyzeShortlist(shortlist, 5);
  timings.pixelAnalysisMs = elapsedMs(pixelStarted);
  if (analyzed.length) {
    const byId = new Map(analyzed.map(candidate => [candidate.id, candidate]));
    candidates = candidates.map(candidate => byId.get(candidate.id) || candidate);
  }

  const locallyRanked = rankCandidates(
    candidates,
    intent,
    recentUsage
  );
  const locallyAccepted = locallyRanked.filter(item => item.accepted);
  const localLeader = locallyAccepted[0] || null;

  let vlmDiagnostics = {
    enabled: false,
    reason: localLeader ? 'NOT_REQUIRED' : 'NO_LOCAL_FINALIST',
    model: null,
    evaluatedCount: 0,
    rejectedIds: [],
    decisions: []
  };

  // Custo controlado: VLM só entra quando o melhor finalista local é
  // externo/não-curado. Fotos curadas manualmente não geram chamada.
  if (
    localLeader &&
    Number(localLeader.candidate.curationConfidence ?? 0) < 1
  ) {
    const vlmCandidates = locallyAccepted
      .slice(0, 3)
      .map(item => item.candidate)
      .filter(candidate =>
        Number(candidate.curationConfidence ?? 0) < 1
      );

    const vlmStarted = nowMs();
    const validation = await validateVisualFinalists(
      intent,
      vlmCandidates,
      purpose
    );
    timings.vlmMs = elapsedMs(vlmStarted);

    vlmDiagnostics = {
      enabled: Boolean(validation.enabled),
      reason: validation.reason || null,
      model: validation.model || null,
      evaluatedCount: validation.decisions?.length || 0,
      rejectedIds: (validation.decisions || [])
        .filter(decision => !decision.accepted)
        .map(decision => decision.id),
      decisions: validation.decisions || []
    };

    if (validation.enabled && validation.decisions?.length) {
      const decisionsById = new Map(
        validation.decisions.map(decision => [
          decision.id,
          decision
        ])
      );

      candidates = candidates.map(candidate => {
        const decision = decisionsById.get(candidate.id);
        const isCurated =
          Number(candidate.curationConfidence ?? 0) >= 1;

        if (decision) {
          return {
            ...candidate,
            vlmValidation: decision,
            vlmRejected: !decision.accepted,
            vlmRejectionReason:
              decision.accepted
                ? null
                : 'VLM_REJECTED'
          };
        }

        if (!isCurated) {
          return {
            ...candidate,
            vlmRejected: true,
            vlmRejectionReason: 'VLM_NOT_VALIDATED'
          };
        }

        return candidate;
      });
    }
  }

  const finalRankingStarted = nowMs();
  const { selected, ranked } = selectBestCandidate(
    candidates,
    intent,
    recentUsage
  );
  timings.finalRankingMs = elapsedMs(finalRankingStarted);

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

  const decision = deriveVisualDecision({
    selected,
    ranked,
    candidateCount: candidates.length,
    vlm: vlmDiagnostics
  });
  timings.totalMs = elapsedMs(resolutionStarted);

  const diagnostics = {
    source: selected ? selected.candidate.provider || 'catalog' : 'abstract-fallback',
    purpose,
    engineVersion: VISUAL_ENGINE_VERSION,
    contextSource: intent.biblicalContext?.contextSource || 'genre-only',
    candidateCount: candidates.length,
    providerCandidateCount: providerCandidates.length,
    curatedCandidateCount: curatedCandidates.length,
    analyzedCandidateCount: analyzed.length,
    vlm: vlmDiagnostics,
    decision,
    timings,
    acceptedCandidateId: selected?.candidate?.id || null,
    ranked: ranked.slice(0, 5).map(item => ({
      id: item.candidate.id,
      accepted: item.accepted,
      scores: item.scores,
      noveltySignals: item.noveltySignals,
      vlmValidation: item.candidate.vlmValidation || null,
      rejectedReasons: item.rejectedReasons
    }))
  };

  recordVisualTelemetry(reference, diagnostics);

  if (debugEnabled()) {
    console.groupCollapsed(`[VersDay Visual] ${reference || '(sem referência)'} · ${purpose}`);
    console.log('Biblical context', intent.biblicalContext);
    console.log('Intent', intent);
    console.log('Queries', queries);
    console.table(diagnostics.ranked);
    console.log('Decision', diagnostics.decision);
    console.log('Timings', diagnostics.timings);
    console.log('Selected visual', visual);
    console.log('Session telemetry', summarizeVisualTelemetry());
    console.groupEnd();
  }

  return { intent, queries, visual, diagnostics };
}