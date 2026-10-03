// js/visualCatalog.js
// Catálogo pequeno e deliberadamente conservador.
// Uma foto só entra aqui quando existe uso semântico claro.
// Quando não houver encaixe forte, o motor usa visual abstrato editorial.

export const CURATED_VISUALS = [
  {
    id: 'pexels-pastoral-115141',
    provider: 'Pexels',
    providerUrl: 'https://www.pexels.com/',
    imageUrl: 'https://images.pexels.com/photos/115141/pexels-photo-115141.jpeg?auto=compress&cs=tinysrgb&w=1920',
    tags: ['pastoreio', 'ovelhas', 'pastagem', 'campo', 'cuidado', 'quietude'],
    moods: ['sereno', 'pastoral', 'protetor', 'quieto'],
    representationModes: ['literal', 'hybrid'],
    safeTextAreas: ['center', 'upper-left'],
    focalPoint: { x: 0.5, y: 0.48 },
    mobileFocalPoint: { x: 0.5, y: 0.5 },
    qualityScore: 0.92,
    compositionScore: 0.86,
    identityScore: 0.9,
    negativeTags: ['cidade', 'festa', 'guerra']
  },
  {
    id: 'pexels-road-41953',
    provider: 'Pexels',
    providerUrl: 'https://www.pexels.com/',
    imageUrl: 'https://images.pexels.com/photos/41953/road-curve-asphalt-country-road-41953.jpeg?auto=compress&cs=tinysrgb&w=1920',
    tags: ['caminho', 'estrada', 'direção', 'jornada', 'decisão', 'progresso'],
    moods: ['contemplativo', 'direcional', 'progressivo', 'sereno'],
    representationModes: ['literal', 'hybrid', 'conceptual'],
    safeTextAreas: ['upper-left', 'upper-right', 'center'],
    focalPoint: { x: 0.52, y: 0.58 },
    mobileFocalPoint: { x: 0.5, y: 0.56 },
    qualityScore: 0.9,
    compositionScore: 0.88,
    identityScore: 0.88,
    negativeTags: ['festa', 'multidão', 'interior']
  },
  {
    id: 'pexels-mountain-dawn-147411',
    provider: 'Pexels',
    providerUrl: 'https://www.pexels.com/',
    imageUrl: 'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=1920',
    tags: ['montanha', 'amanhecer', 'horizonte', 'adversidade', 'amplitude', 'esperança'],
    moods: ['solene', 'esperançoso', 'contemplativo'],
    representationModes: ['literal', 'hybrid'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.5, y: 0.55 },
    mobileFocalPoint: { x: 0.52, y: 0.52 },
    qualityScore: 0.93,
    compositionScore: 0.84,
    identityScore: 0.91,
    negativeTags: ['intimidade', 'interior', 'reconciliação']
  },
  {
    id: 'pexels-forest-mist-1191710',
    provider: 'Pexels',
    providerUrl: 'https://www.pexels.com/',
    imageUrl: 'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1920',
    tags: ['névoa', 'floresta', 'silêncio', 'solitude', 'incerteza', 'quietude', 'caminho'],
    moods: ['silencioso', 'contemplativo', 'sóbrio', 'quieto'],
    representationModes: ['conceptual', 'hybrid', 'literal'],
    safeTextAreas: ['center', 'lower-left'],
    focalPoint: { x: 0.5, y: 0.46 },
    mobileFocalPoint: { x: 0.5, y: 0.48 },
    qualityScore: 0.92,
    compositionScore: 0.9,
    identityScore: 0.94,
    negativeTags: ['alegria', 'festa', 'multidão']
  },
  {
    id: 'pexels-clouds-158163',
    provider: 'Pexels',
    providerUrl: 'https://www.pexels.com/',
    imageUrl: 'https://images.pexels.com/photos/158163/clouds-cloudy-aggregation-nubes-158163.jpeg?auto=compress&cs=tinysrgb&w=1920',
    tags: ['céu', 'nuvens', 'tensão', 'amplitude', 'atmosfera', 'adversidade'],
    moods: ['solene', 'dramático', 'contemplativo'],
    representationModes: ['literal', 'hybrid'],
    safeTextAreas: ['center', 'lower-left', 'lower-right'],
    focalPoint: { x: 0.5, y: 0.42 },
    mobileFocalPoint: { x: 0.5, y: 0.46 },
    qualityScore: 0.88,
    compositionScore: 0.86,
    identityScore: 0.87,
    negativeTags: ['alegria', 'acolhedor', 'íntimo']
  }
];

export function getCuratedCandidates() {
  return CURATED_VISUALS.map(item => ({
    ...item,
    tags: [...item.tags],
    moods: [...item.moods],
    safeTextAreas: [...item.safeTextAreas],
    negativeTags: [...item.negativeTags]
  }));
}
