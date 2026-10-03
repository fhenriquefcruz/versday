// js/visualIntelligence.js
// Motor semântico visual do VersDay.
// Não decide por palavra isolada: transforma a passagem em intenção visual estruturada.

import { resolveBiblicalContext } from './biblical-context.js';

export const VISUAL_ENGINE_VERSION = '2.3.0';

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