// js/semantic.js
// APENAS PAISAGENS CINEMATOGRÁFICAS

const baseImages = {
  // Amanhecer / entardecer
  dawn: [
    'https://images.pexels.com/photos/1167355/pexels-photo-1167355.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/1493215/pexels-photo-1493215.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/274062/pexels-photo-274062.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/1128797/pexels-photo-1128797.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ],
  // Montanhas
  mountains: [
    'https://images.pexels.com/photos/618848/pexels-photo-618848.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ],
  // Lagos e rios tranquilos
  calmWater: [
    'https://images.pexels.com/photos/457881/pexels-photo-457881.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/443446/pexels-photo-443446.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/3533156/pexels-photo-3533156.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ],
  // Oceanos – sem praias com pessoas
  ocean: [
    'https://images.pexels.com/photos/1112048/pexels-photo-1112048.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/158598/pexels-photo-158598.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/994605/pexels-photo-994605.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ],
  // Florestas e campos
  forest: [
    'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/344886/pexels-photo-344886.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/1292115/pexels-photo-1292115.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ],
  // Céu estrelado
  starry: [
    'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/912364/pexels-photo-912364.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/158163/clouds-cloudy-aggregation-nubes-158163.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ],
  // Caminhos e trilhas na natureza
  path: [
    'https://images.pexels.com/photos/115141/pexels-photo-115141.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/41953/road-curve-asphalt-country-road-41953.jpeg?auto=compress&cs=tinysrgb&w=1600',
    'https://images.pexels.com/photos/2193382/pexels-photo-2193382.jpeg?auto=compress&cs=tinysrgb&w=1600'
  ]
};

// Mapeamento de temas para categorias visuais
const themeToCategory = {
  alegria: 'forest',
  paz: 'calmWater',
  amor: 'forest',
  fé: 'mountains',
  força: 'mountains',
  gratidão: 'ocean',
  sabedoria: 'mountains',
  pastor: 'path',
  natureza: 'forest',
  água: 'calmWater',
  céu: 'starry',
  caminho: 'path',
  luz: 'dawn'
};

export const semanticThemes = [
  { name: 'alegria', keywords: ['alegria', 'alegre', 'júbilo', 'feliz', 'contentamento', 'regozijo', 'coração alegre'], category: 'forest' },
  { name: 'paz', keywords: ['paz', 'calma', 'descanso', 'tranquilidade', 'serenidade', 'sossego'], category: 'calmWater' },
  { name: 'amor', keywords: ['amor', 'bondade', 'misericórdia', 'compaixão'], category: 'forest' },
  { name: 'fé', keywords: ['fé', 'crer', 'confiar', 'esperança', 'perseverança'], category: 'mountains' },
  { name: 'força', keywords: ['força', 'coragem', 'fortaleza', 'poder', 'vencer'], category: 'mountains' },
  { name: 'gratidão', keywords: ['gratidão', 'agradecer', 'bênção', 'dádiva', 'louvor'], category: 'ocean' },
  { name: 'sabedoria', keywords: ['sabedoria', 'entendimento', 'conhecimento', 'discernimento'], category: 'mountains' },
  { name: 'pastor', keywords: ['pastor', 'rebanho', 'ovelha', 'ovelhas', 'apascentar'], category: 'path' },
  { name: 'natureza', keywords: ['natureza', 'criação', 'campo', 'flor', 'flores', 'árvore', 'floresta', 'jardim'], category: 'forest' },
  { name: 'água', keywords: ['água', 'águas', 'rio', 'rios', 'mar', 'mares', 'fonte', 'cachoeira', 'oceano'], category: 'calmWater' },
  { name: 'céu', keywords: ['céu', 'céus', 'nuvem', 'nuvens', 'estrelas', 'estrela', 'firmamento'], category: 'starry' },
  { name: 'caminho', keywords: ['caminho', 'caminhos', 'estrada', 'vereda', 'trilha', 'senda'], category: 'path' },
  { name: 'luz', keywords: ['luz', 'lâmpada', 'brilho', 'resplendor', 'amanhecer', 'alvorada'], category: 'dawn' }
];

export const contemplativeImages = [
  ...baseImages.dawn,
  ...baseImages.mountains,
  ...baseImages.calmWater,
  ...baseImages.ocean,
  ...baseImages.forest,
  ...baseImages.starry,
  ...baseImages.path
];

export function classifyVerseTheme(verseText) {
  const lower = verseText.toLowerCase();
  let best = { theme: null, confidence: 0 };
  for (const theme of semanticThemes) {
    let matches = 0;
    for (const kw of theme.keywords) {
      if (lower.includes(kw)) matches++;
    }
    if (matches > 0) {
      const conf = Math.min(0.95, matches / 3);
      if (conf > best.confidence) {
        best = { theme: theme.name, confidence: conf };
      }
    }
  }
  if (!best.theme) return { theme: 'natureza', confidence: 0.6 };
  return best;
}

export function getImageForVerse(verseText) {
  const classification = classifyVerseTheme(verseText);
  const category = themeToCategory[classification.theme] || 'forest';
  const imagesArray = baseImages[category] || baseImages.forest;
  const rand = Math.floor(Math.random() * imagesArray.length);
  return imagesArray[rand];
}
