// js/chat.js
import { askGemini } from './gemini.js';

let chatHistory = [];
let isLoading = false;

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;' }[m]));
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

  if (!initialInput || !askBtn || !chatContainer || !chatMessages) {
    console.warn('[VersDay] Elementos do chat não encontrados.');
    return;
  }

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `chat-message ${role}`;
    div.innerHTML = role === 'user'
      ? `<strong>Você</strong>${escapeHtml(text)}`
      : `<strong>Assistente Teológico</strong>${text}`;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function setLoading(state) {
    isLoading = state;
    if (chatLoading) chatLoading.style.display = state ? 'block' : 'none';
    if (askBtn)  askBtn.disabled  = state;
    if (sendBtn) sendBtn.disabled = state;
    if (chatInput) chatInput.disabled = state;
  }

  async function sendFirstQuestion() {
    if (isLoading) return;
    const question = initialInput.value.trim();
    if (!question) { initialInput.focus(); return; }

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
      console.error('[VersDay] Chat erro:', err);
      addMessage('system', `❌ ${err.message || 'Erro na comunicação. Tente novamente.'}`);
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
      console.error('[VersDay] Chat erro:', err);
      addMessage('system', `❌ ${err.message || 'Erro na comunicação. Tente novamente.'}`);
    } finally {
      setLoading(false);
    }
  }

  askBtn.addEventListener('click', sendFirstQuestion);
  initialInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendFirstQuestion(); });
  if (sendBtn)   sendBtn.addEventListener('click', sendMessage);
  if (chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
}
