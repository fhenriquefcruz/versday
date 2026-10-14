// js/visualIntelligence.js
// Motor semântico visual do VersDay.
// Não decide por palavra isolada: transforma a passagem em intenção visual estruturada.

import { resolveBiblicalContext } from './biblical-context.js';

export const VISUAL_ENGINE_VERSION = '2.6.0';

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