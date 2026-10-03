// js/visualSelector.js
// Ranking multidimensional. Beleza nunca compensa incoerência semântica grave.

export const VISUAL_THRESHOLDS = Object.freeze({
  semantic: 0.72,
  final: 0.74,
  quality: 0.78,
  composition: 0.72
});

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

function overlapScore(aValues, bValues) {
  const a = normalizedSet(aValues);
  const b = normalizedSet(bValues);
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const value of a) if (b.has(value)) hits++;
  return hits / Math.max(1, Math.min(a.size, b.size));
}

function hasConflict(candidate, intent) {
  const negatives = normalizedSet(candidate.negativeTags || []);
  const theme = normalize(intent.semantic.primaryTheme);
  const tones = normalizedSet(intent.semantic.emotionalTone || []);
  return negatives.has(theme) || [...tones].some(tone => negatives.has(tone));
}

export function scoreCandidate(candidate, intent, recentIds = []) {
  const tags = candidate.tags || [];
  const modes = candidate.representationModes || [];

  const primaryMatch = normalizedSet(tags).has(normalize(intent.semantic.primaryTheme)) ? 1 : 0;
  const literalMatch = overlapScore(tags, intent.representation.literalElements);
  const symbolicMatch = overlapScore(tags, intent.representation.symbolicElements);
  const emotionalMatch = overlapScore(candidate.moods || [], intent.semantic.emotionalTone);
  const modeMatch = modes.includes(intent.representation.mode) ? 1 : 0;

  // O score semântico é independente da qualidade estética.
  const semanticScore = Math.min(1,
    primaryMatch * 0.45 +
    literalMatch * 0.25 +
    symbolicMatch * 0.15 +
    emotionalMatch * 0.10 +
    modeMatch * 0.15
  );

  const qualityScore = Number(candidate.qualityScore ?? 0.8);
  const compositionScore = Number(candidate.compositionScore ?? 0.76);
  const identityScore = Number(candidate.identityScore ?? 0.78);
  const noveltyScore = recentIds.includes(candidate.id) ? 0.25 : 1;
  const responsiveScore = candidate.mobileFocalPoint ? 0.95 : 0.72;

  const rejectedReasons = [];
  if (hasConflict(candidate, intent)) rejectedReasons.push('EMOTIONAL_MISMATCH');
  if (semanticScore < VISUAL_THRESHOLDS.semantic) rejectedReasons.push('SEMANTIC_MISMATCH');
  if (qualityScore < VISUAL_THRESHOLDS.quality) rejectedReasons.push('LOW_QUALITY');
  if (compositionScore < VISUAL_THRESHOLDS.composition) rejectedReasons.push('POOR_COMPOSITION');

  const finalScore =
    semanticScore * 0.45 +
    emotionalMatch * 0.15 +
    qualityScore * 0.12 +
    compositionScore * 0.12 +
    identityScore * 0.06 +
    responsiveScore * 0.05 +
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
      responsive: Number(responsiveScore.toFixed(3)),
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
