import { noveltyScore, isImageRejected } from './visual-memory.js';

export const SCORE_WEIGHTS = Object.freeze({
  semantic: 0.45,
  emotion: 0.15,
  quality: 0.12,
  composition: 0.12,
  identity: 0.06,
  responsive: 0.05,
  novelty: 0.05
});

export const THRESHOLDS = Object.freeze({
  semantic: 0.70,
  final: 0.74,
  abstractSemantic: 0.84,
  abstractFinal: 0.82
});

function normalize(value='') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function tokens(value='') {
  return normalize(value).split(/[^a-z0-9]+/).filter(x=>x.length>2);
}
function overlapRatio(a=[], b=[]) {
  if (!a.length || !b.length) return 0;
  const B = new Set(b.map(normalize));
  const hits = a.map(normalize).filter(x=>B.has(x)).length;
  return hits / Math.max(1, Math.min(a.length, b.length));
}
function clamp(n,min=0,max=1){ return Math.max(min,Math.min(max,n)); }

function contradictionReasons(candidate, intent) {
  const haystack = normalize([candidate?.description,candidate?.alt,...(candidate?.tags || [])].join(' '));
  const concepts = (intent?.visualIntent?.negativeConcepts || []).map(normalize);
  const signals = [
    ['party','PARTY'],['celebration','CELEBRATION'],['confetti','CONFETTI'],
    ['cross','RELIGIOUS_CLICHE'],['open bible','RELIGIOUS_CLICHE'],['church','RELIGIOUS_CLICHE'],
    ['hands praying','RELIGIOUS_CLICHE'],['wedding','STAGED_ROMANCE'],['advertising','ADVERTISING'],
    ['tropical beach','EMOTIONAL_MISMATCH']
  ];
  return [...new Set(signals
    .filter(([needle]) => haystack.includes(needle) && concepts.some(c => c.includes(needle)))
    .map(([,reason]) => reason))];
}

export function hardFilterCandidate(candidate, intent) {
  const reasons = [];
  if (!candidate?.imageUrl) reasons.push('NO_IMAGE_URL');
  if (candidate?.hasEmbeddedText) reasons.push('EMBEDDED_TEXT');
  if (candidate?.hasWatermark) reasons.push('WATERMARK');
  if (candidate?.isAdvertising) reasons.push('ADVERTISING');
  if (candidate?.nsfw) reasons.push('UNSAFE_CONTENT');
  if ((candidate?.width || 0) && candidate.width < 1000) reasons.push('LOW_RESOLUTION');
  if ((candidate?.height || 0) && candidate.height < 700) reasons.push('LOW_RESOLUTION');
  if (isImageRejected(intent?.verseReference, candidate?.id)) reasons.push('USER_REJECTED');
  reasons.push(...contradictionReasons(candidate,intent));
  return { accepted: reasons.length === 0, reasons };
}

function semanticScore(candidate, intent) {
  const theme = intent?.semantic?.primaryTheme;
  const exactTheme = candidate?.themes?.includes(theme) ? 1 : 0;
  const searchAligned = candidate?.searchIntentTheme === theme ? 1 : 0;
  const providerRelevance = clamp(candidate?.providerSearchScore ?? (candidate?.curated ? 0.92 : 0.55));
  const literal = intent?.representation?.literalElements || [];
  const literalOverlap = overlapRatio(literal, candidate?.tags || []);
  const moodOverlap = overlapRatio(intent?.photography?.mood || [], candidate?.moods || []);

  const intentWords = tokens([
    intent?.semantic?.primaryThemeLabel,
    ...(intent?.visualIntent?.preferredScenes || []),
    ...literal
  ].join(' '));
  const candidateWords = tokens([
    candidate?.description,
    candidate?.alt,
    ...(candidate?.tags || [])
  ].join(' '));
  const lexical = overlapRatio(intentWords, candidateWords);

  let score = exactTheme * 0.36 + searchAligned * 0.20 + providerRelevance * 0.15 + literalOverlap * 0.14 + lexical * 0.10 + moodOverlap * 0.05;
  if (candidate?.curated && exactTheme) score += 0.16;
  if (literal.length && literalOverlap === 0 && intent?.representation?.mode === 'literal') score -= 0.18;
  score = clamp(score);
  if (typeof candidate?.vlm?.semanticMatch === 'number') score = clamp(score * 0.62 + candidate.vlm.semanticMatch * 0.38);
  return score;
}

function emotionalScore(candidate, intent) {
  const moods = intent?.photography?.mood || [];
  const cm = candidate?.moods || [];
  const overlap = overlapRatio(moods, cm);
  let score = overlap > 0 ? clamp(0.64 + overlap * 0.36) : (candidate?.curated && candidate?.themes?.includes(intent?.semantic?.primaryTheme) ? 0.66 : 0.52);
  if (typeof candidate?.vlm?.emotionalMatch === 'number') score = clamp(score * 0.62 + candidate.vlm.emotionalMatch * 0.38);
  return score;
}

function qualityScore(candidate) {
  if (typeof candidate?.qualityScore === 'number') return clamp(candidate.qualityScore);
  const pixels = (candidate?.width || 0) * (candidate?.height || 0);
  if (pixels >= 8_000_000) return 0.95;
  if (pixels >= 3_000_000) return 0.88;
  if (pixels >= 1_500_000) return 0.78;
  return 0.62;
}

function compositionScore(candidate) {
  if (typeof candidate?.compositionScore === 'number') return clamp(candidate.compositionScore);
  const safe = candidate?.safeAreas?.length || 0;
  return clamp(0.58 + Math.min(0.3, safe * 0.08));
}

function responsiveScore(candidate, intent) {
  const w = candidate?.width || 1600;
  const h = candidate?.height || 1000;
  const ratio = w / Math.max(h,1);
  const hasFocal = !!candidate?.focalPoint;
  const purpose = intent?.visualPurpose || 'background';
  let score = Math.max(w,h) >= 1600 ? 0.78 : 0.68;
  if (purpose === 'share-portrait' || purpose === 'background-mobile') {
    if (ratio >= 0.55 && ratio <= 0.95) score += 0.18;
    else if (ratio > 1.35) score -= 0.18;
  } else if (purpose === 'share-landscape' || purpose === 'background-desktop') {
    if (ratio >= 1.45 && ratio <= 2.2) score += 0.16;
  } else if (ratio > 1.15 && ratio < 2.2) score += 0.09;
  if (hasFocal) score += 0.08;
  return clamp(score);
}

function identityScore(candidate) {
  const text = normalize(`${candidate?.description || ''} ${candidate?.alt || ''}`);
  if (/advertis|studio pose|neon|hdr|wallpaper|ai generated/.test(text)) return 0.35;
  return candidate?.curated ? 0.92 : 0.76;
}

export function scoreCandidate(candidate, intent) {
  const hard = hardFilterCandidate(candidate, intent);
  if (!hard.accepted) return { candidate, rejected:true, rejectionReasons:hard.reasons, score:0, dimensions:{} };

  const dimensions = {
    semantic: semanticScore(candidate,intent),
    emotion: emotionalScore(candidate,intent),
    quality: qualityScore(candidate),
    composition: compositionScore(candidate),
    identity: identityScore(candidate),
    responsive: responsiveScore(candidate,intent),
    novelty: noveltyScore(candidate)
  };

  const score = Object.entries(SCORE_WEIGHTS)
    .reduce((sum,[key,weight]) => sum + dimensions[key] * weight, 0);

  const rejectionReasons = [];
  if (dimensions.semantic < THRESHOLDS.semantic) rejectionReasons.push('SEMANTIC_MISMATCH');
  if (dimensions.emotion < 0.5) rejectionReasons.push('EMOTIONAL_MISMATCH');
  if (dimensions.quality < 0.62) rejectionReasons.push('LOW_QUALITY');

  return {
    candidate,
    rejected: rejectionReasons.length > 0,
    rejectionReasons,
    dimensions,
    score: clamp(score)
  };
}

export function rankCandidates(candidates, intent) {
  return candidates
    .map(c=>scoreCandidate(c,intent))
    .sort((a,b)=>b.score-a.score);
}

export function passesSelectionThreshold(scored, intent) {
  if (!scored || scored.rejected) return false;
  const abstractFirst = intent?.representation?.mode === 'abstract';
  return scored.dimensions.semantic >= (abstractFirst ? THRESHOLDS.abstractSemantic : THRESHOLDS.semantic)
    && scored.score >= (abstractFirst ? THRESHOLDS.abstractFinal : THRESHOLDS.final);
}
