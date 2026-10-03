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
- feedback negativo invalida a associação para aquela passagem.

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

## Share cards

O engine suporta:

- Story/Reels — 1080 × 1920
- Feed vertical — 1080 × 1350
- Quadrado — 1080 × 1080
- Open Graph — 1200 × 630

O share visual é composto independentemente do background da interface.

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
- ausência de chaves privadas no cliente.

## Debug visual

Use:

```
?visualDebug=1
```

O console exibirá intenção, queries, top candidatos, scores e motivos de rejeição.
