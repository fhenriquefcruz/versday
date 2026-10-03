// js/visualIntelligence.js
// Motor semântico visual do VersDay.
// Não decide por palavra isolada: transforma a passagem em intenção visual estruturada.

export const VISUAL_ENGINE_VERSION = '2.0.0';

const STYLE_SIGNATURE = [
  'editorial photography',
  'cinematic natural light',
  'restrained color palette',
  'clean composition',
  'contemplative atmosphere',
  'negative space'
];

const THEME_PROFILES = {
  paz: {
    primaryTheme: 'paz',
    emotionalTone: ['sereno', 'quieto', 'acolhedor'],
    visualIntent: 'silêncio, estabilidade e repouso sem euforia',
    symbolicElements: ['quietude', 'equilíbrio', 'abrigo'],
    preferredScenes: ['still water at dawn', 'quiet minimal interior with soft window light', 'misty calm landscape'],
    avoid: ['festa', 'multidão', 'euforia', 'tempestade violenta'],
    palette: ['#0d1f26', '#365b5a', '#b6a37b', '#e7dfcf'],
    mode: 'conceptual'
  },
  alegria: {
    primaryTheme: 'alegria',
    emotionalTone: ['luminoso', 'vivo', 'leve'],
    visualIntent: 'alegria genuína e luminosa, sem aparência publicitária',
    symbolicElements: ['abertura', 'luz', 'renovação'],
    preferredScenes: ['natural morning light entering a room', 'sunlit field with subtle movement', 'authentic candid human joy from distance'],
    avoid: ['pose publicitária', 'festa artificial', 'neon', 'saturação extrema'],
    palette: ['#18232b', '#ba7f3d', '#d7b46a', '#f4ead6'],
    mode: 'conceptual'
  },
  amor: {
    primaryTheme: 'amor',
    emotionalTone: ['íntimo', 'caloroso', 'humano'],
    visualIntent: 'presença, cuidado, vínculo e proximidade autêntica',
    symbolicElements: ['presença', 'cuidado', 'aliança'],
    preferredScenes: ['two people sharing quiet authentic presence', 'hands caring for another person natural light', 'warm intimate interior with human connection'],
    avoid: ['coração literal', 'pose romântica genérica', 'casal de banco de imagens', 'sensualidade'],
    palette: ['#201817', '#6a443a', '#b9825c', '#ead9c8'],
    mode: 'conceptual'
  },
  fe: {
    primaryTheme: 'fé',
    emotionalTone: ['contemplativo', 'confiante', 'sóbrio'],
    visualIntent: 'confiança no invisível sem recorrer a clichê religioso automático',
    symbolicElements: ['direção', 'presença', 'luz discreta'],
    preferredScenes: ['soft distant light through darkness', 'quiet human silhouette facing uncertainty', 'subtle path disappearing into mist'],
    avoid: ['cruz genérica', 'bíblia aberta genérica', 'mãos em oração sem contexto', 'igreja aleatória'],
    palette: ['#0b1320', '#263d51', '#8d7a5c', '#e0c78f'],
    mode: 'conceptual'
  },
  forca: {
    primaryTheme: 'força',
    emotionalTone: ['firme', 'resiliente', 'sóbrio'],
    visualIntent: 'resistência e sustentação em contexto de pressão',
    symbolicElements: ['firmeza', 'resistência', 'sustentação'],
    preferredScenes: ['single tree resisting strong wind', 'rock exposed to rough sea', 'person standing in vast challenging landscape'],
    avoid: ['fisiculturismo', 'pose heroica artificial', 'explosões', 'triunfalismo'],
    palette: ['#11171d', '#3a4a4b', '#735f4b', '#c0aa84'],
    mode: 'conceptual'
  },
  esperanca: {
    primaryTheme: 'esperança',
    emotionalTone: ['esperançoso', 'sereno', 'ascendente'],
    visualIntent: 'sinal realista de renovação depois de tensão ou espera',
    symbolicElements: ['renovação', 'horizonte', 'abertura'],
    preferredScenes: ['first light after storm clouds', 'new growth in restrained natural scene', 'distant horizon with soft opening light'],
    avoid: ['sunrise clichê isolado', 'euforia', 'arco-íris artificial', 'motivational wallpaper'],
    palette: ['#10202a', '#325b68', '#8a8f70', '#d6bd83'],
    mode: 'conceptual'
  },
  confianca: {
    primaryTheme: 'confiança',
    emotionalTone: ['seguro', 'sereno', 'encorajador'],
    visualIntent: 'segurança apesar de incerteza, risco ou caminho não totalmente visível',
    symbolicElements: ['refúgio', 'direção', 'sustentação'],
    preferredScenes: ['protected shelter in difficult weather', 'steady path through uncertain terrain', 'distant guiding light in restrained dramatic atmosphere'],
    avoid: ['montanha aleatória', 'pose vitoriosa', 'festa', 'praia tropical'],
    palette: ['#0d1720', '#2d4654', '#6f6b59', '#d3bd8c'],
    mode: 'conceptual'
  },
  gratidao: {
    primaryTheme: 'gratidão',
    emotionalTone: ['caloroso', 'humilde', 'contemplativo'],
    visualIntent: 'reconhecimento, suficiência e atenção ao que foi recebido',
    symbolicElements: ['abundância discreta', 'presença', 'acolhimento'],
    preferredScenes: ['simple shared table in warm natural light', 'harvest detail with restrained editorial composition', 'quiet hands receiving warm light'],
    avoid: ['luxo', 'ostentação', 'festa', 'publicidade'],
    palette: ['#201811', '#6a4e33', '#b1834e', '#ead7b9'],
    mode: 'conceptual'
  },
  sabedoria: {
    primaryTheme: 'sabedoria',
    emotionalTone: ['reflexivo', 'sóbrio', 'claro'],
    visualIntent: 'discernimento, ponderação e clareza, não erudição decorativa',
    symbolicElements: ['discernimento', 'atenção', 'escolha'],
    preferredScenes: ['quiet desk with natural side light and restrained detail', 'crossroads with subtle visual tension', 'person observing before acting'],
    avoid: ['coruja', 'biblioteca luxuosa genérica', 'livro antigo sem relação', 'estereótipo acadêmico'],
    palette: ['#111819', '#39423c', '#8a795f', '#ddd2bf'],
    mode: 'conceptual'
  },
  conforto: {
    primaryTheme: 'conforto',
    emotionalTone: ['acolhedor', 'sereno', 'compassivo'],
    visualIntent: 'presença em meio à fragilidade, sem negar a dor',
    symbolicElements: ['acolhimento', 'abrigo', 'proximidade'],
    preferredScenes: ['quiet warm window light in subdued interior', 'safe shelter during rain', 'gentle human presence without posed emotion'],
    avoid: ['alegria excessiva', 'festa', 'paisagem ensolarada eufórica', 'publicidade'],
    palette: ['#15191d', '#3d4b50', '#786a5c', '#d5c7b6'],
    mode: 'conceptual'
  },
  coragem: {
    primaryTheme: 'coragem',
    emotionalTone: ['firme', 'tenso', 'encorajador'],
    visualIntent: 'seguir adiante apesar do risco, não ausência de medo',
    symbolicElements: ['travessia', 'resistência', 'decisão'],
    preferredScenes: ['single person facing vast difficult terrain', 'small vessel against dramatic sea from distance', 'narrow route through challenging environment'],
    avoid: ['pose de super-herói', 'troféu', 'comemoração', 'montanha genérica sem tensão'],
    palette: ['#0b141c', '#314654', '#675748', '#c8a978'],
    mode: 'conceptual'
  },
  superacao: {
    primaryTheme: 'perseverança',
    emotionalTone: ['resiliente', 'progressivo', 'sóbrio'],
    visualIntent: 'processo, continuidade e resistência antes do resultado',
    symbolicElements: ['progresso', 'persistência', 'renovação'],
    preferredScenes: ['long path after harsh weather', 'slow ascent through rugged terrain', 'new growth through difficult ground'],
    avoid: ['pódio', 'medalha', 'vitória esportiva', 'euforia'],
    palette: ['#11181d', '#3c4f4c', '#76644e', '#d0b784'],
    mode: 'conceptual'
  },
  cura: {
    primaryTheme: 'cura',
    emotionalTone: ['delicado', 'restaurador', 'sereno'],
    visualIntent: 'restauração gradual e cuidado, sem prometer resultado instantâneo',
    symbolicElements: ['restauração', 'cuidado', 'renovação'],
    preferredScenes: ['new leaves after rain close editorial detail', 'soft daylight in calm recovery space', 'gentle water and organic textures'],
    avoid: ['milagre visual literal', 'hospital genérico', 'antes e depois', 'euforia'],
    palette: ['#102019', '#3d6252', '#84937a', '#dfe5d6'],
    mode: 'conceptual'
  },
  perdao: {
    primaryTheme: 'perdão',
    emotionalTone: ['humilde', 'aliviado', 'reconciliador'],
    visualIntent: 'liberação, restauração de vínculo e abertura depois de ruptura',
    symbolicElements: ['reconciliação', 'liberação', 'recomeço'],
    preferredScenes: ['two people reconnecting with subtle body language', 'open doorway with soft restrained light', 'hands releasing tension in intimate natural light'],
    avoid: ['pôr do sol automático', 'pomba literal', 'coração', 'festa'],
    palette: ['#171a1d', '#4f5554', '#8a7564', '#e0d0bd'],
    mode: 'conceptual'
  },
  oracao: {
    primaryTheme: 'oração',
    emotionalTone: ['silencioso', 'íntimo', 'reverente'],
    visualIntent: 'atenção, recolhimento e diálogo espiritual sem iconografia automática',
    symbolicElements: ['silêncio', 'recolhimento', 'presença'],
    preferredScenes: ['quiet room with soft side window light', 'solitary contemplative figure with large negative space', 'early dawn stillness minimal scene'],
    avoid: ['mãos juntas automáticas', 'igreja genérica', 'cruz genérica', 'multidão religiosa'],
    palette: ['#0d141c', '#2d3d49', '#685f55', '#d4c3a7'],
    mode: 'conceptual'
  },
  descanso: {
    primaryTheme: 'descanso',
    emotionalTone: ['quieto', 'protegido', 'desacelerado'],
    visualIntent: 'cessar esforço e experimentar segurança, não lazer turístico',
    symbolicElements: ['pausa', 'abrigo', 'quietude'],
    preferredScenes: ['quiet interior with morning light and empty chair', 'still pastoral landscape', 'calm shaded place with minimal composition'],
    avoid: ['resort', 'rede de praia', 'turismo', 'festa'],
    palette: ['#111b1d', '#3f5c58', '#7a7766', '#dbd2be'],
    mode: 'conceptual'
  },
  pastor: {
    primaryTheme: 'pastoreio',
    emotionalTone: ['protetor', 'sereno', 'pastoral'],
    visualIntent: 'cuidado e condução em ambiente pastoral real',
    literalElements: ['ovelhas', 'pastagem'],
    symbolicElements: ['cuidado', 'condução', 'proteção'],
    preferredScenes: ['sheep grazing in wide pastoral field natural light', 'flock crossing quiet meadow', 'pastoral landscape with distant shepherd when natural'],
    avoid: ['cruz', 'igreja', 'cidade', 'animais de estimação'],
    palette: ['#122017', '#456143', '#8c875f', '#dbc995'],
    mode: 'literal'
  },
  natureza: {
    primaryTheme: 'criação',
    emotionalTone: ['contemplativo', 'orgânico', 'amplo'],
    visualIntent: 'natureza como criação concreta quando realmente presente no texto',
    literalElements: ['natureza'],
    preferredScenes: ['restrained natural landscape with atmospheric depth', 'forest with subtle natural light', 'organic detail with clean composition'],
    avoid: ['wallpaper genérico', 'HDR', 'saturação extrema'],
    palette: ['#0f1d18', '#36594a', '#7b8066', '#d2c8a6'],
    mode: 'literal'
  },
  agua: {
    primaryTheme: 'água',
    emotionalTone: ['fluido', 'contemplativo', 'ambivalente'],
    visualIntent: 'água somente quando literal ou quando a metáfora hídrica é central e inequívoca',
    literalElements: ['água'],
    preferredScenes: ['river in restrained natural light', 'still water with atmospheric depth', 'rough water when danger is explicit'],
    avoid: ['praia turística', 'piscina', 'resort'],
    palette: ['#071820', '#21495b', '#557883', '#d1d9d5'],
    mode: 'hybrid'
  },
  ceu: {
    primaryTheme: 'céu',
    emotionalTone: ['amplo', 'contemplativo', 'solene'],
    visualIntent: 'céu como elemento narrativo real, sem transformar toda transcendência em nuvens',
    literalElements: ['céu'],
    preferredScenes: ['large restrained sky with negative space', 'subtle stars in dark natural sky', 'dramatic clouds only when passage tension supports it'],
    avoid: ['céu angelical artificial', 'HDR', 'raios divinos clichês'],
    palette: ['#08131f', '#233c57', '#6a7481', '#d7d3c7'],
    mode: 'literal'
  },
  caminho: {
    primaryTheme: 'caminho',
    emotionalTone: ['direcional', 'contemplativo', 'progressivo'],
    visualIntent: 'jornada ou escolha, distinguindo estrada física de direção moral',
    literalElements: ['caminho'],
    symbolicElements: ['direção', 'decisão'],
    preferredScenes: ['subtle winding road with destination obscured', 'narrow trail through atmospheric landscape', 'crossroads with clean composition'],
    avoid: ['rodovia turística', 'carro', 'aventura esportiva'],
    palette: ['#111918', '#43564c', '#776a56', '#d2c3a7'],
    mode: 'hybrid'
  },
  luz: {
    primaryTheme: 'luz',
    emotionalTone: ['revelador', 'esperançoso', 'solene'],
    visualIntent: 'luz como revelação ou contraste com trevas quando simbólica; física somente quando o contexto exigir',
    symbolicElements: ['revelação', 'clareza', 'esperança'],
    preferredScenes: ['restrained beam of light through darkness', 'soft natural light entering shadowed space', 'subtle dawn light with strong negative space'],
    avoid: ['lens flare', 'céu divino artificial', 'HDR', 'sol isolado'],
    palette: ['#090d13', '#2d333c', '#8b744f', '#e5c889'],
    mode: 'hybrid'
  }
};

const BOOK_GENRES = {
  sl: 'poesia', pv: 'sabedoria', ec: 'sabedoria', jó: 'poesia sapiencial', ct: 'poesia',
  is: 'profecia', jr: 'profecia', lm: 'lamento', ez: 'profecia', dn: 'profecia/apocalíptica',
  os: 'profecia', jl: 'profecia', am: 'profecia', ob: 'profecia', jn: 'narrativa/profecia',
  mq: 'profecia', na: 'profecia', hc: 'profecia', sf: 'profecia', ag: 'profecia', zc: 'profecia', ml: 'profecia',
  mt: 'evangelho', mc: 'evangelho', lc: 'evangelho', jo: 'evangelho',
  atos: 'narrativa', rm: 'epístola', '1co': 'epístola', '2co': 'epístola', gl: 'epístola',
  ef: 'epístola', fp: 'epístola', cl: 'epístola', '1ts': 'epístola', '2ts': 'epístola',
  '1tm': 'epístola', '2tm': 'epístola', tt: 'epístola', fm: 'epístola', hb: 'epístola',
  tg: 'epístola', '1pe': 'epístola', '2pe': 'epístola', '1jo': 'epístola',
  '2jo': 'epístola', '3jo': 'epístola', jd: 'epístola', ap: 'apocalíptica'
};

const CONCEPTUAL_THEMES = new Set([
  'paz','alegria','amor','fe','forca','esperanca','confianca','gratidao','sabedoria',
  'conforto','coragem','superacao','cura','perdao','oracao','descanso'
]);

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function semanticPhrase(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsSemanticTerm(text, term) {
  const normalizedText = semanticPhrase(text);
  const normalizedTerm = semanticPhrase(term);
  if (!normalizedText || !normalizedTerm) return false;

  // Palavra/frase inteira: evita "rio" em "próprio" e "mar" em "amar".
  return (' ' + normalizedText + ' ').includes(' ' + normalizedTerm + ' ');
}

function includesAny(text, terms) {
  return terms.some(term => containsSemanticTerm(text, term));
}
function detectLiteralSignals(text) {
  const signals = [];
  const rules = [
    ['pastagem', ['ovelha', 'ovelhas', 'rebanho', 'pastor', 'pastos', 'pastagem']],
    ['mar', ['mar', 'mares', 'barco', 'navio', 'ondas', 'tempestade']],
    ['água', ['agua', 'aguas', 'rio', 'rios', 'fonte']],
    ['caminho', ['caminho', 'vereda', 'trilha', 'estrada']],
    ['luz', ['lampada', 'candeeiro', 'luz']],
    ['semente', ['semente', 'semeia', 'semeador', 'ceifa', 'colheita']],
    ['vinha', ['videira', 'vinha', 'ramos']],
    ['deserto', ['deserto']],
    ['montanha', ['monte', 'montes', 'montanha']],
    ['cidade', ['cidade', 'muralha', 'portas']],
    ['céu', ['ceu', 'ceus', 'estrelas', 'firmamento']]
  ];
  for (const [label, terms] of rules) {
    if (includesAny(text, terms)) signals.push(label);
  }
  return signals;
}

function detectMetaphoricalUse(text, signal) {
  const metaphorPatterns = {
    luz: ['luz do mundo', 'luz resplandece', 'vossa luz', 'luz dos homens'],
    caminho: ['caminho do senhor', 'dirige os passos', 'vereda da vida', 'caminho da vida'],
    água: ['agua viva', 'sede de justica', 'fonte da vida'],
    mar: ['mar de aflicao', 'ondas de'],
    montanha: ['montes se retirarao']
  };
  return includesAny(text, metaphorPatterns[signal] || []);
}

function deriveMode(profile, text, literalSignals) {
  const literal = literalSignals.filter(signal => !detectMetaphoricalUse(text, signal));
  if (profile.mode === 'literal' && literal.length) return 'literal';
  if (literal.length && profile.mode !== 'conceptual') return 'hybrid';
  if (CONCEPTUAL_THEMES.has(profile.primaryTheme) || profile.mode === 'conceptual') return 'conceptual';
  return profile.mode || 'abstract';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function analyzeVerse(verse = {}) {
  const rawTheme = normalize(verse.theme || '');
  const profile = THEME_PROFILES[rawTheme] || THEME_PROFILES.fe;
  const text = normalize(verse.text || '');
  const literalSignals = detectLiteralSignals(text);
  const mode = deriveMode(profile, text, literalSignals);

  const literalElements = unique([
    ...(profile.literalElements || []),
    ...literalSignals.filter(signal => !detectMetaphoricalUse(text, signal))
  ]);

  const symbolicElements = unique([
    ...(profile.symbolicElements || []),
    ...literalSignals.filter(signal => detectMetaphoricalUse(text, signal)).map(signal => `${signal} como metáfora`)
  ]);

  const genre = BOOK_GENRES[normalize(verse.book)] || 'bíblico';

  const confidenceBase = verse.theme ? 0.84 : 0.68;
  const confidence = Math.min(0.98, confidenceBase + (literalElements.length ? 0.05 : 0));

  return {
    engineVersion: VISUAL_ENGINE_VERSION,
    verseReference: verse.reference || '',
    passageText: verse.text || '',
    biblicalContext: {
      book: verse.book || '',
      chapter: verse.chapter || null,
      literaryGenre: genre
    },
    semantic: {
      primaryTheme: profile.primaryTheme,
      secondaryThemes: unique([rawTheme && rawTheme !== normalize(profile.primaryTheme) ? rawTheme : '']),
      messageIntent: profile.visualIntent,
      emotionalTone: [...profile.emotionalTone],
      atmosphere: [...profile.emotionalTone]
    },
    representation: {
      mode,
      literalElements,
      symbolicElements,
      metaphors: symbolicElements.filter(item => item.includes('metáfora'))
    },
    visualIntent: {
      description: profile.visualIntent,
      preferredScenes: [...profile.preferredScenes],
      acceptableScenes: [...profile.preferredScenes],
      undesirableScenes: [...profile.avoid],
      negativeConcepts: [...profile.avoid]
    },
    photography: {
      mood: [...profile.emotionalTone],
      lighting: ['natural light', 'restrained contrast'],
      environment: literalElements,
      composition: ['clean composition', 'negative space', 'editorial framing'],
      paletteHints: [...profile.palette],
      humanPresence: ['amor','perdão'].includes(rawTheme) ? 'preferred' : 'optional'
    },
    textComposition: {
      preferredSafeAreas: ['center', 'upper-left', 'lower-left'],
      desiredContrast: 'high-without-heavy-black-overlay',
      maxVisualComplexity: 0.58
    },
    confidence
  };
}

export function buildVisualQueries(intent) {
  const negative = intent.visualIntent.negativeConcepts
    .slice(0, 4)
    .map(item => `avoid ${normalize(item)}`)
    .join(', ');

  return intent.visualIntent.preferredScenes.slice(0, 3).map((scene, index) => ({
    id: `q${index + 1}`,
    query: [...scene.split(' '), ...STYLE_SIGNATURE].join(' '),
    negativePrompt: negative,
    representationMode: intent.representation.mode
  }));
}

export function buildAbstractVisual(intent) {
  const [a, b, c, d] = intent.photography.paletteHints;
  const theme = intent.semantic.primaryTheme;
  const angleSeed = [...theme].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const angle = 115 + (angleSeed % 55);

  return {
    mode: 'abstract',
    id: `abstract:${intent.verseReference || theme}:${VISUAL_ENGINE_VERSION}`,
    palette: [a, b, c, d],
    cssBackground: [
      `radial-gradient(circle at 24% 28%, ${c}55 0%, transparent 34%)`,
      `radial-gradient(circle at 78% 68%, ${b}88 0%, transparent 42%)`,
      `linear-gradient(${angle}deg, ${a} 0%, ${b} 48%, ${a} 100%)`
    ].join(', '),
    overlayStrength: 0.18,
    textPlacement: 'center',
    reason: 'Nenhuma fotografia ultrapassou o limiar semântico mínimo.'
  };
}

export function getThemeProfile(theme) {
  return THEME_PROFILES[normalize(theme)] || null;
}
