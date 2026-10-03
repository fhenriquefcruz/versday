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
- feedback negativo invalida a associação para aquela passagem;
- contexto bíblico curado é aplicado antes da intenção visual em passagens sensíveis;
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

O endpoint deve guardar as credenciais de Unsplash/Pexels no servidor e devolver candidatos normalizados.

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

O workflow manual `.github/workflows/deploy-vercel-api.yml` cria ou reutiliza o projeto `versday-api`, faz o deploy de produção e valida automaticamente `/api/health`.

Para habilitá-lo, cadastre no GitHub apenas:

```text
VERCEL_TOKEN=...
```

Depois execute o workflow **Deploy VersDay API to Vercel** em `Actions → Run workflow`.

O deploy usa a Vercel CLI pinada e não copia credenciais antigas do frontend. Após a primeira publicação, cadastre no ambiente **Production** do projeto Vercel as chaves novas/rotacionadas:

```text
UNSPLASH_ACCESS_KEY=...
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
ALLOWED_ORIGIN=https://fhenriquefcruz.github.io
```

O endpoint `/api/health` informa apenas se os providers estão configurados, nunca seus valores.

## Share cards

O engine suporta:

- Story/Reels — 1080 × 1920
- Feed vertical — 1080 × 1350
- Quadrado — 1080 × 1080
- Open Graph — 1200 × 630

O share visual é selecionado e composto independentemente do background da interface. Story/Feed/Square usam finalidade vertical; Open Graph usa finalidade landscape. Se a fotografia não atingir os gates naquele formato, o share cai para composição abstrata premium.

## Testes

O benchmark usa o próprio acervo curado do VersDay, hoje com mais de 100 passagens.

```bash
npm test
```

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
- acervo premium com pelo menos 12 imagens classificadas.

## Debug visual

Use:

```
?visualDebug=1
```

O console exibirá intenção, queries, top candidatos, scores e motivos de rejeição.