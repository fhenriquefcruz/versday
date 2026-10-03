import { isBackendProviderReady } from './backendHealth.js';

// js/gemini.js
// Cliente seguro para o assistente bíblico.
// Nenhuma credencial é enviada ao navegador.
// Configure um endpoint seguro em:
// <meta name="versday-chat-endpoint" content="https://.../api/chat">

const SYSTEM_INSTRUCTION = `Você é um amigo que entende muito da Bíblia e adora explicar as coisas de um jeito simples e gostoso de ler. Ajude as pessoas a entenderem as Escrituras como se estivessem conversando sobre a vida.

Seja caloroso, paciente e use linguagem natural e fluida. Evite cabeçalhos como "Contexto histórico:" ou "Análise:". Responda como quem conta uma história ou dá um conselho.

Para perguntas profundas (contexto histórico, grego, hebraico), inclua os detalhes de modo leve e integrado. Cite versículos de forma natural. Seja positivo, edificante e nunca arrogante. Responda sempre em português brasileiro.`;

function getChatEndpoint() {
  if (typeof document === 'undefined') return '';
  const configured = document
    .querySelector('meta[name="versday-chat-endpoint"]')
    ?.getAttribute('content')
    ?.trim() || '';

  if (configured) return configured;
  if (typeof location !== 'undefined' && /\.vercel\.app$/i.test(location.hostname)) {
    return '/api/chat';
  }
  return '';
}

export function isChatAvailable() {
  return Boolean(getChatEndpoint());
}

export async function checkChatAvailability(options = {}) {
  if (!getChatEndpoint()) return false;
  const ready = await isBackendProviderReady('chat', options);
  return ready === null ? true : ready;
}

export async function askGemini(question, conversationHistory = []) {
  const endpoint = getChatEndpoint();
  if (!endpoint) {
    throw new Error('Assistente bíblico indisponível nesta versão estática.');
  }

  const history = conversationHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const providerMessage =
      typeof err.error === 'string'
        ? err.error
        : err.error?.message;

    const message = response.status === 503
      ? 'Assistente bíblico temporariamente indisponível.'
      : providerMessage || `HTTP ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  let answer = data.answer || data.choices?.[0]?.message?.content || '';

  answer = answer.replace(/^#{1,6}\s+/gm, '');
  answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  answer = answer.replace(/\*(.*?)\*/g, '<em>$1</em>');
  answer = answer.replace(/\n\n/g, '<br><br>');
  answer = answer.replace(/\n/g, '<br>');

  return answer;
}