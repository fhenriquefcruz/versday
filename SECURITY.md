# Segurança do VersDay

## Credenciais

Nenhuma credencial privada pode ser armazenada em arquivos servidos pelo GitHub Pages.

Isso inclui, entre outros:

- Unsplash Access Key / Secret Key;
- Pexels API Key;
- Groq API Key;
- tokens de provedores de IA;
- client secrets.

Integrações que exigem segredo devem usar:

```
browser
→ endpoint server-side / serverless
→ provedor externo
```

## Credenciais que já foram publicadas

O histórico do repositório já conteve credenciais de Unsplash e Groq.

Remover a chave do commit atual não revoga a credencial antiga.

Essas credenciais devem ser consideradas comprometidas e precisam ser:

1. revogadas no provedor;
2. recriadas;
3. armazenadas somente no ambiente server-side;
4. nunca reutilizadas no frontend.

## Prevenção de regressões

A suíte de testes procura padrões de credenciais conhecidas dentro do código enviado ao navegador.

Execute:

```bash
npm test
```

antes de qualquer merge.

## Conteúdo gerado por IA

Respostas de provedores de IA são tratadas como conteúdo não confiável.

Regras:

- a resposta do provider permanece em texto puro no histórico;
- HTML vindo do modelo nunca é confiado diretamente;
- qualquer formatação visual é aplicada somente depois de escapar caracteres HTML;
- mensagens do usuário também são escapadas;
- não use `innerHTML` com resposta bruta de provider.

## Verificação de rotação

O repositório documenta que credenciais antigas de Unsplash e Groq já foram publicadas no histórico. A presença ou ausência de uma chave nova no ambiente do provedor não pode ser comprovada apenas pelo código-fonte.

Antes de ativar o backend em produção, confirme no provedor que:

1. as credenciais antigas foram revogadas;
2. as chaves atuais foram emitidas depois da revogação;
3. elas existem apenas como secrets do backend/GitHub Actions/Vercel;
4. nenhuma credencial reutilizada do histórico foi reativada.

## Renderização de dados persistidos

Dados vindos de cache, histórico, favoritos, APIs e provedores externos devem ser tratados como não confiáveis, mesmo quando normalmente são produzidos pelo próprio VersDay.

Regras:

- versículos, referências, nomes e previews são renderizados com `textContent`;
- favoritos e histórico usam `createElement`/`replaceChildren` e closures, não template strings HTML;
- URLs de capítulo só são criadas a partir de códigos de livros conhecidos e capítulos inteiros positivos;
- `innerHTML`, `insertAdjacentHTML`, `document.write`, `eval` e `new Function` são proibidos nos módulos do cliente;
- a única exceção é o renderer de chat, cuja entrada passa obrigatoriamente por `formatAssistantHtml()`, que escapa HTML antes de aplicar Markdown leve;
- a suíte de segurança varre todos os módulos `js/` para impedir regressão.
