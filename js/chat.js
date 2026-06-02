// js/chat.js
import { askGemini } from './gemini.js';

let chatHistory = [];
let isLoading = false;

export function initChat() {
    const initialInput = document.getElementById('initialQuestion');
    const askBtn = document.getElementById('askInitialBtn');
    const chatContainer = document.getElementById('chatContainer');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendChatBtn');
    const chatLoading = document.getElementById('chatLoading');

    if (!askBtn || !initialInput) {
        console.warn('Elementos do chat não encontrados');
        return;
    }

    async function sendFirstQuestion() {
        if (isLoading) return;
        const question = initialInput.value.trim();
        if (!question) {
            alert('Digite sua pergunta bíblica.');
            return;
        }

        const promptDiv = document.querySelector('.question-prompt');
        if (promptDiv) promptDiv.style.display = 'none';
        chatContainer.style.display = 'block';

        addMessage('user', question);
        chatHistory.push({ role: 'user', content: question });

        isLoading = true;
        chatLoading.style.display = 'block';
        scrollToBottom();

        try {
            const answer = await askGemini(question, chatHistory);
            addMessage('system', answer);
            chatHistory.push({ role: 'model', content: answer });
        } catch (err) {
            addMessage('system', '❌ Erro na comunicação. Tente novamente.');
        } finally {
            isLoading = false;
            chatLoading.style.display = 'none';
            scrollToBottom();
            if (chatInput) chatInput.focus();
        }
    }

    async function sendMessage() {
        if (isLoading) return;
        const question = chatInput.value.trim();
        if (!question) return;

        addMessage('user', question);
        chatInput.value = '';
        chatHistory.push({ role: 'user', content: question });

        isLoading = true;
        chatLoading.style.display = 'block';
        scrollToBottom();

        try {
            const answer = await askGemini(question, chatHistory);
            addMessage('system', answer);
            chatHistory.push({ role: 'model', content: answer });
        } catch (err) {
            addMessage('system', '❌ Erro na comunicação. Tente novamente.');
        } finally {
            isLoading = false;
            chatLoading.style.display = 'none';
            scrollToBottom();
        }
    }

    function addMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${role}`;
        if (role === 'user') {
            msgDiv.innerHTML = `<strong>Você:</strong><br>${escapeHtml(text)}`;
        } else {
            msgDiv.innerHTML = `<strong>Assistente Teológico:</strong><br>${text}`;
        }
        chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function scrollToBottom() {
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function escapeHtml(str) {
        return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    }

    askBtn.onclick = sendFirstQuestion;
    if (sendBtn) sendBtn.onclick = sendMessage;
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    initialInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendFirstQuestion();
    });
}
