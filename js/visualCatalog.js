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
    compositionScore: 0.88,
    negativeTags: ['alegria eufórica', 'festa', 'multidão']
  }),
  pexels('618848', 'pexels-photo-618848.jpeg', {
    themes: ['força', 'coragem'],
    tags: ['força', 'coragem', 'rock', 'waves', 'weather', 'resistência', 'adversidade'],
    moods: ['firme', 'resiliente', 'sóbrio'],
    representationModes: ['conceptual', 'hybrid'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.55, y: 0.58 },
    mobileFocalPoint: { x: 0.54, y: 0.56 },
    compositionScore: 0.84,
    negativeTags: ['festa', 'comemoração', 'triunfalismo']
  }),
  pexels('1493215', 'pexels-photo-1493215.jpeg', {
    themes: ['esperança', 'cura'],
    tags: ['esperança', 'cura', 'growth', 'nature', 'light', 'renewal', 'renovação'],
    moods: ['esperançoso', 'renovador', 'sereno'],
    representationModes: ['conceptual', 'hybrid'],
    safeTextAreas: ['upper-left', 'right'],
    focalPoint: { x: 0.52, y: 0.55 },
    mobileFocalPoint: { x: 0.5, y: 0.52 },
    compositionScore: 0.84,
    negativeTags: ['euforia', 'motivational wallpaper']
  }),
  pexels('344886', 'pexels-photo-344886.jpeg', {
    themes: ['cura', 'esperança'],
    tags: ['cura', 'organic', 'nature', 'renewal', 'soft light', 'restauração'],
    moods: ['delicado', 'renovador', 'silencioso', 'sereno'],
    representationModes: ['conceptual'],
    safeTextAreas: ['left', 'upper-left'],
    focalPoint: { x: 0.58, y: 0.52 },
    mobileFocalPoint: { x: 0.56, y: 0.5 },
    compositionScore: 0.83,
    negativeTags: ['hospital genérico', 'antes e depois', 'euforia']
  }),
  pexels('417074', 'pexels-photo-417074.jpeg', {
    themes: ['coragem', 'confiança'],
    tags: ['coragem', 'confiança', 'landscape', 'vastness', 'weather', 'journey', 'adversidade'],
    moods: ['firme', 'resiliente', 'contemplativo', 'encorajador'],
    representationModes: ['conceptual', 'hybrid'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.5, y: 0.5 },
    mobileFocalPoint: { x: 0.5, y: 0.5 },
    compositionScore: 0.82,
    negativeTags: ['festa', 'comemoração', 'praia tropical']
  }),
  pexels('9511828', 'pexels-photo-9511828.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/a-person-carrying-a-basket-of-fruits-9511828/',
    description: 'Hands holding a woven basket filled with fresh fruit in natural light.',
    alt: 'Mãos segurando uma cesta de frutas frescas sob luz natural.',
    width: 6720,
    height: 4480,
    themes: ['gratidão'],
    tags: ['gratidão', 'abundância discreta', 'presença', 'acolhimento', 'harvest', 'fruit', 'basket', 'hands', 'natural light', 'receiving', 'fresh fruit', 'provision'],
    moods: ['caloroso', 'humilde', 'contemplativo'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.52, y: 0.58 },
    mobileFocalPoint: { x: 0.5, y: 0.56 },
    compositionScore: 0.88,
    identityScore: 0.92,
    negativeTags: ['luxo', 'ostentação', 'festa', 'publicidade']
  }),
  pexels('5055239', 'pexels-photo-5055239.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/man-and-woman-talking-5055239/',
    description: 'Two adults conversing at a table indoors with natural window light.',
    alt: 'Duas pessoas conversando à mesa com luz natural.',
    width: 6000,
    height: 4000,
    themes: ['relacionamento', 'reconciliação'],
    tags: ['relacionamento', 'presença', 'escuta', 'vínculo', 'conversa', 'two people', 'talking', 'natural light', 'authentic interaction', 'quiet presence'],
    moods: ['humano', 'caloroso', 'autêntico', 'íntimo', 'humilde', 'restaurador'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.54, y: 0.52 },
    mobileFocalPoint: { x: 0.52, y: 0.52 },
    compositionScore: 0.86,
    negativeTags: ['pose olhando para câmera', 'sensualidade', 'festa', 'abraço publicitário']
  }),
  pexels('4262003', 'pexels-photo-4262003.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/family-setting-the-table-for-dinner-4262003/',
    description: 'A joyful family prepares a shared meal in a bright kitchen.',
    alt: 'Família preparando uma refeição em conjunto em uma cozinha iluminada.',
    width: 5260,
    height: 3510,
    themes: ['alegria', 'gratidão', 'relacionamento'],
    tags: ['alegria', 'gratidão', 'relacionamento', 'presença', 'acolhimento', 'luz', 'family', 'togetherness', 'shared meal', 'natural light', 'authentic joy', 'candid human joy', 'warm interior'],
    moods: ['luminoso', 'vivo', 'leve', 'caloroso', 'humano', 'autêntico', 'contemplativo', 'humilde'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.52, y: 0.56 },
    mobileFocalPoint: { x: 0.5, y: 0.54 },
    compositionScore: 0.87,
    negativeTags: ['festa artificial', 'publicidade', 'ostentação']
  }),
  pexels('6670100', 'pexels-photo-6670100.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/woman-giving-coffee-to-a-lonely-woman-6670100/',
    description: 'Two women share a comforting moment, one offering a warm cup indoors.',
    alt: 'Uma mulher oferece uma bebida quente a outra em um momento de acolhimento.',
    themes: ['conforto', 'sofrimento', 'relacionamento'],
    tags: ['conforto', 'sofrimento', 'relacionamento', 'acolhimento', 'presença', 'proximidade', 'fragilidade', 'cuidado', 'support', 'compassion', 'grief support', 'natural light', 'quiet human presence', 'authentic'],
    moods: ['acolhedor', 'sereno', 'compassivo', 'doloroso', 'sóbrio', 'resiliente', 'humano', 'caloroso', 'autêntico'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.56, y: 0.52 },
    mobileFocalPoint: { x: 0.54, y: 0.52 },
    compositionScore: 0.87,
    negativeTags: ['euforia', 'festa', 'publicidade', 'dor encenada']
  }),
  pexels('5028920', 'pexels-photo-5028920.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/anonymous-man-behind-window-in-raindrops-5028920/',
    description: 'A solitary silhouette seen through a rain-soaked window in a quiet contemplative scene.',
    alt: 'Silhueta solitária vista através de uma janela coberta por gotas de chuva.',
    width: 3960,
    height: 2640,
    themes: ['lamento', 'sofrimento'],
    tags: ['lamento', 'sofrimento', 'ausência', 'saudade', 'súplica', 'fragilidade', 'rain', 'window', 'silhouette', 'solitude', 'quiet', 'contemplation', 'negative space'],
    moods: ['enlutado', 'silencioso', 'vulnerável', 'doloroso', 'sóbrio', 'resiliente'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'lower-left'],
    focalPoint: { x: 0.58, y: 0.5 },
    mobileFocalPoint: { x: 0.56, y: 0.5 },
    compositionScore: 0.86,
    negativeTags: ['sorriso', 'celebração', 'melodrama']
  }),
  pexels('6994855', 'pexels-photo-6994855.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/woman-with-dreadlocks-and-man-in-yellow-t-shirt-sorting-clothes-standing-next-to-each-other-6994855/',
    description: 'Two volunteers organize clothing and food donations indoors during daylight.',
    alt: 'Duas pessoas organizando doações de roupas e alimentos durante o dia.',
    themes: ['justiça', 'relacionamento'],
    tags: ['justiça', 'relacionamento', 'equidade', 'responsabilidade', 'dignidade', 'presença', 'cuidado', 'comunidade', 'aid', 'community support', 'humanitarian', 'service', 'sharing', 'social impact', 'natural light', 'support', 'authentic human dignity'],
    moods: ['firme', 'sóbrio', 'responsável', 'humano', 'autêntico'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    focalPoint: { x: 0.5, y: 0.52 },
    mobileFocalPoint: { x: 0.5, y: 0.52 },
    compositionScore: 0.85,
    negativeTags: ['publicidade', 'triunfalismo', 'pose olhando para câmera']
  }),
  pexels('37825335', 'pexels-photo-37825335.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/close-up-of-writing-hands-in-classroom-setting-37825335/',
    description: 'Close-up of a person writing in a notebook under natural light, focused on attentive reflection rather than academic status.',
    alt: 'Mãos escrevendo em um caderno sob luz natural.',
    width: 4272,
    height: 2848,
    themes: ['sabedoria'],
    tags: [
      'sabedoria', 'discernimento', 'atenção', 'escolha',
      'writing', 'notebook', 'reflection', 'focus',
      'natural light', 'thoughtful', 'observation'
    ],
    moods: ['reflexivo', 'sóbrio', 'claro', 'contemplativo'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-right', 'right'],
    tabletSafeTextAreas: ['upper-right', 'lower-right'],
    mobileSafeTextAreas: ['upper', 'lower'],
    focalPoint: { x: 0.42, y: 0.58 },
    tabletFocalPoint: { x: 0.44, y: 0.56 },
    mobileFocalPoint: { x: 0.45, y: 0.55 },
    compositionScore: 0.87,
    identityScore: 0.91,
    negativeTags: [
      'biblioteca luxuosa', 'status acadêmico',
      'publicidade', 'pose olhando para câmera'
    ]
  }),
  pexels('29372724', 'pexels-photo-29372724.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/elderly-care-at-home-compassionate-support-29372724/',
    description: 'A caregiver holds a senior adult hands at home, expressing quiet support, care and human presence.',
    alt: 'Pessoa oferecendo cuidado e apoio pelas mãos a um adulto idoso.',
    width: 5880,
    height: 3920,
    themes: ['amor'],
    tags: [
      'amor', 'presença', 'cuidado', 'aliança',
      'care', 'compassion', 'support', 'reassurance',
      'human connection', 'hands', 'dignity', 'presence'
    ],
    moods: ['íntimo', 'caloroso', 'humano', 'compassivo'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    tabletSafeTextAreas: ['upper-left', 'upper-right'],
    mobileSafeTextAreas: ['upper', 'lower'],
    focalPoint: { x: 0.52, y: 0.58 },
    tabletFocalPoint: { x: 0.52, y: 0.55 },
    mobileFocalPoint: { x: 0.52, y: 0.54 },
    compositionScore: 0.88,
    identityScore: 0.93,
    negativeTags: [
      'romance', 'sensualidade', 'pose publicitária',
      'casal de banco de imagens'
    ]
  }),
  pexels('2540408', 'pexels-photo-2540408.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/photo-of-person-walking-on-pathway-near-rocks-2540408/',
    description: 'A lone hiker continues through a rugged rocky trail, emphasizing endurance and progress rather than arrival or triumph.',
    alt: 'Pessoa caminhando por uma trilha rochosa difícil e remota.',
    themes: ['perseverança'],
    tags: [
      'perseverança', 'progresso', 'persistência', 'resistência',
      'endurance', 'trail', 'journey', 'walking',
      'rugged', 'rocks', 'continuity', 'effort'
    ],
    moods: ['resiliente', 'progressivo', 'sóbrio', 'firme'],
    representationModes: ['conceptual', 'hybrid'],
    safeTextAreas: ['upper-left', 'upper-right'],
    tabletSafeTextAreas: ['upper-left', 'upper-right'],
    mobileSafeTextAreas: ['upper', 'lower'],
    focalPoint: { x: 0.52, y: 0.56 },
    tabletFocalPoint: { x: 0.52, y: 0.54 },
    mobileFocalPoint: { x: 0.52, y: 0.54 },
    compositionScore: 0.86,
    identityScore: 0.92,
    negativeTags: [
      'troféu', 'cume vitorioso', 'celebração',
      'pose heroica', 'turismo'
    ]
  }),
  pexels('4746768', 'pexels-photo-4746768.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/two-men-hugging-4746768/',
    description: 'Two people share a warm outdoor embrace in natural light, suggesting reconnection, release and restored human closeness.',
    alt: 'Duas pessoas se abraçando ao ar livre em um gesto de reconexão.',
    width: 6000,
    height: 4000,
    themes: ['perdão'],
    tags: [
      'perdão', 'reconciliação', 'liberação', 'recomeço',
      'reconnection', 'embrace', 'hug', 'support',
      'human connection', 'restored bond', 'release'
    ],
    moods: ['humilde', 'aliviado', 'reconciliador', 'caloroso'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    tabletSafeTextAreas: ['upper-left', 'upper-right'],
    mobileSafeTextAreas: ['upper', 'lower'],
    focalPoint: { x: 0.52, y: 0.50 },
    tabletFocalPoint: { x: 0.52, y: 0.50 },
    mobileFocalPoint: { x: 0.52, y: 0.50 },
    compositionScore: 0.87,
    identityScore: 0.92,
    negativeTags: [
      'romance', 'festa', 'publicidade',
      'pose olhando para câmera'
    ]
  }),
  pexels('4978541', 'pexels-photo-4978541.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/silhouette-of-a-person-inside-a-dark-room-4978541/',
    description: 'A quiet human silhouette sits in a doorway facing open dusk light, expressing trust amid uncertainty without religious iconography.',
    alt: 'Silhueta de uma pessoa sentada diante de uma abertura com luz suave ao entardecer.',
    width: 4000,
    height: 6000,
    themes: ['fé'],
    tags: [
      'fé', 'direção', 'presença', 'luz discreta',
      'uncertainty', 'silhouette', 'doorway', 'quiet',
      'trust', 'unknown', 'distant light', 'contemplation'
    ],
    moods: ['contemplativo', 'confiante', 'sóbrio'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    tabletSafeTextAreas: ['upper-left', 'upper-right'],
    mobileSafeTextAreas: ['upper', 'lower'],
    focalPoint: { x: 0.50, y: 0.56 },
    tabletFocalPoint: { x: 0.50, y: 0.54 },
    mobileFocalPoint: { x: 0.50, y: 0.54 },
    compositionScore: 0.88,
    identityScore: 0.93,
    negativeTags: [
      'cruz', 'bíblia aberta', 'igreja',
      'pose religiosa', 'publicidade'
    ]
  }),
  pexels('18820283', 'pexels-photo-18820283.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/sunlight-streaming-into-a-dark-room-through-a-lone-window-18820283/',
    description: 'Natural sunlight enters a dark room through a real window, creating restrained contrast, clarity and negative space.',
    alt: 'Luz natural entrando por uma janela em um ambiente escuro.',
    width: 6105,
    height: 4070,
    themes: ['luz'],
    tags: [
      'luz', 'clareza', 'revelação', 'direção',
      'natural light', 'window', 'shadow', 'contrast',
      'illumination', 'dark room', 'negative space'
    ],
    moods: ['revelador', 'esperançoso', 'solene', 'contemplativo'],
    representationModes: ['literal', 'hybrid', 'conceptual'],
    safeTextAreas: ['left', 'lower-left'],
    tabletSafeTextAreas: ['left', 'lower-left'],
    mobileSafeTextAreas: ['upper', 'lower'],
    focalPoint: { x: 0.68, y: 0.46 },
    tabletFocalPoint: { x: 0.64, y: 0.48 },
    mobileFocalPoint: { x: 0.60, y: 0.48 },
    compositionScore: 0.91,
    identityScore: 0.94,
    negativeTags: [
      'raios divinos', 'efeito celestial',
      'neon', 'publicidade', 'cruz'
    ]
  }),
  pexels('29248081', 'pexels-photo-29248081.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/blurred-view-through-rain-soaked-window-indoors-29248081/',
    description: 'Rain blurs the outside view through a window while the protected interior remains quiet and restrained.',
    alt: 'Chuva no vidro separando um interior protegido de uma paisagem externa incerta.',
    width: 7011,
    height: 4674,
    themes: ['confiança'],
    tags: [
      'confiança', 'refúgio', 'direção', 'sustentação',
      'shelter', 'protected interior', 'rain', 'window',
      'uncertainty', 'weather', 'obscured view', 'quiet'
    ],
    moods: ['seguro', 'sereno', 'encorajador', 'contemplativo'],
    representationModes: ['conceptual'],
    safeTextAreas: ['left', 'upper-left'],
    tabletSafeTextAreas: ['left', 'upper-left'],
    mobileSafeTextAreas: ['upper', 'lower'],
    focalPoint: { x: 0.55, y: 0.50 },
    tabletFocalPoint: { x: 0.54, y: 0.50 },
    mobileFocalPoint: { x: 0.53, y: 0.50 },
    compositionScore: 0.88,
    identityScore: 0.92,
    negativeTags: [
      'festa', 'turismo', 'publicidade', 'praia tropical'
    ]
  }),
  pexels('3164128', 'pexels-photo-3164128.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/bridge-over-river-3164128/',
    description: 'A lone person crosses a narrow bridge into dense fog, continuing despite an uncertain path ahead.',
    alt: 'Pessoa atravessando sozinha uma ponte estreita cercada por neblina.',
    themes: ['coragem'],
    tags: [
      'coragem', 'travessia', 'resistência', 'decisão',
      'crossing', 'bridge', 'fog', 'uncertainty',
      'journey', 'risk', 'solitary', 'forward'
    ],
    moods: ['firme', 'tenso', 'encorajador', 'sóbrio'],
    representationModes: ['conceptual', 'hybrid'],
    safeTextAreas: ['upper-left', 'upper-right'],
    tabletSafeTextAreas: ['upper-right', 'lower-right'],
    mobileSafeTextAreas: ['upper', 'lower'],
    focalPoint: { x: 0.50, y: 0.58 },
    tabletFocalPoint: { x: 0.50, y: 0.56 },
    mobileFocalPoint: { x: 0.50, y: 0.55 },
    compositionScore: 0.88,
    identityScore: 0.92,
    negativeTags: [
      'pose heroica', 'troféu', 'comemoração', 'triunfalismo'
    ]
  }),
  pexels('19023904', 'pexels-photo-19023904.jpeg', {
    providerUrl: 'https://www.pexels.com/photo/table-and-empty-chair-behind-19023904/',
    description: 'An empty chair rests in a quiet interior shaped by soft natural light and restrained shadows.',
    alt: 'Cadeira vazia em um interior silencioso com luz natural suave.',
    width: 3024,
    height: 4032,
    themes: ['descanso'],
    tags: [
      'descanso', 'pausa', 'abrigo', 'quietude',
      'empty chair', 'stillness', 'quiet interior',
      'soft light', 'rest', 'shelter', 'slow', 'calm'
    ],
    moods: ['quieto', 'protegido', 'desacelerado', 'sereno'],
    representationModes: ['conceptual'],
    safeTextAreas: ['upper-left', 'upper-right'],
    tabletSafeTextAreas: ['upper-right', 'left'],
    mobileSafeTextAreas: ['upper', 'lower'],
    focalPoint: { x: 0.55, y: 0.58 },
    tabletFocalPoint: { x: 0.54, y: 0.56 },
    mobileFocalPoint: { x: 0.53, y: 0.54 },
    compositionScore: 0.89,
    identityScore: 0.92,
    negativeTags: [
      'resort', 'rede de praia', 'turismo', 'festa', 'publicidade'
    ]
  })
];

function normalize(value = '') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function overlap(a = [], b = []) {
  const right = new Set(b.map(normalize));
  return a.reduce((score, item) => score + (right.has(normalize(item)) ? 1 : 0), 0);
}

export function getCuratedCandidates(intent = null, limit = 12) {
  const cloned = CURATED_VISUALS.map(item => ({
    ...item,
    themes: [...item.themes],
    tags: [...item.tags],
    moods: [...item.moods],
    representationModes: [...item.representationModes],
    safeTextAreas: [...item.safeTextAreas],
    negativeTags: [...item.negativeTags]
  }));

  if (!intent) return cloned.slice(0, limit);

  const primary = intent.semantic?.primaryTheme || '';
  const literal = intent.representation?.literalElements || [];
  const symbolic = intent.representation?.symbolicElements || [];
  const moods = intent.semantic?.emotionalTone || [];
  const mode = intent.representation?.mode || 'conceptual';

  return cloned
    .map(candidate => ({
      ...candidate,
      relevanceHint:
        (candidate.themes.some(theme => normalize(theme) === normalize(primary)) ? 5 : 0) +
        overlap(candidate.tags, literal) * 3 +
        overlap(candidate.tags, symbolic) * 1.5 +
        overlap(candidate.moods, moods) * 1.25 +
        (candidate.representationModes.includes(mode) ? 1.5 : 0)
    }))
    .filter(candidate => candidate.relevanceHint >= 4.5)
    .sort((a, b) => b.relevanceHint - a.relevanceHint)
    .slice(0, limit);
}