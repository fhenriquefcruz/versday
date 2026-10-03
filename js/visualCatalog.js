// js/visualCatalog.js
// Acervo curado de segurança do VersDay.
// Cada fotografia possui intenção semântica explícita, metadados de composição
// e só participa do ranking quando tem relação real com a passagem.

function pexels(id, filename, meta = {}) {
  const visual = {
    id: `pexels-${id}`,
    provider: 'Pexels',
    providerUrl: 'https://www.pexels.com/',
    imageUrl: `https://images.pexels.com/photos/${id}/${filename}?auto=compress&cs=tinysrgb&w=2000`,
    previewUrl: `https://images.pexels.com/photos/${id}/${filename}?auto=compress&cs=tinysrgb&w=900`,
    width: 2000,
    height: 1333,
    qualityScore: 0.9,
    compositionScore: 0.86,
    identityScore: 0.9,
    curationConfidence: 1,
    hasEmbeddedText: false,
    hasWatermark: false,
    isAdvertising: false,
    nsfw: false,
    safeTextAreas: ['center'],
    focalPoint: { x: 0.5, y: 0.5 },
    negativeTags: [],
    representationModes: ['conceptual'],
    themes: [],
    tags: [],
    moods: [],
    ...meta
  };

  visual.tabletFocalPoint =
    meta.tabletFocalPoint ||
    visual.mobileFocalPoint ||
    visual.focalPoint;
  visual.mobileFocalPoint =
    visual.mobileFocalPoint ||
    visual.tabletFocalPoint ||
    visual.focalPoint;
  visual.tabletSafeTextAreas =
    meta.tabletSafeTextAreas ||
    visual.safeTextAreas;
  visual.mobileSafeTextAreas =
    meta.mobileSafeTextAreas ||
    visual.safeTextAreas;

  return visual;
}

export const CURATED_VISUALS = [
  pexels('457881', 'pexels-photo-457881.jpeg', {
    themes: ['paz', 'descanso'],
    tags: ['paz', 'descanso', 'water', 'lake', 'stillness', 'reflection', 'quietude'],
    moods: ['sereno', 'quieto', 'contemplativo'],
    representationModes: ['literal', 'conceptual'],
    safeTextAreas: ['center', 'upper-left'],
    focalPoint: { x: 0.5, y: 0.48 },
    mobileFocalPoint: { x: 0.5, y: 0.5 },
    compositionScore: 0.91,
    negativeTags: ['guerra', 'festa', 'multidão']
  }),
  pexels('115141', 'pexels-photo-115141.jpeg', {
    themes: ['pastoreio'],
    tags: ['pastoreio', 'sheep', 'ovelhas', 'pasture', 'pastagem', 'meadow', 'flock', 'cuidado'],
    moods: ['pastoral', 'sereno', 'protetor', 'quieto'],
    representationModes: ['literal', 'hybrid'],
    safeTextAreas: ['upper-right', 'center'],
    focalPoint: { x: 0.52, y: 0.56 },
    mobileFocalPoint: { x: 0.5, y: 0.54 },
    compositionScore: 0.9,
    negativeTags: ['cidade', 'festa', 'guerra']
  }),
  pexels('41953', 'road-curve-asphalt-country-road-41953.jpeg', {
    themes: ['caminho', 'confiança'],
    tags: ['caminho', 'estrada', 'road', 'path', 'journey', 'direção', 'decisão', 'progresso'],
    moods: ['direcional', 'progressivo', 'contemplativo', 'sereno'],
    representationModes: ['literal', 'hybrid', 'conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.5, y: 0.58 },
    mobileFocalPoint: { x: 0.5, y: 0.56 },
    compositionScore: 0.9,
    negativeTags: ['festa', 'multidão']
  }),
  pexels('1292115', 'pexels-photo-1292115.jpeg', {
    themes: ['luz', 'oração', 'fé'],
    tags: ['luz', 'light', 'shadow', 'window', 'interior', 'silêncio', 'recolhimento'],
    moods: ['contemplativo', 'silencioso', 'esperançoso', 'íntimo'],
    representationModes: ['hybrid', 'conceptual'],
    safeTextAreas: ['left', 'lower-left'],
    focalPoint: { x: 0.62, y: 0.46 },
    mobileFocalPoint: { x: 0.6, y: 0.48 },
    compositionScore: 0.9,
    negativeTags: ['festa', 'euforia', 'multidão']
  }),
  pexels('158163', 'clouds-cloudy-aggregation-nubes-158163.jpeg', {
    themes: ['céu', 'esperança'],
    tags: ['céu', 'sky', 'clouds', 'nuvens', 'vastness', 'amplitude', 'atmosfera'],
    moods: ['amplo', 'solene', 'contemplativo', 'esperançoso'],
    representationModes: ['literal', 'hybrid'],
    safeTextAreas: ['center', 'lower-left', 'lower-right'],
    focalPoint: { x: 0.5, y: 0.38 },
    mobileFocalPoint: { x: 0.5, y: 0.44 },
    compositionScore: 0.88,
    negativeTags: ['íntimo', 'reconciliação']
  }),
  pexels('1112048', 'pexels-photo-1112048.jpeg', {
    themes: ['água', 'paz'],
    tags: ['água', 'water', 'river', 'rio', 'nature', 'flow', 'fluxo'],
    moods: ['fluido', 'sereno', 'contemplativo'],
    representationModes: ['literal', 'hybrid'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.5, y: 0.55 },
    mobileFocalPoint: { x: 0.5, y: 0.52 },
    compositionScore: 0.87,
    negativeTags: ['resort', 'praia tropical', 'festa']
  }),
  pexels('844124', 'pexels-photo-844124.jpeg', {
    themes: ['criação', 'cura'],
    tags: ['criação', 'natureza', 'nature', 'forest', 'organic', 'green', 'renovação'],
    moods: ['orgânico', 'renovador', 'contemplativo', 'sereno'],
    representationModes: ['literal', 'conceptual'],
    safeTextAreas: ['center', 'upper-right'],
    focalPoint: { x: 0.5, y: 0.5 },
    mobileFocalPoint: { x: 0.5, y: 0.5 },
    compositionScore: 0.86,
    negativeTags: ['cidade', 'publicidade']
  }),
  pexels('1191710', 'forest-mist-morning-nature-1191710.jpeg', {
    themes: ['conforto', 'descanso', 'oração'],
    tags: ['conforto', 'descanso', 'forest', 'mist', 'quiet', 'silêncio', 'solitude'],
    moods: ['silencioso', 'acolhedor', 'contemplativo', 'quieto'],
    representationModes: ['conceptual', 'hybrid'],
    safeTextAreas: ['center', 'lower-left'],
    focalPoint: { x: 0.5, y: 0.48 },
    mobileFocalPoint: { x: 0.5, y: 0.48 },