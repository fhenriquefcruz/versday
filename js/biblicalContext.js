// js/biblicalContext.js
// Enriquece a intenção visual com contexto bíblico local e resumos curados.
// Não substitui exegese: serve para evitar leituras visuais isoladas e óbvias demais.

import { FALLBACK_VERSES } from './fallbackVerses.js';

const CONTEXT_HINTS = [
  { book:'sl', chapter:23, summary:'Poema pastoral sobre cuidado, condução, provisão, descanso, travessia de perigo e segurança sob a presença de Deus.', narrativeSituation:'metáfora pastoral de condução e proteção', characters:['salmista','Senhor como pastor'], visualHint:'pastoral care protection quiet field sheep when appropriate' },
  { book:'sl', chapter:91, summary:'Poema de confiança que usa abrigo, sombra, proteção e perigo como imagens de segurança em Deus.', narrativeSituation:'proteção em meio a ameaças', characters:['salmista','Deus'], visualHint:'shelter protection under threat restrained atmosphere' },
  { book:'sl', chapter:121, summary:'Cântico de peregrinação em que os montes introduzem a pergunta pelo socorro; a resposta desloca a confiança da paisagem para o Criador.', narrativeSituation:'peregrino busca socorro e proteção', characters:['peregrino','Senhor'], visualHint:'pilgrimage help protection; mountains are context, not the answer' },
  { book:'mt', chapter:5, summary:'Ensino público de Jesus no Sermão do Monte sobre caráter, justiça, testemunho e vida no Reino.', narrativeSituation:'Jesus ensina discípulos e multidão', characters:['Jesus','discípulos','multidão'], visualHint:'teaching ethical life community restrained human context' },
  { book:'mt', chapter:6, summary:'Continuação do Sermão do Monte; Jesus ensina confiança, prioridade do Reino e liberdade da ansiedade usando exemplos cotidianos da criação.', narrativeSituation:'ensino sobre confiança e ansiedade', characters:['Jesus','discípulos'], visualHint:'ordinary creation birds field trust without decorative religiosity' },
  { book:'mt', chapter:8, summary:'Narrativa de Jesus e os discípulos atravessando o mar, com perigo real durante uma tempestade e medo diante da ameaça.', narrativeSituation:'tempestade literal durante travessia de barco', characters:['Jesus','discípulos'], visualHint:'literal rough sea small boat danger dramatic restrained weather' },
  { book:'mc', chapter:4, summary:'Narrativa de travessia do mar em que uma tempestade literal ameaça a embarcação e desperta medo nos discípulos.', narrativeSituation:'tempestade literal durante travessia de barco', characters:['Jesus','discípulos'], visualHint:'literal storm boat vulnerable figures rough water' },
  { book:'lc', chapter:8, summary:'Narrativa de travessia do lago com tempestade literal, embarcação e medo dos discípulos.', narrativeSituation:'tempestade literal durante travessia de barco', characters:['Jesus','discípulos'], visualHint:'literal storm boat vulnerable figures rough water' },
  { book:'jo', chapter:1, summary:'Prólogo que apresenta luz e trevas como linguagem teológica de vida, revelação e resistência à escuridão, não como descrição de um amanhecer específico.', narrativeSituation:'prólogo teológico e poético', characters:['Verbo','Deus'], visualHint:'symbolic light emerging from darkness, not generic sunrise' },
  { book:'jo', chapter:10, summary:'Discurso de Jesus com linguagem pastoral sobre cuidado, voz, proteção, vida e relação entre pastor e ovelhas.', narrativeSituation:'metáfora pastoral usada no ensino de Jesus', characters:['Jesus'], visualHint:'pastoral relationship care protection sheep when semantically central' },
  { book:'jo', chapter:11, summary:'Narrativa de luto pela morte de Lázaro e afirmação de Jesus sobre ressurreição e vida antes do encontro junto ao túmulo.', narrativeSituation:'luto, morte e esperança de ressurreição', characters:['Jesus','Marta','Maria','Lázaro'], visualHint:'grief quiet human presence hope without cheerful contradiction' },
  { book:'jo', chapter:15, summary:'Discurso de despedida em que videira e ramos funcionam como metáfora orgânica para permanência, dependência e fruto.', narrativeSituation:'ensino metafórico de Jesus aos discípulos', characters:['Jesus','discípulos'], visualHint:'vine branches organic connection dependence natural light' },
  { book:'is', chapter:43, summary:'Oráculo de restauração e proteção; águas, rios e fogo funcionam como imagens de perigos atravessados com a presença de Deus.', narrativeSituation:'promessa de presença durante adversidade', characters:['Senhor','Israel'], visualHint:'adversity passage through water danger presence protection' },
  { book:'1co', chapter:13, summary:'Argumento sobre a primazia do amor no contexto do uso de dons e da vida comunitária cristã.', narrativeSituation:'ensino sobre amor e maturidade comunitária', characters:['Paulo','comunidade de Corinto'], visualHint:'mature human care community authentic relationship not romantic cliché' },
  { book:'ap', chapter:21, summary:'Visão escatológica de nova criação e fim do luto, morte e dor; atmosfera de consolação após sofrimento.', narrativeSituation:'visão de renovação final e consolação', characters:['vidente','Deus','povo'], visualHint:'consolation after suffering renewal restrained luminous atmosphere' }
];

function numericVerse(value) {
  const n = Number.parseInt(String(value || '').split('-')[0], 10);
  return Number.isFinite(n) ? n : 0;
}

function nearbyVerses(verse) {
  const book = String(verse?.book || '').toLowerCase();
  const chapter = Number(verse?.chapter || 0);
  const current = numericVerse(verse?.verse);

  return FALLBACK_VERSES
    .filter(item =>
      item.book === book &&
      Number(item.chapter) === chapter &&
      item.reference !== verse?.reference &&
      Math.abs(numericVerse(item.verse) - current) <= 3
    )
    .sort((a,b) => numericVerse(a.verse) - numericVerse(b.verse))
    .slice(0, 6);
}

export function resolveBiblicalContext(verse = {}) {
  const explicit = String(verse.context || verse.surroundingContext || '').trim();
  const match = CONTEXT_HINTS.find(item =>
    item.book === String(verse.book || '').toLowerCase() &&
    item.chapter === Number(verse.chapter)
  );
  const nearby = nearbyVerses(verse);
  const nearbyText = nearby.map(item => item.text).join(' ');

  const pieces = [explicit, match?.summary || '', nearbyText].filter(Boolean);

  return {
    text: pieces.join(' ').trim(),
    nearbyVerses: nearby,
    narrativeSituation: verse.narrativeSituation || match?.narrativeSituation || null,
    characters: Array.isArray(verse.characters) && verse.characters.length ? verse.characters : (match?.characters || []),
    visualHint: match?.visualHint || '',
    source: explicit ? 'verse+local' : match ? 'curated-context+local' : nearby.length ? 'local-neighbors' : 'genre-only'
  };
}

export function enrichVisualIntentWithContext(intent, verse = {}) {
  const context = resolveBiblicalContext(verse);
  return {
    ...intent,
    biblicalContext: {
      ...(intent.biblicalContext || {}),
      surroundingContext: context.text,
      nearbyVerses: context.nearbyVerses.map(item => ({
        reference:item.reference,
        text:item.text
      })),
      narrativeSituation: context.narrativeSituation,
      characters: context.characters,
      contextSource: context.source,
      visualHint: context.visualHint
    }
  };
}

export function enrichQueriesWithContext(queries, intent) {
  const hint = String(intent?.biblicalContext?.visualHint || '').trim();
  if (!hint) return queries;
  return queries.map(item => ({
    ...item,
    query: (String(item.query || '') + ' ' + hint).replace(/\s+/g, ' ').trim()
  }));
}
