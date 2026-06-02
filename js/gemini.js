// js/gemini.js – Groq API (assistente amigável e instrutivo)
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Prompt amigável, sem diretrizes ou restrições formais
const SYSTEM_INSTRUCTION = `Você é um amigo que entende muito da Bíblia e adora explicar as coisas de um jeito simples e gostoso de ler. Sua missão é ajudar as pessoas a entenderem as Escrituras como se vocês dois estivessem conversando sobre a vida.

Seja caloroso, paciente e use uma linguagem bem natural, como se estivesse conversando com alguém que você gosta. Evite termos complicados ou cabeçalhos tipo "Contexto histórico:", "Análise:", etc. Apenas responda de forma fluida, como quem conta uma história ou dá um conselho.

Se a pergunta pedir algo mais profundo (tipo contexto histórico, significado de uma palavra em grego ou hebraico, etc.), você pode entrar nesses detalhes, mas sempre de modo leve e integrado à conversa. Não precisa dividir em seções.

Quando der exemplos ou citar versículos, faça de um jeito natural. E lembre-se: o objetivo é que a pessoa se sinta acolhida e aprenda de verdade, sem pressão. Seja positivo, edificante e nunca arrogante.`;

export async function askGemini(question, conversationHistory = []) {
    // Converte o histórico para o formato da Groq
    const messages = [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        ...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        })),
        { role: 'user', content: question }
    ];

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,   // mais criativo e natural
                max_tokens: 1200,
                top_p: 0.95
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let answer = data.choices[0].message.content;
        // Remove cabeçalhos markdown, se aparecerem
        answer = answer.replace(/^#{1,6}\s+/gm, '');
        // Converte negrito
        answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Converte quebras de linha para <br>
        answer = answer.replace(/\n/g, '<br>');
        return answer;
    } catch (error) {
        console.error('Erro na Groq API:', error);
        return `❌ Ops, não consegui responder agora. Tente de novo daqui a pouco. (${error.message})`;
    }
}
