# VersDay

Experiência contemplativa de versículos com sistema visual semântico.

## Sistema visual

O VersDay não associa mais uma palavra do versículo a uma foto aleatória.

Pipeline atual:

```
passagem
→ interpretação semântica
→ intenção visual
→ modo literal / conceitual / híbrido
→ queries enriquecidas
→ candidatos
→ gates semânticos
→ ranking multidimensional
→ foto validada OU fallback editorial abstrato
```

A regra é simples:

> Nenhuma imagem é melhor do que uma imagem sem sentido.

### Critérios de seleção

- coerência semântica é eliminatória;
- clima emocional precisa combinar;
- qualidade estética não compensa incompatibilidade;
- composição precisa funcionar com texto;
- focal point é separado para desktop e mobile;
- repetição reduz score, mas nunca supera pertinência;
- feedback negativo invalida a associação para aquela passagem e impede a mesma imagem de reaparecer em outras passagens do mesmo tema;
- contexto bíblico curado é aplicado antes da intenção visual em passagens sensíveis, com granularidade de capítulo ou faixa imediata de versículos quando necessário;
- os 5 melhores candidatos passam por análise de pixels para luminância, complexidade e safe area;
- watermark, texto embutido, baixa resolução, publicidade e clichê religioso sem suporte literal são hard filters.

## GitHub Pages e segurança

A aplicação publicada em GitHub Pages é estática. Por isso, nenhuma chave de API privada pode existir em `index.html` ou `js/`.

A busca dinâmica de imagens é opcional e usa `js/visualProvider.js`. Para ativá-la, configure:

```html
<meta
  name="versday-visual-endpoint"
  content="https://seu-backend.example/api/visual-search"
/>
```

O endpoint deve guardar credenciais privadas no servidor e devolver candidatos normalizados. A busca dinâmica atual usa Unsplash; o Pexels é usado apenas no acervo curado estático.

O assistente bíblico segue a mesma regra:

```html
<meta
  name="versday-chat-endpoint"
  content="https://seu-backend.example/api/chat"
/>
```

Sem esses endpoints, o VersDay continua funcional com o motor visual local, catálogo curado e fallback abstrato.

### Backend seguro incluído no repositório

O diretório `api/` já contém funções server-side para uma implantação serverless:

- `api/visual-search.js` — consulta semanticamente o Unsplash e retorna vários candidatos normalizados;
- `api/visual-select.js` — executa o download tracking exigido pelo Unsplash quando uma foto é escolhida;
- `api/chat.js` — mantém a credencial do assistente bíblico fora do navegador;
- `api/health.js` — informa somente quais providers estão configurados, sem revelar segredos;
- `api/_cors.js` — restringe origens e centraliza validação de payload/CORS.

Variáveis esperadas no ambiente server-side:

```text
UNSPLASH_ACCESS_KEY=...
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
ALLOWED_ORIGIN=https://fhenriquefcruz.github.io
```

Os valores reais nunca devem ir para `index.html`, `js/` ou para commits. Credenciais que já tenham sido publicadas historicamente precisam ser revogadas e rotacionadas nos provedores.

Em uma implantação Vercel (`*.vercel.app`), os endpoints `/api/visual-search`, `/api/visual-select` e `/api/chat` são detectados automaticamente. No GitHub Pages, o VersDay continua sem segredos e usa o catálogo curado + fallback abstrato.

### Bootstrap do backend Vercel

O workflow manual `.github/workflows/deploy-vercel-api.yml` cria ou reutiliza o projeto `versday-api`, sincroniza configuração, publica em produção, valida `/api/health` e atualiza automaticamente os endpoints do GitHub Pages.

Cadastre como GitHub Secrets:

```text
VERCEL_TOKEN=...            # obrigatório para o deploy
UNSPLASH_ACCESS_KEY=...     # chave nova/rotacionada; opcional se já existir no Vercel
GROQ_API_KEY=...            # chave nova/rotacionada; opcional se já existir no Vercel
```

Depois execute **Deploy VersDay API to Vercel** em `Actions → Run workflow` e informe um **scope Vercel dedicado ao VersDay**.

> O VersDay deve ter projeto/conta/equipe próprios no Vercel. Não use o scope da RTM: RTM é outro projeto e permanece totalmente separado.

O workflow:

1. cria ou reutiliza `versday-api`;
2. preserva valores Vercel existentes quando um provider secret não é fornecido;
3. sincroniza `GROQ_MODEL` e `ALLOWED_ORIGIN`;
4. faz o deploy de produção;
5. valida o healthcheck;
6. lê `imagesConfigured` e `chatConfigured`;
7. ativa no `index.html` somente os providers confirmados;
8. troca o `CACHE_NAME` do Service Worker apenas quando a configuração mudou;
9. publica essa configuração na `main`, disparando o Pages normalmente.

O frontend também consulta o healthcheck: chat e busca externa não são habilitados quando o provider correspondente ainda não está pronto. O endpoint `/api/health` nunca devolve os valores das credenciais.

### Conformidade dos provedores de imagem

**Unsplash API**

- usa diretamente as URLs de imagem retornadas em `photo.urls` (hotlinking);
- mantém `download_location` no objeto visual e no cache;
- dispara `/api/visual-select` quando a foto é efetivamente selecionada, inclusive em reutilização via cache;
- exibe crédito no formato “Foto por [fotógrafo] no Unsplash”, com link para o perfil do fotógrafo e para o Unsplash com parâmetros UTM;
- a credencial `UNSPLASH_ACCESS_KEY` permanece exclusivamente no backend.

**Pexels curado**

- as fotografias do catálogo interno são usadas sob a licença Pexels;
- o VersDay não usa a API do Pexels para a busca dinâmica atual;
- a licença permite uso em website/app sem atribuição obrigatória, embora o produto mantenha link de origem quando disponível;
- o VersDay não redistribui as fotos como biblioteca de stock ou wallpaper independente.

As regras devem ser revalidadas antes de trocar de fornecedor ou ativar nova API.

## Share cards

O engine suporta:

- Story/Reels — 1080 × 1920
- Feed vertical — 1080 × 1350
- Quadrado — 1080 × 1080
- Open Graph — 1200 × 630

O share visual é selecionado e composto independentemente do background da interface. Story/Feed/Square usam finalidade vertical; Open Graph usa finalidade landscape. Se a fotografia não atingir os gates naquele formato, o share cai para composição abstrata premium.

A composição respeita `safeTop`/`safeBottom` de cada formato: versículo, referência, assinatura VersDay e crédito fotográfico ficam fora das regiões mais sujeitas à sobreposição das interfaces sociais. Quando a foto vem da Unsplash API, a própria peça também recebe crédito discreto ao fotógrafo + Unsplash.

## Testes

O benchmark usa o próprio acervo curado do VersDay, hoje com 150+ passagens, somado a casos dedicados para temas sensíveis e tipos de texto que não devem depender do sorteio normal do app.

```bash
npm test
npm run benchmark:visual
```

O gate agregado exige **approval rate mínimo de 95%**. Uma passagem só é aprovada quando produz intenção/queries válidas e termina em uma destas saídas:

- fotografia que ultrapassa os thresholds semântico, de qualidade e composição, com focal point e safe area;
- fallback abstrato editorial válido quando nenhuma fotografia merece ser exibida.

O benchmark dedicado cobre amor, fé, medo, morte, ressurreição, perdão, sabedoria, justiça, guerra, oração, alegria, sofrimento, esperança, natureza, profecia, narrativa, poesia e epístolas.

Os gates cobrem:

- estrutura da intenção visual;
- queries semânticas;
- metáforas;
- seleção literal;
- rejeição de imagens bonitas porém incoerentes;
- controle de repetição;
- fallback abstrato;
- ausência de chaves privadas no cliente;
- contexto bíblico curado;
- hard filters técnicos e semânticos;
- acervo premium com pelo menos 18 imagens classificadas;
- cobertura curada para alegria, gratidão, relacionamento, reconciliação, sofrimento, lamento e justiça;
- política `abstract-first` para morte, guerra, julgamento, profecia e ressurreição quando não houver fotografia inequívoca.

## Debug visual

Use:

```
?visualDebug=1
```

O console exibirá intenção, queries, top candidatos, scores e motivos de rejeição.