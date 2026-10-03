// Contexto bíblico resumido para passagens em que uma leitura isolada pode distorcer a intenção visual.
// São resumos semânticos, não uma segunda tradução bíblica.

const CONTEXT_HINTS = [
  { book:'gn', chapter:22, summary:'Narrativa do teste de Abraão com Isaque no monte; tensão, obediência, perigo e provisão ocorrem em uma cena concreta, não como paisagem motivacional.', narrativeSituation:'pai e filho sob tensão extrema durante uma jornada sacrificial', characters:['Abraão','Isaque'] },
  { book:'ex', chapter:14, summary:'Narrativa de fuga em que Israel está encurralado entre o exército egípcio e o mar antes da travessia.', narrativeSituation:'ameaça militar e travessia literal do mar', characters:['Moisés','Israel','egípcios'] },
  { book:'js', chapter:6, summary:'Narrativa da queda de Jericó em contexto de conquista e conflito; cidade, muralhas e tensão militar são elementos concretos.', narrativeSituation:'cerco e queda de uma cidade fortificada', characters:['Josué','Israel','habitantes de Jericó'] },
  { book:'1sm', chapter:17, summary:'Narrativa de confronto entre Davi e Golias dentro de uma guerra entre Israel e filisteus; coragem ocorre sob ameaça física real.', narrativeSituation:'confronto individual dentro de uma batalha literal', characters:['Davi','Golias','Israel','filisteus'] },
  { book:'sl', chapter:22, summary:'Lamento poético de abandono, sofrimento e súplica que transita para confiança e louvor; imagens dolorosas não devem ser romantizadas.', narrativeSituation:'lamento intenso em meio a sofrimento e sensação de abandono', characters:['salmista','Deus'] },
  { book:'sl', chapter:51, summary:'Poema penitencial de confissão e pedido de purificação e renovação interior após pecado grave.', narrativeSituation:'arrependimento, culpa e desejo de restauração', characters:['Davi','Deus'] },
  { book:'sl', chapter:137, summary:'Lamento de exilados junto aos rios da Babilônia; memória de Jerusalém, perda e violência histórica moldam o tom.', narrativeSituation:'exílio, saudade e trauma coletivo', characters:['exilados de Judá'] },
  { book:'is', chapter:6, summary:'Visão profética de santidade, temor e chamado; elementos de templo e visão são simbólicos e solenes, não fantasia genérica.', narrativeSituation:'visão de chamado profético diante da santidade divina', characters:['Isaías','Senhor','serafins'] },
  { book:'is', chapter:53, summary:'Poema profético sobre sofrimento, rejeição, injustiça e restauração; a dor é central e não deve ser substituída por triunfo precoce.', narrativeSituation:'sofrimento vicário, humilhação e posterior vindicação', characters:['servo sofredor'] },
  { book:'dn', chapter:3, summary:'Narrativa de perseguição imperial e fornalha ardente; fogo e ameaça são literais no enredo.', narrativeSituation:'três homens ameaçados e lançados em fogo por recusarem idolatria', characters:['Sadraque','Mesaque','Abede-Nego','Nabucodonosor'] },
  { book:'dn', chapter:6, summary:'Narrativa de perseguição política e cova dos leões; risco, noite e confinamento são elementos concretos.', narrativeSituation:'Daniel é lançado numa cova por permanecer fiel em oração', characters:['Daniel','rei Dario'] },
  { book:'jn', chapter:1, summary:'Narrativa de fuga profética por mar, tempestade literal e perigo de naufrágio antes de Jonas ser lançado ao mar.', narrativeSituation:'tempestade marítima durante fuga do profeta', characters:['Jonas','marinheiros'] },
  { book:'mt', chapter:26, summary:'Narrativa da última noite antes da crucificação: refeição, Getsêmani, angústia, oração, traição e prisão.', narrativeSituation:'angústia e traição nas horas anteriores à crucificação', characters:['Jesus','discípulos','Judas'] },
  { book:'mt', chapter:27, summary:'Narrativa de julgamento, crucificação e morte de Jesus; sofrimento e violência são reais, mas a experiência visual deve evitar exploração gráfica.', narrativeSituation:'condenação, crucificação e morte', characters:['Jesus','Pilatos','soldados','multidão'] },
  { book:'mt', chapter:28, summary:'Narrativa do túmulo vazio e encontro com Jesus ressuscitado; o sepulcro é elemento literal e a atmosfera muda de luto para assombro e esperança.', narrativeSituation:'túmulo vazio e anúncio da ressurreição', characters:['Jesus','mulheres','discípulos'] },
  { book:'lc', chapter:15, summary:'Conjunto de parábolas sobre perda, busca, retorno, perdão e alegria restaurativa; o filho que volta é uma narrativa relacional, não apenas paisagem.', narrativeSituation:'reconciliação familiar após afastamento e retorno', characters:['pai','filho mais novo','filho mais velho'] },
  { book:'lc', chapter:23, summary:'Narrativa de condenação, crucificação, morte e sepultamento de Jesus; tom de sofrimento, injustiça e luto.', narrativeSituation:'crucificação, morte e sepultamento', characters:['Jesus','soldados','mulheres','criminosos'] },
  { book:'lc', chapter:24, summary:'Narrativa do túmulo vazio e encontros do Ressuscitado, incluindo a estrada de Emaús; surpresa, reconhecimento e esperança estruturam a cena.', narrativeSituation:'ressurreição e reconhecimento gradual pelos discípulos', characters:['Jesus','mulheres','discípulos'] },
  { book:'atos', chapter:9, summary:'Narrativa de conversão de Saulo no caminho de Damasco; luz intensa, cegueira temporária e mudança de direção fazem parte do evento.', narrativeSituation:'interrupção de uma viagem e transformação radical de Saulo', characters:['Saulo','Jesus','Ananias'] },
  { book:'atos', chapter:16, summary:'Narrativa missionária que inclui prisão, noite, cânticos, terremoto e libertação; confinamento e tensão são concretos.', narrativeSituation:'Paulo e Silas presos durante a noite e libertados após terremoto', characters:['Paulo','Silas','carcereiro'] },
  { book:'rm', chapter:8, summary:'Argumento pastoral sobre sofrimento presente, esperança, adoção e segurança no amor de Deus; imagens não devem negar a dor real.', narrativeSituation:'ensino sobre sofrimento, esperança e segurança', characters:['Paulo','comunidade cristã'] },
  { book:'1co', chapter:15, summary:'Argumento extenso sobre ressurreição corporal, morte e esperança futura; não é uma cena do túmulo vazio, mas ensino teológico.', narrativeSituation:'ensino apostólico sobre ressurreição e transformação futura', characters:['Paulo','comunidade de Corinto'] },
  { book:'tg', chapter:2, summary:'Exortação contra favoritismo e em favor de uma fé coerente com misericórdia e cuidado dos vulneráveis.', narrativeSituation:'ensino comunitário sobre parcialidade, misericórdia e justiça prática', characters:['Tiago','comunidade cristã'] },
  { book:'ap', chapter:6, summary:'Visão apocalíptica de juízo, conflito, fome e morte em linguagem simbólica; deve evitar literalismo sensacionalista e estética de fantasia genérica.', narrativeSituation:'visão simbólica de crise e julgamento', characters:['vidente'] },
  { book:'sl', chapter:23, summary:'Poema pastoral sobre cuidado, condução, provisão, descanso, travessia de perigo e segurança sob a presença de Deus.', narrativeSituation:'metáfora pastoral de condução e proteção', characters:['salmista','Senhor como pastor'] },
  { book:'sl', chapter:91, summary:'Poema de confiança que usa abrigo, sombra, proteção e perigo como imagens de segurança em Deus.', narrativeSituation:'proteção em meio a ameaças', characters:['salmista','Deus'] },
  { book:'sl', chapter:121, summary:'Cântico de peregrinação em que os montes introduzem a pergunta pelo socorro; a resposta desloca a confiança da paisagem para o Criador.', narrativeSituation:'peregrino busca socorro e proteção', characters:['peregrino','Senhor'], suppressLiteral:['montanha'] },
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
    suppressLiteral: Array.isArray(verse.suppressLiteral)
      ? verse.suppressLiteral
      : (match?.suppressLiteral || []),
    source: explicit ? 'verse' : match ? 'curated-context' : 'genre-only'
  };
}