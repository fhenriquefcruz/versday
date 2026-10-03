# VersDay

Experiência bíblica contemplativa com seleção visual semântica, compartilhamento e assistente bíblico.

## Visual Semantic Intelligence

O background não é selecionado por `Math.random()` nem por uma palavra isolada. A passagem é interpretada, recebe um VisualIntent, gera queries contextualizadas, passa por candidatos, hard filters, ranking multidimensional, análise de composição e threshold. Se nenhuma imagem servir, o VersDay usa acervo curado ou uma composição abstrata premium.

Documentação completa: [`docs/VISUAL_SYSTEM.md`](docs/VISUAL_SYSTEM.md).

## Desenvolvimento

```bash
npm test
```

O frontend é um PWA estático e continua utilizável no GitHub Pages. Integrações que exigem segredo foram movidas para `api/` e precisam rodar em um backend de Functions.

Variáveis server-side:

```text
UNSPLASH_ACCESS_KEY
GROQ_API_KEY
GROQ_MODEL          # opcional
ALLOWED_ORIGIN      # opcional
```

**Nunca coloque essas chaves em arquivos `js/`, HTML ou commits.**

## Segurança

Chaves que já apareceram publicamente em versões anteriores devem ser revogadas/rotacionadas no Unsplash e no Groq; apagar do arquivo atual não remove o segredo do histórico Git.
