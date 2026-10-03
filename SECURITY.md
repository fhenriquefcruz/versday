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
