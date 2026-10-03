// js/visualSelector.js
// Ranking multidimensional do VersDay.
// Beleza nunca compensa incoerência semântica grave.

export const VISUAL_THRESHOLDS = Object.freeze({
  semantic: 0.72,
  final: 0.74,
  quality: 0.72,
  composition: 0.70
});

const RELIGIOUS_CLICHES = [
  'cross', 'cruz', 'open bible', 'bible open', 'biblia aberta', 'bíblia aberta',
  'church', 'igreja', 'praying hands', 'hands praying', 'maos em oracao', 'mãos em oração'
];

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizedSet(values = []) {
  return new Set(values.map(normalize).filter(Boolean));
}

function tokenize(value = '') {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 3);
}

function overlapScore(aValues, bValues) {
  const a = normalizedSet(aValues);
  const b = normalizedSet(bValues);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const value of a) if (b.has(value)) hits++;
  return hits / Math.max(1, Math.min(a.size, b.size));
}

function lexicalScore(candidate, intent) {
  const intentTokens = tokenize([
    intent.visualIntent?.description,
    ...(intent.visualIntent?.preferredScenes || []),
    ...(intent.representation?.literalElements || []),
    ...(intent.representation?.symbolicElements || [])
  ].join(' '));

  const candidateTokens = tokenize([
    candidate.description,
    candidate.alt,
    candidate.query,
    ...(candidate.tags || [])
  ].join(' '));

  if (!intentTokens.length || !candidateTokens.length) return 0;
  const right = new Set(candidateTokens);
  const hits = [...new Set(intentTokens)].filter(token => right.has(token)).length;
  return Math.min(1, hits / Math.max(3, Math.min(10, new Set(candidateTokens).size)));
}

function hasConflict(candidate, intent) {
  const negatives = normalizedSet(candidate.negativeTags || []);
  const theme = normalize(intent.semantic.primaryTheme);
  const tones = normalizedSet(intent.semantic.emotionalTone || []);
  if (negatives.has(theme) || [...tones].some(tone => negatives.has(tone))) return true;

  const candidateText = normalize([
    candidate.description,
    candidate.alt,
    ...(candidate.tags || [])
  ].join(' '));

  return (intent.visualIntent?.negativeConcepts || [])
    .map(normalize)
    .some(concept => concept.length >= 4 && candidateText.includes(concept));
}

function religiousClicheConflict(candidate, intent) {
  const candidateText = normalize([
    candidate.description,
    candidate.alt,
    ...(candidate.tags || [])
  ].join(' '));

  const literal = normalize((intent.representation?.literalElements || []).join(' '));
  for (const cliche of RELIGIOUS_CLICHES) {
    const needle = normalize(cliche);
    if (!candidateText.includes(needle)) continue;
    if (literal.includes(needle)) continue;
    return true;
  }
  return false;
}

export function hardFilterCandidate(candidate, intent) {
  const reasons = [];

  if (!candidate?.imageUrl) reasons.push('NO_IMAGE_URL');
  if (candidate?.hasEmbeddedText) reasons.push('EMBEDDED_TEXT');
  if (candidate?.hasWatermark) reasons.push('WATERMARK');
  if (candidate?.isAdvertising) reasons.push('ADVERTISING');
  if (candidate?.nsfw) reasons.push('UNSAFE_CONTENT');

  if ((candidate?.width || 0) > 0 && candidate.width < 1000) reasons.push('LOW_RESOLUTION');
  if ((candidate?.height || 0) > 0 && candidate.height < 700) reasons.push('LOW_RESOLUTION');

  if (hasConflict(candidate, intent)) reasons.push('EMOTIONAL_MISMATCH');
  if (religiousClicheConflict(candidate, intent)) reasons.push('RELIGIOUS_CLICHE');

  return {
    accepted: reasons.length === 0,
    reasons: [...new Set(reasons)]
  };
}

function responsiveScore(candidate, intent) {
  const purpose = intent.visualPurpose || 'background';
  const width = Number(candidate.width || 0);
  const height = Number(candidate.height || 0);
  const ratio = width > 0 && height > 0 ? width / height : null;
  const hasMobileFocal = Boolean(candidate.mobileFocalPoint);
  const hasFocal = Boolean(candidate.focalPoint);

  let score = hasFocal ? 0.82 : 0.68;

  if (/portrait|mobile/.test(purpose)) {
    if (ratio !== null && ratio <= 1) score += 0.12;
    else if (ratio !== null && ratio > 1.45) score -= 0.12;
    if (hasMobileFocal) score += 0.10;
  } else {
    if (ratio !== null && ratio >= 1.25) score += 0.10;
    if (hasMobileFocal) score += 0.04;
  }

  return Math.max(0, Math.min(1, score));
}

export function scoreCandidate(candidate, intent, recentIds = []) {
  const hard = hardFilterCandidate(candidate, intent);
  if (!hard.accepted) {
    return {
      candidate,
      scores: {
        semantic: 0,
        emotional: 0,
        quality: Number(candidate?.qualityScore ?? 0),
        composition: Number(candidate?.compositionScore ?? 0),
        identity: Number(candidate?.identityScore ?? 0),
        responsive: responsiveScore(candidate || {}, intent),
        novelty: recentIds.includes(candidate?.id) ? 0.25 : 1,
        final: 0
      },
      rejectedReasons: hard.reasons,
      accepted: false
    };
  }

  const tags = candidate.tags || [];
  const themes = candidate.themes || [];
  const modes = candidate.representationModes || [];

  const primary = normalize(intent.semantic.primaryTheme);
  const primaryMatch =
    normalizedSet(themes).has(primary) || normalizedSet(tags).has(primary) ? 1 : 0;

  const literalMatch = overlapScore(tags, intent.representation.literalElements);
  const symbolicMatch = overlapScore(tags, intent.representation.symbolicElements);
  const emotionalMatch = overlapScore(candidate.moods || [], intent.semantic.emotionalTone);
  const modeMatch = modes.includes(intent.representation.mode) ? 1 : 0;
  const sceneMatch = lexicalScore(candidate, intent);
  const providerRelevance = Math.max(0, Math.min(1, Number(candidate.providerSearchScore ?? 0)));
  const searchAlignment =
    normalize(candidate.searchIntentTheme || '') === primary ? 1 : 0;

  // Coerência semântica permanece independente de beleza/qualidade técnica.
  const semanticScore = Math.min(1,
    primaryMatch * 0.25 +
    literalMatch * 0.18 +
    symbolicMatch * 0.10 +
    emotionalMatch * 0.08 +
    modeMatch * 0.08 +
    sceneMatch * 0.16 +
    providerRelevance * 0.10 +
    searchAlignment * 0.05
  );

  const qualityScore = Math.max(0, Math.min(1, Number(candidate.qualityScore ?? 0.8)));
  const compositionScore = Math.max(0, Math.min(1, Number(candidate.compositionScore ?? 0.76)));
  const identityScore = Math.max(0, Math.min(1, Number(candidate.identityScore ?? 0.78)));
  const noveltyScore = recentIds.includes(candidate.id) ? 0.25 : 1;
  const responsive = responsiveScore(candidate, intent);

  const rejectedReasons = [];
  if (semanticScore < VISUAL_THRESHOLDS.semantic) rejectedReasons.push('SEMANTIC_MISMATCH');
  if (qualityScore < VISUAL_THRESHOLDS.quality) rejectedReasons.push('LOW_QUALITY');
  if (compositionScore < VISUAL_THRESHOLDS.composition) rejectedReasons.push('POOR_COMPOSITION');

  const finalScore =
    semanticScore * 0.45 +
    emotionalMatch * 0.15 +
    qualityScore * 0.12 +
    compositionScore * 0.12 +
    identityScore * 0.06 +
    responsive * 0.05 +
    noveltyScore * 0.05;

  if (finalScore < VISUAL_THRESHOLDS.final) rejectedReasons.push('LOW_FINAL_SCORE');

  return {
    candidate,
    scores: {
      semantic: Number(semanticScore.toFixed(3)),
      emotional: Number(emotionalMatch.toFixed(3)),
      quality: Number(qualityScore.toFixed(3)),
      composition: Number(compositionScore.toFixed(3)),
      identity: Number(identityScore.toFixed(3)),
      responsive: Number(responsive.toFixed(3)),
      novelty: Number(noveltyScore.toFixed(3)),
      final: Number(finalScore.toFixed(3))
    },
    rejectedReasons: [...new Set(rejectedReasons)],
    accepted: rejectedReasons.length === 0
  };
}

export function rankCandidates(candidates, intent, recentIds = []) {
  return candidates
    .map(candidate => scoreCandidate(candidate, intent, recentIds))
    .sort((a, b) => b.scores.final - a.scores.final);
}

export function selectBestCandidate(candidates, intent, recentIds = []) {
  const ranked = rankCandidates(candidates, intent, recentIds);
  const selected = ranked.find(result => result.accepted) || null;
  return { selected, ranked };
}
