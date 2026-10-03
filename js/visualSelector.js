// js/visualSelector.js
// Ranking multidimensional. Beleza nunca compensa incoerência semântica grave.

export const VISUAL_THRESHOLDS = Object.freeze({
  semantic: 0.72,
  final: 0.74,
  quality: 0.72,
  composition: 0.62
});

const GLOBAL_CLICHES = [
  'cross','crucifix','open bible','bible study','church interior','praying hands',
  'hands praying','dove','religious wallpaper','worship stock','confetti','party',
  'tropical resort','bikini','advertising banner','motivational quote'
];

const SYNONYMS = {
  pastagem:['pasture','meadow','grass','field','sheep','flock'],
  ovelhas:['sheep','flock','pasture'],
  mar:['sea','ocean','waves','water'],
  agua:['water','river','stream','lake','sea'],
  caminho:['path','road','trail','route','journey'],
  luz:['light','beam','shadow','window light'],
  semente:['seed','sowing','field','growth'],
  vinha:['vine','vineyard','branch','grape'],
  deserto:['desert','sand','arid'],
  montanha:['mountain','mountains','peak','ridge'],
  cidade:['city','urban','architecture'],
  ceu:['sky','cloud','stars','night sky']
};

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function words(value = '') {
  return normalize(value)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length >= 3);
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

function searchableText(candidate) {
  return normalize([
    candidate.description,
    candidate.alt,
    candidate.query,
    ...(candidate.tags || []),
    ...(candidate.themes || []),
    ...(candidate.moods || [])
  ].filter(Boolean).join(' '));
}

function intentSceneTokens(intent) {
  return words([
    ...(intent.visualIntent?.preferredScenes || []),
    intent.visualIntent?.description || ''
  ].join(' '));
}

function expandedLiteralTerms(intent) {
  const values = [];
  for (const literal of intent.representation?.literalElements || []) {
    const key = normalize(literal);
    values.push(key);
    values.push(...(SYNONYMS[key] || []));
  }
  return values;
}

function textTokenOverlap(text, terms) {
  const haystack = new Set(words(text));
  const needles = new Set(terms.flatMap(term => words(term)));
  if (!needles.size) return 0;
  let hits = 0;
  for (const token of needles) if (haystack.has(token)) hits++;
  return hits / needles.size;
}

function explicitConflict(candidate, intent) {
  const negatives = normalizedSet(candidate.negativeTags || []);
  const theme = normalize(intent.semantic.primaryTheme);
  const tones = normalizedSet(intent.semantic.emotionalTone || []);
  return negatives.has(theme) || [...tones].some(tone => negatives.has(tone));
}

function hasForbiddenVisual(candidate, intent) {
  const text = searchableText(candidate);
  if (!text) return false;

  const literal = normalizedSet(intent.representation?.literalElements || []);
  const allowReligiousObject =
    literal.has('cross') || literal.has('bible') || literal.has('church') || literal.has('prayer');

  return GLOBAL_CLICHES.some(term => {
    if (allowReligiousObject && ['cross','open bible','church interior','praying hands','hands praying'].includes(term)) return false;
    return text.includes(term);
  });
}

function hardFilterReasons(candidate, intent) {
  const reasons = [];
  if (!candidate || typeof candidate !== 'object') return ['INVALID_CANDIDATE'];
  if (!candidate.imageUrl) reasons.push('NO_IMAGE_URL');
  if (candidate.hasWatermark) reasons.push('WATERMARK');
  if (candidate.hasEmbeddedText) reasons.push('EMBEDDED_TEXT');
  if (candidate.isAdvertising) reasons.push('ADVERTISING');
  if (candidate.nsfw) reasons.push('UNSAFE_CONTENT');

  const width = Number(candidate.width || 0);
  const height = Number(candidate.height || 0);
  if (width > 0 && height > 0 && (width < 1280 || height < 720)) reasons.push('LOW_RESOLUTION');

  if (hasForbiddenVisual(candidate, intent)) reasons.push('RELIGIOUS_OR_STOCK_CLICHE');
  if (explicitConflict(candidate, intent)) reasons.push('EMOTIONAL_MISMATCH');

  return reasons;
}

function semanticScore(candidate, intent) {
  const tags = normalizedSet([...(candidate.tags || []), ...(candidate.themes || [])]);
  const theme = normalize(intent.semantic.primaryTheme);
  const searchTheme = normalize(candidate.searchIntentTheme || '');
  const themeMatch = tags.has(theme) || searchTheme === theme ? 1 : 0;

  const literalTerms = expandedLiteralTerms(intent);
  const literalMatch = literalTerms.length ? textTokenOverlap(searchableText(candidate), literalTerms) : 1;

  const symbolicMatch = overlapScore(
    candidate.tags || [],
    intent.representation?.symbolicElements || []
  );

  const sceneMatch = textTokenOverlap(searchableText(candidate), intentSceneTokens(intent));
  const modeMatch = (candidate.representationModes || []).includes(intent.representation?.mode) ? 1 : 0.55;
  const providerSearch = Number(candidate.providerSearchScore ?? (candidate.query ? 0.82 : 0.55));

  return Math.min(1,
    themeMatch * 0.45 +
    literalMatch * 0.18 +
    symbolicMatch * 0.08 +
    sceneMatch * 0.14 +
    modeMatch * 0.10 +
    providerSearch * 0.05
  );
}

function emotionalScore(candidate, intent) {
  const actualMoods = candidate.moods || [];
  if (actualMoods.length) {
    const score = overlapScore(actualMoods, intent.semantic.emotionalTone || []);
    if (score > 0) return score;
  }

  const queryMoods = candidate.queryMoods || [];
  if (queryMoods.length) {
    const inferred = overlapScore(queryMoods, intent.semantic.emotionalTone || []);
    if (inferred > 0) return Math.max(0.68, inferred * 0.82);
  }

  const text = searchableText(candidate);
  const toneTerms = (intent.semantic.emotionalTone || []).flatMap(tone => {
    const n = normalize(tone);
    if (n.includes('seren') || n.includes('quiet')) return ['calm','quiet','still','soft','peaceful'];
    if (n.includes('dram') || n.includes('tens')) return ['dramatic','storm','rough','dark'];
    if (n.includes('esper')) return ['light','opening','horizon','renewal','hope'];
    if (n.includes('acolh') || n.includes('intim')) return ['warm','gentle','intimate','human'];
    return [n];
  });
  const inferredFromText = textTokenOverlap(text, toneTerms);
  return inferredFromText ? Math.max(0.52, inferredFromText) : 0.58;
}

function computedQuality(candidate) {
  const explicit = Number(candidate.qualityScore);
  if (Number.isFinite(explicit)) return Math.max(0, Math.min(1, explicit));

  const width = Number(candidate.width || 0);
  const height = Number(candidate.height || 0);
  const pixels = width * height;
  if (pixels >= 8_000_000) return 0.96;
  if (pixels >= 4_000_000) return 0.92;
  if (pixels >= 2_000_000) return 0.86;
  if (pixels >= 921_600) return 0.74;
  return 0.6;
}

function responsiveScore(candidate, intent) {
  const width = Number(candidate.width || 0);
  const height = Number(candidate.height || 0);
  const ratio = width > 0 && height > 0 ? width / height : null;
  const purpose = String(intent.visualPurpose || 'background');

  if (purpose.startsWith('share-portrait')) {
    if (ratio == null) return candidate.mobileFocalPoint ? 0.75 : 0.62;
    if (ratio <= 0.9) return 0.98;
    if (ratio <= 1.2) return 0.84;
    if (ratio <= 1.5) return 0.68;
    return 0.42;
  }

  if (purpose === 'share-square') {
    if (ratio == null) return 0.72;
    return Math.max(0.5, 1 - Math.abs(1 - ratio) * 0.45);
  }

  if (purpose === 'share-og' || purpose === 'background') {
    if (ratio == null) return candidate.mobileFocalPoint ? 0.82 : 0.7;
    if (ratio >= 1.35) return 0.95;
    if (ratio >= 1.05) return 0.82;
    return 0.62;
  }

  return candidate.mobileFocalPoint ? 0.9 : 0.72;
}

function noveltyScore(candidate, recentUsage = []) {
  const ids = recentUsage.map(item => typeof item === 'string' ? item : item.visualId);
  if (ids.includes(candidate.id)) return 0.18;

  const photographer = normalize(candidate.photographer || '');
  if (photographer && recentUsage.slice(0, 12).some(item =>
    typeof item === 'object' && normalize(item.photographer || '') === photographer
  )) return 0.5;

  const signature = [...(candidate.tags || [])].slice(0, 4).map(normalize).sort().join('|');
  if (signature && recentUsage.slice(0, 10).some(item =>
    typeof item === 'object' && item.visualSignature === signature
  )) return 0.62;

  return 1;
}

export function scoreCandidate(candidate, intent, recentUsage = []) {
  const hardReasons = hardFilterReasons(candidate, intent);
  const semantic = semanticScore(candidate, intent);
  const emotional = emotionalScore(candidate, intent);
  const quality = computedQuality(candidate);
  const composition = Number(candidate.compositionScore ?? 0.68);
  const identity = Number(candidate.identityScore ?? 0.82);
  const responsive = responsiveScore(candidate, intent);
  const novelty = noveltyScore(candidate, recentUsage);

  const rejectedReasons = [...hardReasons];
  if (semantic < VISUAL_THRESHOLDS.semantic) rejectedReasons.push('SEMANTIC_MISMATCH');
  if (quality < VISUAL_THRESHOLDS.quality) rejectedReasons.push('LOW_QUALITY');

  // Só usa composição como gate duro quando ela já foi realmente analisada
  // ou quando o asset é curado e possui metadado confiável.
  if ((candidate.technicalAnalysis || candidate.curated) && composition < VISUAL_THRESHOLDS.composition) {
    rejectedReasons.push('POOR_COMPOSITION');
  }

  const finalScore =
    semantic * 0.45 +
    emotional * 0.15 +
    quality * 0.12 +
    composition * 0.12 +
    identity * 0.06 +
    responsive * 0.05 +
    novelty * 0.05;

  if (finalScore < VISUAL_THRESHOLDS.final) rejectedReasons.push('LOW_FINAL_SCORE');

  return {
    candidate,
    scores: {
      semantic:Number(semantic.toFixed(3)),
      emotional:Number(emotional.toFixed(3)),
      quality:Number(quality.toFixed(3)),
      composition:Number(composition.toFixed(3)),
      identity:Number(identity.toFixed(3)),
      responsive:Number(responsive.toFixed(3)),
      novelty:Number(novelty.toFixed(3)),
      final:Number(finalScore.toFixed(3))
    },
    rejectedReasons:[...new Set(rejectedReasons)],
    accepted:rejectedReasons.length === 0
  };
}

export function rankCandidates(candidates, intent, recentUsage = []) {
  return candidates
    .map(candidate => scoreCandidate(candidate, intent, recentUsage))
    .sort((a,b) => b.scores.final - a.scores.final);
}

export function selectBestCandidate(candidates, intent, recentUsage = []) {
  const ranked = rankCandidates(candidates, intent, recentUsage);
  return {
    selected:ranked.find(result => result.accepted) || null,
    ranked
  };
}
