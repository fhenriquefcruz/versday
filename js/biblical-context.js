// Contexto bíblico resumido para passagens em que uma leitura isolada pode distorcer a intenção visual.
// São resumos semânticos, não uma segunda tradução bíblica.

const CONTEXT_HINTS = [
  { book:'sl', chapter:23, summary:'Poema pastoral sobre cuidado, condução, provisão, descanso, travessia de perigo e segurança sob a presença de Deus.', narrativeSituation:'metáfora pastoral de condução e proteção', characters:['salmista','Senhor como pastor'] },
  { book:'sl', chapter:91, summary:'Poema de confiança que usa abrigo, sombra, proteção e perigo como imagens de segurança em Deus.', narrativeSituation:'proteção em meio a ameaças', characters:['salmista','Deus'] },
  { book:'sl', chapter:121, summary:'Cântico de peregrinação em que os montes introduzem a pergunta pelo socorro; a resposta desloca a confiança da paisagem para o Criador.', narrativeSituation:'peregrino busca socorro e proteção', characters:['peregrino','Senhor'] },
  { book:'mt', chapter:5, summary:'Ensino público de Jesus no Sermão do Monte sobre caráter, justiça, testemunho e vida no Reino.', narrativeSituation:'Jesus ensina discípulos e multidão', characters:['Jesus','discípulos','multidão'] },
  { book:'mt', chapter:6, summary:'Continuação do Sermão do Monte; Jesus ensina confiança, prioridade do Reino e liberdade da ansiedade usando exemplos cotidianos da criação.', narrativeSituation:'ensino sobre confiança e ansiedade', characters:['Jesus','discípulos'] },
  { book:'mt', chapter:8, summary:'Narrativa de Jesus e os discípulos atravessando o mar, com perigo real durante uma tempestade e medo diante da ameaça.', narrativeSituation:'tempestade literal durante travessia de barco', characters:['Jesus','discípulos'] },
  { book:'mc', chapter:4, summary:'Narrativa de travessia do mar em que uma tempestade literal ameaça a embarcação e desperta medo nos discípulos.', narrativeSituation:'tempestade literal durante travessia de barco', characters:['Jesus','discípulos'] },
  { book:'lc', chapter:8, summary:'Narrativa de travessia do lago com tempestade literal, embarcação e medo dos discípulos.', narrativeSituation:'tempestade literal durante travessia de barco', characters:['Jesus','discípulos'] },
  { book:'jo', chapter:1, summary:'Prólogo que apresenta luz e trevas como linguagem teológica de vida, revelação e resistência à escuridão, não como descrição de um amanhecer específico.', narrativeSituation:'prólogo teológico e poético', characters:['Verbo','Deus'] },
  { book:'jo', chapter:10, summary:'Discurso de Jesus com linguagem pastoral sobre cuidado, voz, proteção, vida e relação entre pastor e ovelhas.', narrativeSituation:'metáfora pastoral usada no ensino de Jesus', characters:['Jesus'] },
  { book:'jo', chapter:11, summary:'Narrativa de luto pela morte de Lázaro e afirmação de Jesus sobre ressurreição e vida antes do encontro junto ao túmulo.', narrativeSituation:'luto, morte e esperança de ressurreição', characters:['Jesus','Marta','Maria','Lázaro'] },
  { book:'jo', chapter:15, summary:'Discurso de despedida em que videira e ramos funcionam como metáfora orgânica para permanência, dependência e fruto.', narrativeSituation:'ensino metafórico de Jesus aos discípulos', characters:['Jesus','discípulos'] },
  { book:'is', chapter:43, summary:'Oráculo de restauração e proteção; águas, rios e fogo funcionam como imagens de perigos atravessados com a presença de Deus.', narrativeSituation:'promessa de presença durante adversidade', characters:['Senhor','Israel'] },
  { book:'1co', chapter:13, summary:'Argumento sobre a primazia do amor no contexto do uso de dons e da vida comunitária cristã.', narrativeSituation:'ensino sobre amor e maturidade comunitária', characters:['Paulo','comunidade de Corinto'] },
  { book:'ap', chapter:21, summary:'Visão escatológica de nova criação e fim do luto, morte e dor; atmosfera de consolação após sofrimento.', narrativeSituation:'visão de renovação final e consolação', characters:['vidente','Deus','povo'] }
];

export function resolveBiblicalContext(verse={}) {
  const explicit = verse.context || verse.surroundingContext || '';
  const match = CONTEXT_HINTS.find(item => item.book === verse.book && item.chapter === Number(verse.chapter));
  return {
    text: explicit || match?.summary || '',
    narrativeSituation: verse.narrativeSituation || match?.narrativeSituation || null,
    characters: verse.characters?.length ? verse.characters : (match?.characters || []),
    source: explicit ? 'verse' : match ? 'curated-context' : 'genre-only'
  };
}
