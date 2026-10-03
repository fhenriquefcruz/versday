import { resolveBiblicalContext } from './biblical-context.js';

// VersDay Visual Semantic Intelligence v1
// Interpreta a passagem antes de qualquer decisão visual.

const BOOK_GENRES = {
  gn:'narrativa', ex:'narrativa', lv:'lei', nm:'narrativa', dt:'lei', js:'narrativa', jz:'narrativa', rt:'narrativa',
  '1sm':'narrativa','2sm':'narrativa','1rs':'narrativa','2rs':'narrativa','1cr':'narrativa','2cr':'narrativa',ed:'narrativa',ne:'narrativa',et:'narrativa',
  'jó':'sabedoria', sl:'poesia', pv:'sabedoria', ec:'sabedoria', ct:'poesia',
  is:'profecia', jr:'profecia', lm:'poesia', ez:'profecia', dn:'profecia', os:'profecia', jl:'profecia', am:'profecia', ob:'profecia', jn:'narrativa', mq:'profecia', na:'profecia', hc:'profecia', sf:'profecia', ag:'profecia', zc:'profecia', ml:'profecia',
  mt:'evangelho', mc:'evangelho', lc:'evangelho', jo:'evangelho', atos:'narrativa',
  rm:'epistola','1co':'epistola','2co':'epistola',gl:'epistola',ef:'epistola',fp:'epistola',cl:'epistola','1ts':'epistola','2ts':'epistola','1tm':'epistola','2tm':'epistola',tt:'epistola',fm:'epistola',hb:'epistola',tg:'epistola','1pe':'epistola','2pe':'epistola','1jo':'epistola','2jo':'epistola','3jo':'epistola',jd:'epistola',ap:'apocaliptica'
};

export const THEME_PROFILES = {
  paz: {
    label: 'paz e serenidade',
    moods: ['sereno','silencioso','seguro','contemplativo'],
    scenes: ['quiet still water with generous negative space','soft natural morning interior','minimal calm landscape'],
    avoid: ['celebration','crowd','dramatic action','party','neon'],
    palette: ['#0b1d2b','#38586a','#aab9b6']
  },
  alegria: {
    label: 'alegria sóbria e gratidão pela vida',
    moods: ['luminoso','vivo','acolhedor'],
    scenes: ['warm natural morning light','subtle joyful human moment candid editorial','spring light with restrained color'],
    avoid: ['party','confetti','staged smile','advertising pose'],
    palette: ['#36210f','#b67a2d','#e8c98e']
  },
  amor: {
    label: 'amor, cuidado e presença',
    moods: ['íntimo','humano','acolhedor','gentil'],
    scenes: ['authentic human connection quiet editorial photography','hands offering care without posing','warm domestic light with human presence'],
    avoid: ['heart symbol','romantic cliché','wedding stock pose','sunset couple silhouette'],
    palette: ['#2c1720','#8e514d','#d9b28e']
  },
  fe: {
    label: 'fé e confiança no invisível',
    moods: ['contemplativo','profundo','esperançoso'],
    scenes: ['subtle light emerging from shadow minimal editorial','quiet threshold between darkness and light','solitary contemplative space with restrained atmosphere'],
    avoid: ['cross by default','open bible by default','hands praying by default','church by default'],
    palette: ['#101727','#243c5a','#c7a466']
  },
  forca: {
    label: 'força sustentada em meio à pressão',
    moods: ['firme','sóbrio','resiliente'],
    scenes: ['resilient natural form against weather editorial','rock and moving water restrained cinematic','strong rooted tree in natural wind'],
    avoid: ['bodybuilder','victory pose','extreme sports cliché'],
    palette: ['#11191d','#3f4e4d','#aa8d62']
  },
  esperanca: {
    label: 'esperança que surge sem negar a dificuldade',
    moods: ['esperançoso','sereno','progressivo'],
    scenes: ['distant soft light after dark weather','new growth in restrained natural light','opening in clouds with subtle horizon'],
    avoid: ['generic sunrise','rainbow cliché','celebration'],
    palette: ['#111c2c','#33566f','#c69d56']
  },
  confianca: {
    label: 'confiança, direção e segurança',
    moods: ['estável','encorajador','sereno'],
    scenes: ['safe passage through challenging environment','quiet path with clear direction and negative space','shelter or refuge implied without religious cliché'],
    avoid: ['random mountain summit','compass cliché','victory pose'],
    palette: ['#0f1b21','#334f4b','#b3935f']
  },
  gratidao: {
    label: 'gratidão e reconhecimento',
    moods: ['calmo','quente','humilde'],
    scenes: ['quiet abundance in natural light editorial','simple table or harvest detail natural','open landscape with warm restrained light'],
    avoid: ['gift box','party','hands staged toward camera'],
    palette: ['#2b2117','#7b5b36','#c5a56d']
  },
  sabedoria: {
    label: 'discernimento, reflexão e maturidade',
    moods: ['sóbrio','reflexivo','claro'],
    scenes: ['quiet study light minimal editorial','measured path with deliberate composition','architectural shadow and light contemplative'],
    avoid: ['owl cliché','graduation','random old book'],
    palette: ['#151a1c','#454d4c','#a38b64']
  },
  conforto: {
    label: 'acolhimento em meio à fragilidade',
    moods: ['acolhedor','silencioso','terno'],
    scenes: ['quiet shelter with soft window light','gentle rain seen from safe interior','subtle human comfort without staged posing'],
    avoid: ['celebration','bright beach','laughing crowd'],
    palette: ['#111a22','#455866','#a99a81']
  },
  coragem: {
    label: 'coragem diante de risco ou adversidade',
    moods: ['firme','dramático-contido','resiliente'],
    scenes: ['single figure facing difficult environment editorial','storm clearing with restrained light','narrow route through imposing landscape'],
    avoid: ['summit victory pose','sports advertising','hero cliché'],
    palette: ['#101821','#34424e','#9b7c55']
  },
  superacao: {
    label: 'perseverança através da dificuldade',
    moods: ['resiliente','progressivo','sóbrio'],
    scenes: ['difficult path continuing toward light','weathered landscape after storm','subtle signs of renewal after adversity'],
    avoid: ['finish line cliché','raised fists','motivational poster'],
    palette: ['#12171b','#49534f','#9a7d53']
  },
  cura: {
    label: 'cura, restauração e renovação',
    moods: ['gentil','renovador','silencioso'],
    scenes: ['new leaves after rain close detail editorial','soft natural light on recovering landscape','quiet water and organic renewal'],
    avoid: ['hospital stock','medical pose','miracle cliché'],
    palette: ['#10201b','#436e5e','#a9bd8f']
  },
  perdao: {
    label: 'perdão, liberação e reconciliação',
    moods: ['humilde','terno','aliviado'],
    scenes: ['subtle human reconciliation authentic editorial','open quiet space suggesting release','soft light entering a restrained interior'],
    avoid: ['dove cliché','heart symbol','sunrise by default','staged embrace'],
    palette: ['#1c1a21','#665a69','#bca98f']
  },
  oracao: {
    label: 'oração, atenção e interioridade',
    moods: ['silencioso','íntimo','contemplativo'],
    scenes: ['quiet room with soft natural window light','solitary contemplative place minimal','early dawn interior with negative space'],
    avoid: ['hands praying by default','church by default','open bible by default'],
    palette: ['#111923','#364657','#9e8a6c']
  },
  descanso: {
    label: 'descanso e desaceleração',
    moods: ['tranquilo','silencioso','protegido'],
    scenes: ['still water at dusk with negative space','quiet bedroom or interior natural light editorial','soft pastoral landscape at rest'],
    avoid: ['hammock cliché','resort','tropical beach'],
    palette: ['#101b24','#3c5867','#9aabac']
  },
  pastor: {
    label: 'pastoreio, cuidado e condução',
    moods: ['pastoral','sereno','protetor'],
    scenes: ['sheep grazing in open pasture natural light','pastoral field with distant flock editorial','quiet meadow with shepherding atmosphere'],
    avoid: ['cross','church interior','generic bible'],
    palette: ['#1d281d','#5c7047','#c1ad72']
  },
  natureza: {
    label: 'criação e natureza',
    moods: ['orgânico','amplo','contemplativo'],
    scenes: ['natural landscape with clean composition and negative space','forest light without fantasy grading','organic landscape restrained editorial'],
    avoid: ['oversaturated HDR','fantasy wallpaper'],
    palette: ['#102018','#3d6248','#afaa76']
  },
  agua: {
    label: 'água como elemento narrativo',
    moods: ['fluido','profundo','contemplativo'],
    scenes: ['natural river or water surface editorial','moving water in restrained natural light','shoreline or river with clean composition'],
    avoid: ['tropical resort','pool','advertising'],
    palette: ['#0a1d29','#32617a','#9db8be']
  },
  ceu: {
    label: 'céu e vastidão',
    moods: ['amplo','silencioso','contemplativo'],
    scenes: ['vast natural sky restrained photography','cloud layers with generous negative space','night sky without fantasy processing'],
    avoid: ['extreme HDR','aurora cliché unless context fits'],
    palette: ['#0b1222','#263b5c','#8298b4']
  },
  caminho: {
    label: 'caminho, direção e jornada',
    moods: ['progressivo','reflexivo','sereno'],
    scenes: ['quiet path or road with clear visual direction','narrow trail disappearing into distance','clean rural road with generous negative space'],
    avoid: ['busy highway','car advertising','travel influencer pose'],
    palette: ['#182018','#53604b','#a68d63']
  },
  luz: {
    label: 'luz como revelação ou contraste',
    moods: ['luminoso','profundo','esperançoso'],
    scenes: ['soft natural light entering shadow','controlled beam of light in dark space','subtle light and shadow editorial composition'],
    avoid: ['generic sunrise','lens flare overload','religious ray cliché'],
    palette: ['#13141a','#554a38','#c3a467']
  }
};

const THEME_KEYWORDS = [
  ['paz',['paz','tranquil','sossego','quietude']], ['alegria',['alegr','regoz','jubilo','feliz']],
  ['amor',['amor','amou','misericord','compaix','bondade']], ['fe',['fé','fe ','crê','crer','crede','fiel']],
  ['forca',['força','fortale','fortaleza','poder']], ['esperanca',['esperan','renova','novo','nova criatura']],
  ['confianca',['confia','confiança','sustem','sustém','guardará','dirige os passos']], ['gratidao',['gratid','graças','agradec','bendito']],
  ['sabedoria',['sabedoria','entendimento','discern','sábio','prud']], ['conforto',['consolo','consol','cansad','alivia','quebrant','lágrima']],
  ['coragem',['coragem','não temas','não temerei','bom ânimo','covardia']], ['superacao',['persever','tribulação','provaç','venc','desfalec']],
  ['cura',['cura','sara','ferida','restaura']], ['perdao',['perd','purifica','pecado']], ['oracao',['orai','oração','orar','pedi','invoc']],
  ['descanso',['descans','deito','adormeço','jugo','fardo']], ['pastor',['pastor','ovelha','rebanho','apascent']],
  ['agua',['água','aguas','águas','rio','rios','mar','fonte']], ['ceu',['céu','céus','firmamento','estrela']], ['caminho',['caminho','vereda','trilha','passos']], ['luz',['luz','lâmpada','resplande','trevas']]
];

const LITERAL_RULES = [
  { id:'sheep', re:/\b(pastor|ovelhas?|rebanho|apascent)\b/i, scene:'sheep grazing in open pasture', tags:['sheep','pasture','meadow'] },
  { id:'water', re:/\b(águas?|rios?|mar|fonte)\b/i, scene:'natural water environment', tags:['water','river','sea'] },
  { id:'path', re:/\b(caminho|vereda|trilha|passos?)\b/i, scene:'path or road leading through landscape', tags:['path','road','trail'] },
  { id:'vine', re:/\b(videira|vinha|ramos?)\b/i, scene:'vine branches in natural light', tags:['vine','branches','plant'] },
  { id:'seed', re:/\b(semeia|semeador|semente|ceifar|ceifaremos)\b/i, scene:'seed sowing or field detail', tags:['seed','field','growth'] },
  { id:'bird', re:/\b(aves?|pássaros?)\b/i, scene:'birds in natural open sky', tags:['bird','sky','nature'] },
  { id:'mountain', re:/\b(montes?|montanhas?|alturas?)\b/i, scene:'mountain landscape with restrained atmosphere', tags:['mountain','landscape'] },
  { id:'bread', re:/\b(pão)\b/i, scene:'simple bread in natural editorial light', tags:['bread','table','food'] },
  { id:'light', re:/\b(luz|lâmpada|resplandece|trevas)\b/i, scene:'light interacting with shadow', tags:['light','shadow'] },
  { id:'tree', re:/\b(árvore|arvore)\b/i, scene:'single organic tree detail', tags:['tree','nature'] },
  { id:'boat', re:/\b(barco|navio|embarcação|embarcacao)\b/i, scene:'small boat in a natural water environment', tags:['boat','water','sea'] },
  { id:'storm', re:/\b(tempestade|tormenta|vendaval|vento forte|ondas? revoltas?)\b/i, scene:'stormy natural atmosphere with restrained drama', tags:['storm','weather','waves'] },
  { id:'desert', re:/\b(deserto|ermo)\b/i, scene:'desert landscape with austere natural light', tags:['desert','sand','solitude'] },
  { id:'city', re:/\b(cidade|muralhas?|portas? da cidade)\b/i, scene:'ancient city or urban silhouette with restrained atmosphere', tags:['city','architecture'] },
  { id:'dawn', re:/\b(amanhecer|alvorada|romper do dia)\b/i, scene:'subtle dawn light without motivational cliché', tags:['dawn','morning','light'] }
];

const ABSTRACT_FIRST_THEMES = new Set(['fe','perdao','sabedoria','gratidao']);

function normalize(value='') {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}

function inferTheme(verse) {
  if (verse?.theme && THEME_PROFILES[verse.theme]) return { theme: verse.theme, confidence: 0.78, source:'curated-theme' };
  const text = normalize(verse?.text || '');
  let best = { theme:'fe', confidence:0.35, source:'fallback' };
  for (const [theme, words] of THEME_KEYWORDS) {
    const hits = words.filter(w => text.includes(normalize(w))).length;
    if (hits > 0) {
      const score = Math.min(0.92, 0.48 + hits * 0.16);
      if (score > best.confidence) best = { theme, confidence:score, source:'text' };
    }
  }
  return best;
}

function inferEmotion(text, profile) {
  const n = normalize(text);
  const emotion = new Set(profile.moods || []);
  if (/angust|aflic|tribul|chor|lagrima|morte|dor|ferida/.test(n)) emotion.add('dolorido');
  if (/nao temas|coragem|venci|fortale|sustem|socorro/.test(n)) emotion.add('encorajador');
  if (/alegr|regoz|gracas|bendito/.test(n)) emotion.add('luminoso');
  if (/descans|paz|quiet|silenc/.test(n)) emotion.add('sereno');
  return [...emotion].slice(0,5);
}

function inferLiteralElements(text) {
  return LITERAL_RULES.filter(rule => rule.re.test(text)).map(rule => ({
    id: rule.id, scene: rule.scene, tags: rule.tags
  }));
}

function representationMode(theme, literalElements, text) {
  const n = normalize(text);
  if (!literalElements.length) {
    if (ABSTRACT_FIRST_THEMES.has(theme)) return 'abstract';
    return 'conceptual';
  }
  const concreteIds = new Set(literalElements.map(x=>x.id));
  if (concreteIds.has('sheep') || concreteIds.has('bird') || concreteIds.has('vine') || concreteIds.has('seed') || concreteIds.has('desert') || concreteIds.has('city')) return 'literal';
  if (concreteIds.has('boat') && concreteIds.has('storm')) return 'literal';
  if (theme === 'agua' || theme === 'pastor' || theme === 'natureza' || theme === 'ceu') return 'literal';
  if (concreteIds.has('light') || concreteIds.has('path') || concreteIds.has('mountain') || concreteIds.has('storm') || concreteIds.has('dawn') || /mundo|vida|coracao|fé|fe\b|justiça|justica/.test(n)) return 'hybrid';
  return 'hybrid';
}

function buildVisualIntentDescription(theme, mode, elements, profile) {
  const physical = elements.length ? ` Elementos visuais pertinentes: ${elements.map(e=>e.id).join(', ')}.` : '';
  return `${profile.label}. Representação ${mode}. A imagem deve sustentar o sentido da passagem sem transformar conceitos espirituais em clichês.${physical}`;
}

export function analyzeVerseVisualIntent(verse, surroundingContext = {}) {
  const text = String(verse?.text || '').trim();
  const resolvedContext = resolveBiblicalContext(verse || {});
  const context = surroundingContext?.text ? surroundingContext : resolvedContext;
  const themeInfo = inferTheme(verse);
  const profile = THEME_PROFILES[themeInfo.theme] || THEME_PROFILES.fe;
  const literalElements = inferLiteralElements(text);
  const mode = verse?.visualMode || representationMode(themeInfo.theme, literalElements, text);
  const genre = BOOK_GENRES[verse?.book] || 'biblico';
  const emotions = inferEmotion(text, profile);

  const literalScenes = literalElements.map(e=>e.scene);
  const preferredScenes = [...literalScenes, ...profile.scenes].filter(Boolean).slice(0,5);
  const confidence = Math.min(0.98, themeInfo.confidence + (literalElements.length ? 0.08 : 0));

  return {
    verseReference: verse?.reference || `${verse?.book || ''} ${verse?.chapter || ''}:${verse?.verse || ''}`.trim(),
    passageText: text,
    biblicalContext: {
      book: verse?.book || null,
      chapter: verse?.chapter || null,
      literaryGenre: genre,
      surroundingContext: context.text || '',
      narrativeSituation: context.narrativeSituation || verse?.narrativeSituation || null,
      characters: context.characters || verse?.characters || [],
      contextSource: context.source || 'runtime'
    },
    semantic: {
      primaryTheme: themeInfo.theme,
      primaryThemeLabel: profile.label,
      secondaryThemes: verse?.secondaryThemes || [],
      messageIntent: profile.label,
      emotionalTone: emotions,
      atmosphere: emotions,
      source: themeInfo.source
    },
    representation: {
      mode,
      literalElements: literalElements.map(e=>e.id),
      symbolicElements: verse?.symbolicElements || [],
      metaphors: literalElements.filter(e=>['light','path','water','mountain'].includes(e.id)).map(e=>e.id)
    },
    visualIntent: {
      description: buildVisualIntentDescription(themeInfo.theme, mode, literalElements, profile),
      preferredScenes,
      acceptableScenes: profile.scenes.slice(0,3),
      undesirableScenes: profile.avoid,
      negativeConcepts: [...profile.avoid, 'cross by default','open bible by default','hands praying by default','church by default','watermark','logo','embedded text','advertising','cheap stock photography']
    },
    photography: {
      mood: emotions,
      lighting: ['natural light','restrained contrast','controlled highlights'],
      environment: literalElements.flatMap(e=>e.tags).slice(0,6),
      composition: ['clean composition','negative space','editorial photography','subtle cinematic depth'],
      paletteHints: profile.palette,
      humanPresence: ['amor','conforto','perdao','coragem'].includes(themeInfo.theme) ? 'optional' : 'avoid-unless-meaningful'
    },
    textComposition: {
      preferredSafeAreas: ['center','upper-left','lower-left','upper-right'],
      desiredContrast: 'adaptive',
      maxVisualComplexity: 0.62
    },
    confidence
  };
}

function compact(parts) {
  return [...new Set(parts.flatMap(x => Array.isArray(x) ? x : [x]).filter(Boolean))].join(' ');
}

export function buildVisualQueries(intent) {
  const style = 'editorial cinematic contemplative natural light clean composition negative space premium photography';
  const mood = (intent?.photography?.mood || []).slice(0,2).join(' ');
  const scenes = intent?.visualIntent?.preferredScenes || [];
  const mode = intent?.representation?.mode || 'conceptual';
  const theme = intent?.semantic?.primaryThemeLabel || '';

  const queries = [];
  if (scenes[0]) queries.push(compact([scenes[0], mood, style]));
  if (scenes[1]) queries.push(compact([scenes[1], mood, style]));
  if (mode !== 'literal') queries.push(compact([theme, mood, 'symbolic understated editorial scene', style]));
  if (mode === 'literal' && scenes[2]) queries.push(compact([scenes[2], 'documentary natural', style]));

  return [...new Set(queries)]
    .map(q => q.replace(/\s+/g,' ').trim())
    .filter(q => q.split(' ').length >= 6)
    .slice(0,4);
}

export function semanticTokens(intent) {
  return normalize([
    intent?.semantic?.primaryTheme,
    intent?.semantic?.primaryThemeLabel,
    ...(intent?.semantic?.secondaryThemes || []),
    ...(intent?.representation?.literalElements || []),
    ...(intent?.representation?.symbolicElements || []),
    ...(intent?.photography?.mood || []),
    ...(intent?.photography?.environment || [])
  ].join(' ')).split(/[^a-z0-9]+/).filter(x=>x.length > 2);
}
