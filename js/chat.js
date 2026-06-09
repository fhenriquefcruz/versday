// js/chat.js
import { askGemini } from './gemini.js';

let chatHistory = [];
let isLoading = false;

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;'
  }[m]));
}

export function initChat() {
  const initialInput  = document.getElementById('initialQuestion');
  const askBtn        = document.getElementById('askInitialBtn');
  const chatContainer = document.getElementById('chatContainer');
  const chatMessages  = document.getElementById('chatMessages');
  const chatInput     = document.getElementById('chatInput');
  const sendBtn       = document.getElementById('sendChatBtn');
  const chatLoading   = document.getElementById('chatLoading');
  const promptDiv     = document.querySelector('.question-prompt');

  // Segurança: se algum elemento crítico não existir, não inicializa
  if (!initialInput || !askBtn || !chatContainer || !chatMessages) {
    console.warn('[VersDay] Elementos do chat não encontrados no DOM.');
    return;
  }

  function addMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;
    if (role === 'user') {
      msgDiv.innerHTML = `<strong>Você</strong>${escapeHtml(text)}`;
    } else {
      msgDiv.innerHTML = `<strong>Assistente Teológico</strong>${text}`;
    }
    chatMessages.appendChild(msgDiv);
    scrollToBottom();
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function setLoading(state) {
    isLoading = state;
    if (chatLoading) chatLoading.style.display = state ? 'block' : 'none';
    if (askBtn)  askBtn.disabled  = state;
    if (sendBtn) sendBtn.disabled = state;
  }

  async function sendFirstQuestion() {
    if (isLoading) return;
    const question = initialInput.value.trim();
    if (!question) {
      initialInput.focus();
      initialInput.style.borderColor = 'var(--accent-color)';
      setTimeout(() => initialInput.style.borderColor = '', 1500);
      return;
    }

    if (promptDiv) promptDiv.style.display = 'none';
    chatContainer.style.display = 'block';

    addMessage('user', question);
    chatHistory.push({ role: 'user', content: question });
    setLoading(true);

    try {
      const answer = await askGemini(question, chatHistory);
      addMessage('system', answer);
      chatHistory.push({ role: 'model', content: answer });
    } catch (err) {
      console.error('[VersDay] Chat error:', err);
      addMessage('system', '❌ Não consegui responder agora. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
      if (chatInput) chatInput.focus();
    }
  }

  async function sendMessage() {
    if (isLoading || !chatInput) return;
    const question = chatInput.value.trim();
    if (!question) return;

    chatInput.value = '';
    addMessage('user', question);
    chatHistory.push({ role: 'user', content: question });
    setLoading(true);

    try {
      const answer = await askGemini(question, chatHistory);
      addMessage('system', answer);
      chatHistory.push({ role: 'model', content: answer });
    } catch (err) {
      console.error('[VersDay] Chat error:', err);
      addMessage('system', '❌ Erro na comunicação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Eventos
  askBtn.addEventListener('click', sendFirstQuestion);
  initialInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendFirstQuestion(); });

  if (sendBtn)  sendBtn.addEventListener('click', sendMessage);
  if (chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
}
