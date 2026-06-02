// js/gemini.js – Configuração para a API da Groq
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Mantenha o mesmo SYSTEM_INSTRUCTION que você já tem (não vou repetir para não poluir)
const SYSTEM_INSTRUCTION = `Você é um assistente teológico especializado...`; // Cole aqui o prompt que você já usava

export async function askGemini(question, conversationHistory = []) {
    // 1. Converte o histórico para o formato da Groq (que é compatível com o da OpenAI)
    const messages = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        })),
        { role: 'user', content: question }
    ];

    try {
        // 2. Faz a requisição para o endpoint correto da Groq
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Modelo recomendado da Groq
                messages: messages,
                temperature: 0.2,
                max_tokens: 1800
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let answer = data.choices[0].message.content;
        answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        answer = answer.replace(/\n/g, '<br>');
        return answer;

    } catch (error) {
        console.error('Erro na Groq API:', error);
        return `❌ Erro: ${error.message}`;
    }
}
