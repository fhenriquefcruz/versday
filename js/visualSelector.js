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

export function scoreCandidate(candidate, intent, recentUsage = []) {
  const novelty = computeNovelty(candidate, recentUsage);
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
        novelty: Number(novelty.score.toFixed(3)),
        curation: Number(candidate?.curationConfidence ?? 0),
        final: 0
      },
      noveltySignals: novelty,
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
  const curationConfidence = primaryMatch
    ? Math.max(0, Math.min(1, Number(candidate.curationConfidence ?? 0)))
    : 0;

  // Curadoria só ajuda quando o tema primário foi explicitamente marcado.
  // Ela jamais resgata uma fotografia de tema diferente.
  const rawSemanticScore = Math.min(1,
    primaryMatch * 0.28 +
    literalMatch * 0.18 +
    symbolicMatch * 0.10 +
    emotionalMatch * 0.08 +
    modeMatch * 0.08 +
    sceneMatch * 0.16 +
    providerRelevance * 0.07 +
    searchAlignment * 0.05 +
    curationConfidence * 0.20
  );

  // Uma fotografia manualmente curada para o tema exato pode atingir
  // apenas o piso semântico, nunca ganhar "pontos grátis" acima dele.
  // Exigimos ainda modo compatível e pelo menos um sinal independente
  // (emoção, cena, literal ou símbolo) para evitar rotulagem arbitrária.
  const independentSemanticSupport = Math.max(
    literalMatch,
    symbolicMatch,
    emotionalMatch,
    sceneMatch
  );
  const CURATED_SEMANTIC_TOLERANCE = 0.03;
  const curatedFloorMinimum =
    VISUAL_THRESHOLDS.semantic -
    CURATED_SEMANTIC_TOLERANCE;

  const curationFloorApplied =
    primaryMatch === 1 &&
    modeMatch === 1 &&
    curationConfidence >= 1 &&
    independentSemanticSupport >= 0.25 &&
    rawSemanticScore >= curatedFloorMinimum &&
    rawSemanticScore < VISUAL_THRESHOLDS.semantic;

  const semanticScore = curationFloorApplied
    ? VISUAL_THRESHOLDS.semantic
    : rawSemanticScore;

  const qualityScore = Math.max(0, Math.min(1, Number(candidate.qualityScore ?? 0.8)));
  const compositionScore = Math.max(0, Math.min(1, Number(candidate.compositionScore ?? 0.76)));
  const identityScore = Math.max(0, Math.min(1, Number(candidate.identityScore ?? 0.78)));
  const noveltyScore = novelty.score;
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
      curation: Number(curationConfidence.toFixed(3)),
      final: Number(finalScore.toFixed(3))
    },
    noveltySignals: novelty,
    curationSignals: {
      floorApplied: curationFloorApplied,
      rawSemantic: Number(rawSemanticScore.toFixed(3)),
      independentSupport: Number(
        independentSemanticSupport.toFixed(3)
      ),
      floorMinimum: Number(
        curatedFloorMinimum.toFixed(3)
      )
    },
    rejectedReasons: [...new Set(rejectedReasons)],
    accepted: rejectedReasons.length === 0
  };
}

export function rankCandidates(candidates, intent, recentUsage = []) {
  return candidates
    .map(candidate => scoreCandidate(candidate, intent, recentUsage))
    .sort((a, b) => b.scores.final - a.scores.final);
}

export function selectBestCandidate(candidates, intent, recentUsage = []) {
  const ranked = rankCandidates(candidates, intent, recentUsage);
  const selected = ranked.find(result => result.accepted) || null;
  return { selected, ranked };
}