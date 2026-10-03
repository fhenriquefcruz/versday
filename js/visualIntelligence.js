// js/visualIntelligence.js
// Motor semântico visual do VersDay.
// Não decide por palavra isolada: transforma a passagem em intenção visual estruturada.

import { resolveBiblicalContext } from './biblical-context.js';

export const VISUAL_ENGINE_VERSION = '2.4.0';

const STYLE_SIGNATURE = [
  'editorial photography',
  'cinematic natural light',
  'restrained color palette',
  'clean composition',
  'contemplative atmosphere',
  'negative space'
];

const LITERAL_QUERY_HINTS = Object.freeze({
  pastagem: 'sheep grazing pastoral field',
  mar: 'rough sea small distant boat',
  'água': 'natural river water restrained landscape',
  caminho: 'narrow path restrained landscape',
  luz: 'natural physical light shadow',
  semente: 'sower seeds field',
  vinha: 'vine branches vineyard detail',
  deserto: 'dry desert restrained landscape',
  montanha: 'mountain terrain atmospheric distance',
  cidade: 'ancient city walls restrained landscape',
  ave: 'birds natural habitat',
  cruz: 'wooden cross historically restrained scene',
  'túmulo': 'stone tomb entrance quiet historical landscape',
  batalha: 'distant conflict landscape non graphic',
  'prisão': 'stone prison interior restrained light',
  fogo: 'real fire furnace restrained non graphic scene',
  'pão': 'bread on simple table natural light',
  'céu': 'natural sky restrained atmosphere'
});

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
  sofrimento: {
    primaryTheme: 'sofrimento',
    emotionalTone: ['doloroso', 'sóbrio', 'resiliente'],
    visualIntent: 'reconhecer dor e vulnerabilidade sem romantizar sofrimento nem antecipar triunfo',
    symbolicElements: ['fragilidade', 'persistência', 'presença'],
    preferredScenes: ['subdued solitary interior with natural side light', 'difficult path under restrained weather', 'quiet human presence in a somber authentic environment'],
    avoid: ['fotografia alegre', 'celebração', 'vitória precoce', 'dor encenada', 'violência gráfica'],
    palette: ['#0d1217', '#303a42', '#6a625d', '#c7baaa'],
    mode: 'conceptual'
  },
  medo: {
    primaryTheme: 'medo',
    emotionalTone: ['tenso', 'vulnerável', 'contido'],
    visualIntent: 'ameaça e vulnerabilidade com possibilidade de abrigo ou direção, sem estética de terror',
    symbolicElements: ['incerteza', 'ameaça', 'refúgio'],
    preferredScenes: ['limited visibility with a subtle safe light', 'small human figure in a vast uncertain environment', 'shelter against restrained severe weather'],
    avoid: ['filme de terror', 'monstros', 'jumpscare', 'pânico encenado', 'violência gráfica'],
    palette: ['#081018', '#263640', '#625d55', '#c8b891'],
    mode: 'conceptual'
  },
  morte: {
    primaryTheme: 'morte',
    emotionalTone: ['solene', 'enlutado', 'silencioso'],
    visualIntent: 'mortalidade, perda e silêncio sem exploração mórbida ou horror',
    symbolicElements: ['ausência', 'finitude', 'memória'],
    preferredScenes: ['quiet empty space with subdued natural light', 'bare restrained landscape suggesting absence', 'still room with respectful negative space'],
    avoid: ['cadáver', 'sangue', 'violência gráfica', 'cemitério genérico', 'terror', 'funeral de banco de imagens'],
    palette: ['#090d11', '#2b3035', '#585754', '#b8b0a5'],
    mode: 'conceptual'
  },
  ressurreicao: {
    primaryTheme: 'ressurreição',
    emotionalTone: ['assombro', 'esperançoso', 'solene'],
    visualIntent: 'passagem real da morte para a vida e esperança restaurada sem espetáculo religioso artificial',
    symbolicElements: ['vida', 'renovação', 'abertura'],
    preferredScenes: ['restrained first light emerging after deep darkness', 'new life with quiet luminous atmosphere and negative space', 'subtle opening from darkness into natural light'],
    avoid: ['ator de branco', 'raios divinos artificiais', 'céu angelical', 'sunrise motivacional', 'IA fantasiosa'],
    palette: ['#090f14', '#344854', '#8a8069', '#e0d4ad'],
    mode: 'conceptual'
  },
  justica: {
    primaryTheme: 'justiça',
    emotionalTone: ['firme', 'sóbrio', 'responsável'],
    visualIntent: 'retidão, dignidade e defesa do vulnerável sem reduzir justiça a símbolos jurídicos clichês',
    symbolicElements: ['equidade', 'responsabilidade', 'dignidade'],
    preferredScenes: ['authentic human dignity in restrained documentary setting', 'balanced architectural space with clear natural light', 'quiet act of support or protection without staged posing'],
    avoid: ['martelo de juiz', 'balança genérica', 'tribunal de banco de imagens', 'vingança', 'triunfalismo'],
    palette: ['#0e1519', '#34434a', '#716a5b', '#d2c5aa'],
    mode: 'conceptual'
  },
  guerra: {
    primaryTheme: 'guerra',
    emotionalTone: ['tenso', 'sombrio', 'grave'],
    visualIntent: 'conflito, ameaça e custo humano sem glorificar violência, armas ou destruição',
    symbolicElements: ['conflito', 'ameaça', 'perda'],
    preferredScenes: ['distant restrained conflict aftermath without graphic violence', 'threatened city or landscape under tense atmosphere', 'people seeking safety in non-graphic documentary distance'],
    avoid: ['gore', 'explosão heroica', 'arma em destaque', 'propaganda militar', 'pose de soldado', 'violência gráfica'],
    palette: ['#0c1114', '#353b3c', '#675e52', '#b9aa8e'],
    mode: 'hybrid'
  },
  profecia: {
    primaryTheme: 'profecia',
    emotionalTone: ['solene', 'expectante', 'simbólico'],
    visualIntent: 'anúncio, advertência ou esperança futura com sobriedade, respeitando linguagem profética e apocalíptica',
    symbolicElements: ['expectativa', 'advertência', 'visão'],
    preferredScenes: ['restrained symbolic landscape with strong negative space', 'distant city under solemn atmospheric light', 'watchful horizon with controlled dramatic tension'],
    avoid: ['bola de cristal', 'adivinhação', 'fantasia mística', 'apocalipse de IA', 'catástrofe espetacular'],
    palette: ['#0b1118', '#303b49', '#665c4e', '#c9b27e'],
    mode: 'conceptual'
  },
  lamento: {
    primaryTheme: 'lamento',
    emotionalTone: ['enlutado', 'silencioso', 'vulnerável'],
    visualIntent: 'dar espaço à dor, ausência e saudade sem sentimentalismo fabricado',
    symbolicElements: ['ausência', 'saudade', 'súplica'],
    preferredScenes: ['quiet desolate space with restrained natural light', 'solitary figure from distance with large negative space', 'rain or subdued landscape without melodrama'],
    avoid: ['sorriso', 'celebração', 'pôr do sol romântico', 'choro encenado', 'cemitério automático'],
    palette: ['#0b1015', '#303940', '#625e5a', '#bdb4aa'],
    mode: 'conceptual'
  },
  julgamento: {
    primaryTheme: 'julgamento',
    emotionalTone: ['solene', 'grave', 'responsável'],
    visualIntent: 'peso de prestação de contas e consequência sem sensacionalismo de condenação',
    symbolicElements: ['responsabilidade', 'consequência', 'verdade'],
    preferredScenes: ['solemn threshold or doorway with controlled contrast', 'restrained architectural space suggesting accountability', 'dark-to-light composition with serious quiet atmosphere'],
    avoid: ['martelo de juiz', 'fogo do inferno', 'demônios', 'tribunal clichê', 'terror religioso'],
    palette: ['#090e13', '#32383e', '#655d52', '#c5b493'],
    mode: 'conceptual'
  },
  reconciliacao: {
    primaryTheme: 'reconciliação',
    emotionalTone: ['humilde', 'íntimo', 'restaurador'],
    visualIntent: 'reaproximação depois de ruptura com linguagem humana autêntica e não publicitária',
    symbolicElements: ['retorno', 'escuta', 'vínculo'],
    preferredScenes: ['two people reconnecting with subtle authentic body language', 'family reunion from respectful documentary distance', 'quiet shared space after tension with warm natural light'],
    avoid: ['abraço publicitário', 'casal romântico genérico', 'festa', 'pose olhando para câmera'],
    palette: ['#17191a', '#4d514c', '#8b7560', '#dfcdb5'],
    mode: 'conceptual'
  },
  relacionamento: {
    primaryTheme: 'relacionamento',
    emotionalTone: ['humano', 'caloroso', 'autêntico'],
    visualIntent: 'presença e vínculo entre pessoas de forma verdadeira, respeitando o tipo de relação indicado pela passagem',
    symbolicElements: ['presença', 'cuidado', 'comunidade'],
    preferredScenes: ['authentic people sharing quiet presence without posing', 'family or friends in natural candid interaction', 'subtle act of care in warm restrained light'],
    avoid: ['casal romântico automático', 'ensaio publicitário', 'sensualidade', 'grupo olhando para câmera'],
    palette: ['#181817', '#4d4941', '#8b745b', '#e1ceb2'],
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
  gn: 'narrativa/torá', ex: 'narrativa/torá', lv: 'lei/torá', nm: 'narrativa/torá', dt: 'lei/torá',
  js: 'narrativa', jz: 'narrativa', rt: 'narrativa', '1sm': 'narrativa', '2sm': 'narrativa',
  '1rs': 'narrativa', '2rs': 'narrativa', '1cr': 'narrativa', '2cr': 'narrativa',
  ed: 'narrativa', ne: 'narrativa', et: 'narrativa',
  sl: 'poesia', pv: 'sabedoria', ec: 'sabedoria', 'jó': 'poesia sapiencial', ct: 'poesia',
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
  'conforto','coragem','superacao','cura','perdao','oracao','descanso',
  'sofrimento','medo','morte','ressurreicao','justica','profecia','lamento',
  'julgamento','reconciliacao','relacionamento'
]);

function normalize(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsSemanticTerm(text, term) {
  const haystack = normalize(text);
  const needle = normalize(term).trim();
  if (!needle) return false;

  const pattern = escapeRegex(needle).replace(/\s+/g, '\\s+');
  return new RegExp('(^|[^a-z0-9])' + pattern + '(?=$|[^a-z0-9])').test(haystack);
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
    ['vinha', ['videira', 'videiras', 'vinhedo', 'vinhedos', 'uma vinha', 'a vinha', 'minha vinha', 'ramos']],
    ['deserto', ['deserto']],
    ['montanha', ['monte', 'montes', 'montanha']],
    ['cidade', ['cidade', 'muralha', 'portas']],
    ['ave', ['ave', 'aves', 'passaro', 'passaros', 'pássaro', 'pássaros']],
    ['cruz', ['cruz', 'cruzes']],
    ['túmulo', ['tumulo', 'túmulo', 'sepulcro', 'sepultado', 'sepultamento']],
    ['batalha', ['guerra', 'batalha', 'exercito', 'exército', 'soldados', 'espada', 'lanca', 'lança']],
    ['prisão', ['prisao', 'prisão', 'carcere', 'cárcere', 'cadeias', 'algemas']],
    ['fogo', ['fogo', 'fornalha', 'chamas']],
    ['pão', ['pao', 'pão', 'paes', 'pães']],
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

const STRONG_LITERAL_SIGNALS = new Set([
  'pastagem', 'mar', 'semente', 'vinha', 'deserto', 'cidade', 'ave', 'cruz',
  'túmulo', 'batalha', 'prisão', 'fogo', 'pão'
]);

function deriveMode(profile, text, literalSignals) {
  const literal = literalSignals.filter(signal => !detectMetaphoricalUse(text, signal));
  if (!literal.length) {
    if (CONCEPTUAL_THEMES.has(normalize(profile.primaryTheme)) || profile.mode === 'conceptual') return 'conceptual';
    return profile.mode || 'abstract';
  }

  if (literal.some(signal => STRONG_LITERAL_SIGNALS.has(signal))) return 'literal';
  if (profile.mode === 'literal') return 'literal';
  return 'hybrid';
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function analyzeVerse(verse = {}) {
  const rawTheme = normalize(verse.theme || '');
  const profile = THEME_PROFILES[rawTheme] || THEME_PROFILES.fe;
  const text = normalize(verse.text || '');
  const context = resolveBiblicalContext(verse);
  const detectedSignals = detectLiteralSignals(text);
  const suppressedSignals = new Set(
    (context.suppressLiteral || []).map(normalize)
  );
  const literalSignals = detectedSignals.filter(
    signal => !suppressedSignals.has(normalize(signal))
  );
  const mode = deriveMode(profile, text, literalSignals);

  const literalElements = unique([
    ...(profile.literalElements || []),
    ...literalSignals.filter(signal => !detectMetaphoricalUse(text, signal))
  ]);

  const symbolicElements = unique([
    ...(profile.symbolicElements || []),
    ...literalSignals
      .filter(signal => detectMetaphoricalUse(text, signal))
      .map(signal => `${signal} como metáfora`),
    ...detectedSignals
      .filter(signal => suppressedSignals.has(normalize(signal)))
      .map(signal => `${signal} como imagem contextual`)
  ]);

  const rawBook = String(verse.book || '').trim().toLowerCase();
  const genre = BOOK_GENRES[rawBook] || BOOK_GENRES[normalize(rawBook)] || 'bíblico';

  const confidenceBase = verse.theme ? 0.84 : 0.68;
  const contextBonus =
    context.granularity === 'passage-range'
      ? 0.06
      : context.source === 'curated-context'
        ? 0.04
        : 0;
  const confidence = Math.min(
    0.98,
    confidenceBase +
      contextBonus +
      (literalElements.length ? 0.05 : 0)
  );

  return {
    engineVersion: VISUAL_ENGINE_VERSION,
    verseReference: verse.reference || '',
    passageText: verse.text || '',
    biblicalContext: {
      book: verse.book || '',
      chapter: verse.chapter || null,
      literaryGenre: genre,
      surroundingContext: context.text,
      narrativeSituation: context.narrativeSituation,
      characters: [...context.characters],
      suppressedLiteralElements: [...(context.suppressLiteral || [])],
      contextSource: context.source,
      contextGranularity: context.granularity || 'genre-only',
      contextScope: context.scope || null
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
      description: context.narrativeSituation
        ? `${profile.visualIntent}. Contexto: ${context.narrativeSituation}.`
        : profile.visualIntent,
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
      humanPresence: ['amor','perdao','reconciliacao','relacionamento'].includes(rawTheme)
        ? 'preferred'
        : 'optional'
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
    .slice(0, 5)
    .map(item => `avoid ${normalize(item)}`)
    .join(', ');

  const literalHints = unique(
    (intent.representation.literalElements || [])
      .map(item => LITERAL_QUERY_HINTS[item])
      .filter(Boolean)
  );

  const contextualLiteralScene = literalHints.length
    ? literalHints.join(' ')
    : '';

  const preferred = [...(intent.visualIntent.preferredScenes || [])];
  const scenes = unique([
    ...(contextualLiteralScene ? [contextualLiteralScene] : []),
    ...preferred
  ]).slice(0, 4);

  return scenes.map((scene, index) => ({
    id: `q${index + 1}`,
    query: [scene, ...STYLE_SIGNATURE].join(' '),
    negativePrompt: negative,
    representationMode: intent.representation.mode,
    source: index === 0 && contextualLiteralScene ? 'literal-context' : 'semantic-scene'
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