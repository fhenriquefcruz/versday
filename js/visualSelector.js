    'graveyard'
  ],
  julgamento: [
    'hell fire',
    'demon',
    'devil',
    'gavel',
    'courtroom stock photo'
  ],
  reconciliacao: [
    'posed hug',
    'stock couple reunion'
  ]
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

function tokenize(value = '') {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 3);
}

function candidateText(candidate = {}) {
  return normalize([
    candidate.description,
    candidate.alt,
    ...(candidate.tags || [])
  ].filter(Boolean).join(' '));
}

function candidateMetadataText(candidate = {}) {
  return normalize([
    candidate.description,
    candidate.alt,
    ...(candidate.tags || [])
  ].filter(Boolean).join(' '));
}

function containsAny(text, terms = []) {
  return terms.some(term => text.includes(normalize(term)));
}

function containsSemanticTerm(text, term) {
  const haystack = normalize(text)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const needle = normalize(term)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!needle) return false;
  return (' ' + haystack + ' ').includes(' ' + needle + ' ');
}

const SCENE_STOPWORDS = new Set([
  'editorial','photography','cinematic','natural','light','restrained','color',
  'palette','clean','composition','contemplative','atmosphere','negative','space',
  'photo','image','background','avoid','soft','subtle'
]);

export function buildSceneSignature(candidate = {}) {
  const explicitFamily = normalize(
    candidate.sceneFamily || ''
  );

  if (explicitFamily) {
    return `family:${explicitFamily}`;
  }

  const source = [
    candidate.description,
    candidate.alt,
    ...(candidate.tags || [])
  ].filter(Boolean).join(' ');

  const tokens = tokenize(source)
    .filter(token => !SCENE_STOPWORDS.has(token));

  const unique = [...new Set(tokens)].slice(0, 8);
  if (unique.length) return unique.join(':');

  return normalize((candidate.themes || [])[0] || candidate.id || '');
}

function focalBucket(point = { x: 0.5, y: 0.5 }) {
  const x = Number(point?.x ?? 0.5);
  const y = Number(point?.y ?? 0.5);
  const horizontal = x < 0.34 ? 'left' : x > 0.66 ? 'right' : 'center';
  const vertical = y < 0.34 ? 'upper' : y > 0.66 ? 'lower' : 'middle';
  return `${vertical}-${horizontal}`;