// js/gemini.js
// Cliente seguro para o assistente bíblico. Nenhuma credencial é enviada ao navegador.

function metaContent(name) {
  if (typeof document === 'undefined') return '';
  return document.querySelector('meta[name="' + name + '"]')?.getAttribute('content')?.trim() || '';
}

function getChatEndpoint() {
  const explicit = metaContent('versday-chat-endpoint');
  if (explicit) return explicit;

  const metaBase = metaContent('versday-api-base');
  const configBase = typeof window !== 'undefined' && window.VERSDAY_CONFIG?.apiBase
    ? String(window.VERSDAY_CONFIG.apiBase).trim()
    : '';
  const base = (metaBase || configBase).replace(/\/$/, '');

  if (base) return base + '/api/chat';

  if (typeof location !== 'undefined' && !/\.github\.io$/i.test(location.hostname)) {
    return '/api/chat';
  }

  return '';
}

export function isChatAvailable() {
  return Boolean(getChatEndpoint());
}

export async function askGemini(question, conversationHistory = []) {
  const endpoint = getChatEndpoint();
  if (!endpoint) {
    throw new Error('Assistente bíblico indisponível nesta hospedagem estática.');
  }

  const history = conversationHistory
    .slice(-12)
    .map(item => ({
      role:item.role === 'model' ? 'assistant' : item.role,
      content:String(item.content || '')
    }))
    .filter(item => item.content.trim());

  // chat.js adiciona a pergunta ao histórico antes de chamar esta função.
  // Evita enviar a mesma mensagem duas vezes ao backend.
  if (
    history.length &&
    history[history.length - 1].role === 'user' &&
    history[history.length - 1].content.trim() === String(question || '').trim()
  ) {
    history.pop();
  }

  const response = await fetch(endpoint, {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({
      question:String(question || '').trim(),
      history
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'HTTP ' + response.status);
  }

  const data = await response.json();
  let answer = String(data.answer || '');

  answer = answer.replace(/^#{1,6}\s+/gm, '');
  answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  answer = answer.replace(/\*(.*?)\*/g, '<em>$1</em>');
  answer = answer.replace(/\n\n/g, '<br><br>');
  answer = answer.replace(/\n/g, '<br>');

  return answer;
}
