// js/chat.js
import { askGemini, isChatAvailable, checkChatAvailability } from './gemini.js';

let chatHistory = [];
let isLoading = false;
let chatAvailable = false;

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

  const defaultPlaceholder = initialInput.placeholder;

  function applyAvailability(available, checking = false) {
    chatAvailable = Boolean(available);

    const disabled = checking || !chatAvailable;
    initialInput.disabled = disabled;
    askBtn.disabled = disabled;
    if (chatInput) chatInput.disabled = disabled;
    if (sendBtn) sendBtn.disabled = disabled;

    if (checking) {
      initialInput.placeholder = 'Verificando assistente...';
      askBtn.title = 'Verificando o backend seguro do VersDay.';
    } else if (chatAvailable) {
      initialInput.placeholder = defaultPlaceholder;
      askBtn.title = '';
    } else {
      initialInput.placeholder = 'Assistente temporariamente indisponível';
      askBtn.title = 'O provider do assistente ainda não está disponível no backend seguro.';
    }
  }

  if (!isChatAvailable()) {
    applyAvailability(false);
  } else {
    applyAvailability(false, true);
    checkChatAvailability()
      .then(available => applyAvailability(available))
      .catch(() => applyAvailability(false));
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

    const disabled = state || !chatAvailable;
    if (askBtn) askBtn.disabled = disabled;
    if (sendBtn) sendBtn.disabled = disabled;
    if (chatInput) chatInput.disabled = disabled;
    if (initialInput) initialInput.disabled = disabled;
  }

  async function sendFirstQuestion() {
    if (isLoading || !chatAvailable) return;
    const question = initialInput.value.trim();
    if (!question) { initialInput.focus(); return; }

    const priorHistory = [...chatHistory];

    if (promptDiv) promptDiv.style.display = 'none';
    chatContainer.style.display = 'block';
    addMessage('user', question);
    chatHistory.push({ role: 'user', content: question });
    setLoading(true);

    try {
      const answer = await askGemini(question, priorHistory);
      addMessage('system', answer);
      chatHistory.push({ role: 'model', content: answer });
    } catch (err) {
      console.error('[VersDay] Chat erro:', err);
      addMessage('system', `❌ ${err.message || 'Erro na comunicação. Tente novamente.'}`);
      if (err?.status === 503) applyAvailability(false);
    } finally {
      setLoading(false);
      if (chatAvailable && chatInput) chatInput.focus();
    }
  }

  async function sendMessage() {
    if (isLoading || !chatAvailable || !chatInput) return;
    const question = chatInput.value.trim();
    if (!question) return;

    const priorHistory = [...chatHistory];

    chatInput.value = '';
    addMessage('user', question);
    chatHistory.push({ role: 'user', content: question });
    setLoading(true);

    try {
      const answer = await askGemini(question, priorHistory);
      addMessage('system', answer);
      chatHistory.push({ role: 'model', content: answer });
    } catch (err) {
      console.error('[VersDay] Chat erro:', err);
      addMessage('system', `❌ ${err.message || 'Erro na comunicação. Tente novamente.'}`);
      if (err?.status === 503) applyAvailability(false);
    } finally {
      setLoading(false);
    }
  }

  askBtn.addEventListener('click', sendFirstQuestion);
  initialInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendFirstQuestion(); });
  if (sendBtn)   sendBtn.addEventListener('click', sendMessage);
  if (chatInput) chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
}