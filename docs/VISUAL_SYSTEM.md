# VersDay Visual Semantic Intelligence

O sistema visual do VersDay é um subsistema de produto. A regra operacional é simples: **nenhuma imagem é melhor do que uma imagem semanticamente errada**.

## Pipeline

`passagem → contexto → VisualIntent → modo de representação → query expansion → candidatos → hard filters → ranking semântico → análise visual → threshold → imagem | acervo curado | composição abstrata`

### VisualIntent

`js/visual-semantic.js` transforma a passagem em uma estrutura com:

- tema principal e secundários;
- gênero bíblico;
- emoção e atmosfera;
- elementos literais;
- metáforas;
- modo `literal`, `conceptual`, `abstract` ou `hybrid`;
- cenas preferidas;
- conceitos proibidos;
- direção fotográfica;
- requisitos de composição e safe areas.

Palavras isoladas não viram imagem diretamente. Luz, caminho, água e montanha são tratados como possíveis metáforas; personagens e contexto podem ser fornecidos pelo objeto do versículo.

## Queries

`buildVisualQueries()` produz até quatro consultas editoriais longas. Não existem queries universais como `faith`, `hope sunrise` ou `Christian wallpaper`.

## Candidatos e score

O sistema nunca aceita o primeiro resultado do provedor. O backend pode retornar até 30 candidatos; o cliente normaliza, elimina duplicatas e pontua cada um em dimensões independentes:

- coerência semântica: 45%;
- adequação emocional: 15%;
- qualidade técnica: 12%;
- composição/área segura: 12%;
- identidade visual: 6%;
- responsividade: 5%;
- novidade: 5%.

Thresholds iniciais ficam em `js/visual-scoring.js`. Incoerência semântica é eliminatória: qualidade estética não compensa imagem errada.

Hard filters eliminam watermark, texto embutido, publicidade, conteúdo impróprio, baixa resolução e imagens reprovadas pelo usuário.

## Análise visual

`js/visual-analysis.js` analisa somente o shortlist, em baixa resolução, para estimar:

- luminância;
- complexidade;
- densidade de bordas;
- regiões seguras para texto;
- focal point;
- adequação de composição.

A arquitetura aceita uma validação multimodal futura (`candidate.vlm.semanticMatch` e `emotionalMatch`) sem tornar um VLM obrigatório. Isso permite comparar ganho de qualidade, custo e latência antes de ativá-lo.

## Fallbacks

A ordem é:

1. imagem externa aprovada;
2. acervo curado aprovado;
3. composição abstrata editorial.

Não existe fallback “pegar qualquer imagem”.

O fallback abstrato usa paleta semântica, luz, profundidade e gradientes e deve parecer uma decisão de design, não um placeholder.

## Memória, cache e feedback

`js/visual-memory.js` registra localmente:

- seleção por passagem;
- versão do ranking;
- histórico recente de imagens/fotógrafos;
- feedback 👍/👎;
- métricas técnicas.

Um 👎 invalida o cache da passagem e impede a reapresentação do mesmo asset para aquela referência.

## Responsividade e texto

O background usa focal point e `background-position` adaptativo. O shortlist detecta safe areas; a posição do texto não é conceitualmente fixa.

O overlay é adaptativo e leve. A intenção é preservar a fotografia, não esconder uma escolha ruim com uma camada preta pesada.

## Share Engine

`js/share.js` separa experiência e compartilhamento. Os formatos disponíveis são:

- 1080×1920 — Story/Reels;
- 1080×1350 — feed vertical;
- 1080×1080 — quadrado;
- 1200×630 — Open Graph.

Cada formato possui safe areas próprias, crop por focal point, tipografia responsiva, referência e assinatura VersDay.

## Segurança e provedores

Nenhuma chave privada deve existir em `js/` ou em HTML entregue ao navegador.

Endpoints server-side:

- `POST /api/visual-search` — consulta Unsplash usando `UNSPLASH_ACCESS_KEY` no servidor;
- `POST /api/visual-select` — dispara o tracking de download da foto efetivamente escolhida;
- `POST /api/chat` — acessa Groq usando `GROQ_API_KEY` no servidor.

Variáveis esperadas:

```text
UNSPLASH_ACCESS_KEY=...
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile   # opcional
ALLOWED_ORIGIN=https://fhenriquefcruz.github.io  # opcional; aceita lista separada por vírgula
```

No GitHub Pages, onde não existe execução server-side, o Visual Engine degrada para acervo curado + abstrato. Para habilitar busca externa e chat sem expor segredos, publique a pasta `api/` em uma plataforma de Functions e configure antes do `main.js`:

```html
<script>
  window.VERSDAY_CONFIG = { apiBase: 'https://SEU-BACKEND-SEGURO.example' };
</script>
```

Se o site inteiro estiver em `*.vercel.app`, `apiBase` de mesma origem é detectado automaticamente.

### Credenciais historicamente expostas

Versões anteriores do repositório continham chaves no JavaScript público. Removê-las do HEAD não invalida o segredo que já foi publicado no histórico. Essas chaves precisam ser revogadas/rotacionadas nos respectivos provedores.

## Provedor de imagens

A implementação usa Unsplash somente quando o backend seguro está configurado e preserva:

- hotlinking das URLs fornecidas;
- atribuição ao fotógrafo e ao Unsplash;
- `download_location` para tracking quando a foto é escolhida;
- filtros de orientação e conteúdo;
- limite de candidatos para custo/latência previsíveis.

Pexels permanece apenas no pequeno acervo curado de segurança; não é misturado aleatoriamente como segunda API de busca.

## Testes e benchmark

`tests/visual-benchmark.test.mjs` usa 100 passagens estáveis do acervo curado para impedir validação por meia dúzia de casos. Existem também Golden Cases específicos para:

- confiança;
- luz metafórica;
- pastoreio;
- videira;
- perdão;
- aves/natureza.

`tests/visual-ranking.test.mjs` comprova que uma foto tecnicamente excelente pode ser rejeitada por incoerência semântica.

`tests/no-secrets.test.mjs` protege contra regressão de chaves privadas no frontend.

A CI roda esses testes em cada PR e em `main`.

## Debug e observabilidade

Abra a aplicação com `?visualDebug=1` para registrar no console:

- VisualIntent;
- queries;
- top candidatos;
- scores por dimensão;
- motivos de rejeição;
- seleção/fallback.

Métricas locais usam motivos como `SEMANTIC_MISMATCH`, `LOW_RESOLUTION`, `WATERMARK`, `USER_REJECTED` e `VISUAL_SELECTION`.

## Critério de qualidade

Antes de aceitar uma fotografia, aplique as duas perguntas:

1. sem o versículo, a atmosfera ainda é razoavelmente compatível com a mensagem?
2. com o versículo, texto e imagem parecem ter sido escolhidos juntos?

Se a resposta for não, a fotografia deve ser rejeitada.
