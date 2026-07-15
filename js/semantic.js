// js/semantic.js
// Classifica o tema de um versículo e escolhe uma busca de imagem
// CONCEITUAL (não apenas "paisagem genérica") para contextualizar o
// fundo com o conteúdo do versículo.

// Cada tema tem várias buscas possíveis (variedade) e são mais
// conceituais/simbólicas do que "mar", "floresta" genéricos — ex:
// "coragem" busca tempestade/farol, não só montanha.
export const THEME_QUERIES = {
  paz:        ['calm still lake reflection serene', 'quiet misty morning nature', 'zen minimalist peaceful scene'],
  alegria:    ['vibrant sunrise colorful sky', 'blooming flowers spring color', 'golden light joyful morning'],
  amor:       ['warm golden light heart nature', 'sunset silhouette embrace warmth', 'soft warm glow intimate light'],
  fe:         ['single candle light in darkness', 'lighthouse beacon in storm', 'narrow path through fog faith'],
  forca:      ['mountain summit strength sunrise', 'rock standing against powerful waves', 'ancient tree roots strength'],
  esperanca:  ['sunrise new day horizon hope', 'single green sprout growing light', 'light breaking through dark clouds'],
  confianca:  ['compass guidance direction journey', 'steady bridge path forward trust', 'footprints path trust sunrise'],
  gratidao:   ['golden autumn harvest abundance', 'warm sunset field gratitude', 'open hands sunlight warmth'],
  sabedoria:  ['open old book warm light', 'ancient library candlelight knowledge', 'owl night forest wisdom'],
  conforto:   ['warm blanket soft light comfort', 'gentle rain window cozy', 'soft candlelight quiet room'],
  coragem:    ['climber mountain peak courage storm', 'ship sailing through storm light', 'lone tree standing against wind'],
  superacao:  ['sunrise after storm clearing sky', 'mountain climb steep path summit', 'seed breaking through soil growth'],
  cura:       ['soft healing light through leaves', 'gentle sunrise calm water healing', 'new bloom after rain renewal'],
  perdao:     ['sunrise clearing fog release', 'open hands releasing light dove', 'calm water ripples letting go'],
  oracao:     ['quiet chapel candlelight prayer', 'soft light through window prayer', 'still quiet dawn solitude'],
  descanso:   ['peaceful hammock quiet nature rest', 'calm sunset stillness rest', 'soft still water sunset quiet'],
  pastor:     ['shepherd sheep field pastoral golden', 'flock sheep meadow peaceful morning'],
  natureza:   ['lush forest sunlight rays', 'green valley mist morning nature', 'wildflower meadow soft light'],
  agua:       ['calm ocean waves golden light', 'waterfall serene forest nature', 'river flowing peaceful forest'],
  ceu:        ['starry night sky milky way', 'dramatic clouds sunset sky', 'aurora borealis night sky'],
  caminho:    ['path forest sunlight journey', 'winding road horizon travel', 'mountain trail path light'],
  luz:        ['sunrise light rays through clouds', 'golden hour warm glow light', 'sunlight through window rays']
};

// Palavras-chave (pt-BR) usadas apenas quando o versículo não tem
// tema definido (ex.: itens antigos de histórico/favoritos).
export const semanticThemes = [
  { name: 'alegria',   keywords: ['alegria', 'alegre', 'júbilo', 'feliz', 'contentamento', 'regozijo', 'regozijai'] },
  { name: 'paz',       keywords: ['paz', 'calma', 'descanso', 'tranquilidade', 'serenidade', 'sossego'] },
  { name: 'amor',      keywords: ['amor', 'amou', 'bondade', 'misericórdia', 'compaixão'] },
  { name: 'fe',        keywords: ['fé', 'crer', 'cria', 'crê', 'crede'] },
  { name: 'forca',     keywords: ['força', 'fortalece', 'fortaleza', 'poder', 'fortalecei'] },
  { name: 'esperanca', keywords: ['esperança', 'espera', 'esperam', 'renovam', 'novo', 'nova criatura'] },
  { name: 'confianca', keywords: ['confia', 'confiança', 'confiai', 'entendimento'] },
  { name: 'gratidao',  keywords: ['gratidão', 'agradecer', 'bênção', 'dádiva', 'louvor', 'graças'] },
  { name: 'sabedoria', keywords: ['sabedoria', 'entendimento', 'conhecimento', 'discernimento', 'sábio'] },
  { name: 'conforto',  keywords: ['conforto', 'consolo', 'consolados', 'cansados', 'aliviarei', 'quebrantado'] },
  { name: 'coragem',   keywords: ['coragem', 'corajoso', 'temas', 'temerei', 'espantes', 'covardia'] },
  { name: 'superacao', keywords: ['perseverança', 'perseverar', 'vencer', 'vitória', 'provações', 'tribulação'] },
  { name: 'cura',      keywords: ['sara', 'cura', 'curar', 'ferida', 'feridas'] },
  { name: 'perdao',    keywords: ['perdoar', 'perdão', 'purificar', 'pecados'] },
  { name: 'oracao',    keywords: ['orai', 'oração', 'orar', 'buscai', 'invocai'] },
  { name: 'descanso',  keywords: ['descansará', 'descanso', 'deito', 'adormeço', 'jugo', 'fardo'] },
  { name: 'pastor',    keywords: ['pastor', 'rebanho', 'ovelha', 'ovelhas', 'apascentar'] },
  { name: 'natureza',  keywords: ['natureza', 'criação', 'campo', 'flor', 'flores', 'árvore', 'floresta', 'jardim'] },
  { name: 'agua',      keywords: ['água', 'águas', 'rio', 'rios', 'mar', 'mares', 'fonte', 'cachoeira', 'oceano'] },
  { name: 'ceu',       keywords: ['céu', 'céus', 'nuvem', 'nuvens', 'estrelas', 'estrela', 'firmamento'] },
  { name: 'caminho',   keywords: ['caminho', 'caminhos', 'estrada', 'vereda', 'trilha', 'senda'] },
  { name: 'luz',       keywords: ['luz', 'lâmpada', 'brilho', 'resplandece', 'amanhecer', 'alvorada'] }
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
      const conf = Math.min(0.95, matches / 2);
      if (conf > best.confidence) {
        best = { theme: theme.name, confidence: conf };
      }
    }
  }
  if (!best.theme) return { theme: 'natureza', confidence: 0.5 };
  return best;
}

// Recebe o objeto do versículo (pode já ter `theme` do acervo curado)
// e devolve { theme, query } para buscar uma imagem contextualizada.
export function getImageQueryForVerse(verse) {
  const theme = (verse && verse.theme) || classifyVerseTheme(verse && verse.text ? verse.text : '').theme;
  const queries = THEME_QUERIES[theme] || THEME_QUERIES.natureza;
  const query = queries[Math.floor(Math.random() * queries.length)];
  return { theme, query };
}
