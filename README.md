# VersDay

Experiência contemplativa de versículos com **Visual Semantic Intelligence**.

> Nenhuma imagem é melhor do que uma imagem sem sentido.

## Sistema visual

O VersDay não transforma mais uma keyword em uma foto aleatória. O pipeline atual é:

passagem → contexto bíblico → intenção visual estruturada → literal/conceitual/híbrido/abstrato → queries editoriais → candidatos → hard filters → pré-ranking → análise visual dos finalistas → ranking final → fotografia aprovada ou fallback premium.

O engine considera tema, emoção, gênero bíblico, elementos literais, metáforas, contexto de capítulo e, quando disponíveis, versículos próximos do acervo local.

### Gates

- coerência semântica é eliminatória;
- clima emocional incompatível pode eliminar;
- beleza não compensa imagem errada;
- clichês religiosos automáticos são bloqueados;
- watermark, texto embutido, publicidade, conteúdo inseguro e baixa resolução são rejeitados;
- os 5 melhores candidatos passam por análise de luminância, complexidade, safe-area e focal point;
- repetição do mesmo asset/fotógrafo reduz o score;
- 👎 invalida a associação daquela imagem com a passagem.

## Fallback

A ordem é:

1. fotografia externa aprovada;
2. catálogo curado aprovado;
3. composição abstrata editorial.

Não existe “usar a melhor das imagens ruins”.

## Background e Share são separados

O background prioriza atmosfera e legibilidade.

O Share Engine possui finalidade e cache próprios:

- Story/Reels — 1080 × 1920;
- Feed vertical — 1080 × 1350;
- Quadrado — 1080 × 1080;
- Open Graph — 1200 × 630.

Uma foto landscape extrema não é forçada para Story; o share usa outra seleção ou composição abstrata.

## Segurança

O repositório já teve credenciais expostas no frontend em versões antigas. Elas foram removidas do código atual, mas **precisam ser revogadas/rotacionadas nos respectivos provedores**, pois remover do HEAD não invalida segredo já publicado.

Nenhuma chave privada deve existir em HTML ou em js/.

O repositório agora inclui endpoints server-side:

- POST /api/visual-search — busca de candidatos no Unsplash;
- POST /api/visual-select — tracking do download_location da foto escolhida;
- POST /api/chat — proxy seguro para Groq.

Variáveis de ambiente esperadas estão em .env.example:

UNSPLASH_ACCESS_KEY
GROQ_API_KEY
GROQ_MODEL
ALLOWED_ORIGINS

### GitHub Pages

GitHub Pages é estático. Sem backend configurado, o VersDay continua funcionando com catálogo curado + fallback abstrato e o chat permanece desabilitado por segurança.

Para um backend externo, configure os meta endpoints já existentes no index.html ou defina antes do main.js:

window.VERSDAY_CONFIG = {
  apiBase: 'https://seu-backend-seguro.example'
};

Em hospedagem server-side de mesma origem, /api é detectado automaticamente.

## Unsplash

A integração server-side preserva:

- chave confidencial;
- hotlink das URLs fornecidas pela API;
- atribuição de fotógrafo e Unsplash;
- download_location quando uma foto é efetivamente selecionada;
- orientação distinta para background, portrait share e square share;
- cache HTTP curto para reduzir chamadas.

## Testes

Execute:

npm test

A suíte cobre 100+ passagens do acervo e Golden Cases para:

- metáforas como luz/caminho;
- contexto bíblico;
- pastoreio literal;
- confiança conceitual;
- imagens bonitas porém erradas;
- clichês religiosos;
- repetição;
- share portrait;
- fallback abstrato;
- ausência de segredos no cliente e no servidor.

## Debug

Abra com:

?visualDebug=1

O console mostra:

- intenção;
- contexto;
- queries;
- candidatos;
- scores;
- análise visual;
- motivos de rejeição;
- seleção/fallback.

Detalhes completos: docs/VISUAL_SYSTEM.md
