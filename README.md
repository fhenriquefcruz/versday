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

O repositório também contém os endpoints server-side opcionais em `api/`:

- `/api/visual-search` — busca de até 30 candidatos no Unsplash;
- `/api/visual-select` — download tracking exigido pelo provedor;
- `/api/chat` — proxy seguro para o assistente bíblico.

Em uma implantação Vercel (`*.vercel.app`), esses endpoints são detectados automaticamente. Configure apenas as variáveis de ambiente descritas em `.env.example`. No GitHub Pages, nenhuma chave é necessária e nenhuma credencial privada é enviada ao navegador.

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
