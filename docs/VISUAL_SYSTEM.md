# VersDay Visual Semantic Intelligence v2

A regra operacional é: **nenhuma imagem é melhor do que uma imagem semanticamente errada**.

## Pipeline

passagem → contexto bíblico → VisualIntent → modo literal/conceitual/híbrido/abstrato → query expansion → 10–30 candidatos → hard filters → pré-ranking → análise visual do shortlist → ranking final → threshold → fotografia | catálogo curado | visual abstrato.

## Componentes

- js/visualIntelligence.js: interpretação semântica e direção fotográfica.
- js/biblicalContext.js: contexto de capítulo, situação narrativa, personagens e versículos locais próximos.
- js/visualProvider.js: contrato seguro com o backend; nenhuma chave no navegador.
- js/visualCatalog.js: acervo curado de segurança.
- js/visualSelector.js: hard filters e ranking multidimensional.
- js/visualAnalysis.js: luminância, complexidade, safe areas e focal point dos finalistas.
- js/visualMemory.js: cache versionado por finalidade, repetição, feedback e métricas locais.
- js/visualEngine.js: orquestração do pipeline.
- js/background.js: aplicação responsiva do background e atribuição.
- js/share.js: seleção e composição separada por formato social.

## Ranking

Pesos de partida:

- coerência semântica: 45%;
- adequação emocional: 15%;
- qualidade: 12%;
- composição: 12%;
- identidade VersDay: 6%;
- responsividade: 5%;
- novidade: 5%.

A coerência semântica é eliminatória. Watermark, texto embutido, publicidade, conteúdo inseguro, resolução insuficiente e clichê religioso/stock incompatível também eliminam o candidato.

## Contexto bíblico

O engine considera livro, capítulo, gênero e, quando disponível, versículos próximos do acervo local. Capítulos sensíveis possuem resumo curado para evitar erros como:

- João 1: luz como linguagem teológica, não amanhecer literal;
- Salmo 121: montes introduzem a pergunta, não são a resposta automática;
- João 11: ressurreição aparece dentro de uma cena real de luto;
- Mateus/Marcos/Lucas nas tempestades: barco e mar são elementos literais quando a narrativa os contém.

## Análise visual

Somente os melhores candidatos passam por análise de pixels em baixa resolução. O navegador estima:

- luminância;
- densidade de bordas;
- complexidade;
- safe areas;
- focal point;
- score de composição.

Isso não substitui um VLM. A arquitetura deixa VLM opcional para um futuro benchmark de custo/latência/ganho, sem tornar a experiência dependente dele.

## Fallback

1. fotografia externa aprovada;
2. fotografia do catálogo curado aprovada;
3. composição abstrata editorial.

Não existe fallback “usar a melhor imagem ruim”.

## Share

Finalidades são cacheadas separadamente:

- share-portrait: Story 1080×1920 e Feed 1080×1350;
- share-square: 1080×1080;
- share-og: 1200×630.

Uma fotografia landscape extrema não é forçada para Story. Nesse caso, o share usa outra seleção ou composição abstrata.

## Segurança e provedores

Segredos ficam somente em Functions:

- POST /api/visual-search — Unsplash;
- POST /api/visual-select — download tracking do Unsplash;
- POST /api/chat — Groq.

Variáveis:

UNSPLASH_ACCESS_KEY
GROQ_API_KEY
GROQ_MODEL
ALLOWED_ORIGINS

O Unsplash é usado por hotlink das URLs retornadas, com atribuição e download_location quando uma foto é selecionada. No GitHub Pages, sem backend configurado, o app opera com catálogo curado + abstrato.

## Feedback e memória

👍/👎 é discreto. Um 👎 invalida o cache da associação e impede a mesma imagem para aquela passagem. O histórico reduz repetição do mesmo asset, fotógrafo e assinatura visual sem sacrificar coerência.

## Benchmark

A suíte usa o acervo de 100+ passagens e Golden Cases para metáfora, pastoreio, confiança, sofrimento, clichês, contexto e share. Execute:

npm test

Use ?visualDebug=1 para ver intenção, contexto, queries, scores, motivos de rejeição e seleção.
