import { isBackendProviderReady } from './backendHealth.js';

// js/gemini.js
// Cliente seguro para o assistente bíblico.
// Nenhuma credencial é enviada ao navegador.
// Configure um endpoint seguro em:
// <meta name="versday-chat-endpoint" content="https://.../api/chat">

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
  return String(
    data.answer ||
    data.choices?.[0]?.message?.content ||
    ''
  ).trim();
}