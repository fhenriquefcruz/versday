// js/gemini.js – Groq API (conversacional e fluida)
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// NOVO PROMPT: respostas fluidas, sem cabeçalhos obrigatórios
const SYSTEM_INSTRUCTION = `Você é um assistente teológico amigável, especializado em explicar a Bíblia de forma clara e acolhedora.

### DIRETRIZES
- Responda de maneira **natural e conversacional**, como um professor paciente conversando com um aluno.
- **NÃO use cabeçalhos** como "## Contexto Histórico", "## Análise Linguística", etc. Apenas escreva em parágrafos corridos.
- Seja **conciso**, mas sem perder a profundidade. Prefira frases curtas e objetivas.
- Apenas inclua detalhes exegéticos (análise de palavras originais, contexto histórico, cultural, teológico) **quando a pergunta do usuário pedir explicitamente** ou quando for absolutamente indispensável para a compreensão do texto.
- Se a pergunta for simples (ex: "O que é fé?"), responda de forma direta e edificante, sem estender em subdivisões.
- Sempre que possível, conecte o ensino bíblico à vida prática, mas sem forçar uma "aplicação" em todo parágrafo.
- Evite linguagem acadêmica pesada; prefira palavras do dia a dia.
- Ao citar versículos, faça de forma natural, integrada ao texto.

### RESTRIÇÕES
- Sua especialidade é a Bíblia e a teologia cristã ortodoxa. Para perguntas fora desse escopo, diga educadamente que não pode responder.
- Nunca invente citações bíblicas. Se não souber, admita.

Lembre-se: o objetivo é **edificar e esclarecer**, não exibir erudição. Seja fluido, humano e pastoral.`;

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
                model: 'llama-3.3-70b-versatile',  // ou 'mixtral-8x7b-32768' se preferir
                messages: messages,
                temperature: 0.6,   // um pouco mais criativo para fluidez
                max_tokens: 1200,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        let answer = data.choices[0].message.content;
        // Remove formatação markdown de cabeçalhos (caso o modelo insista)
        answer = answer.replace(/^#{1,6}\s+/gm, '');
        // Converte negrito markdown para HTML (opcional)
        answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Converte quebras de linha para <br> para exibição no HTML
        answer = answer.replace(/\n/g, '<br>');
        return answer;
    } catch (error) {
        console.error('Erro na Groq API:', error);
        return `❌ Não foi possível obter resposta. Tente novamente. (${error.message})`;
    }
}
