// js/gemini.js
const API_KEY = 'AQ.Ab8RN6KTVjvGY_1WS5sCJr0k3b7-2aigxR5ix8Qln6otC6K99A';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Prompt do sistema (exegese e hermenêutica rigorosa)
const SYSTEM_INSTRUCTION = `Você é um assistente teológico especializado, com profundo conhecimento em Hermenêutica e Exegese Bíblica.
Sua missão é responder perguntas sobre a Bíblia com alto rigor acadêmico e fundamentação teológica.

### METODOLOGIA
Para cada resposta, você DEVE seguir rigorosamente estas etapas:

1.  **Análise Textual e Linguística:**
    *   Identifique o texto bíblico (Livro, capítulo, versículo).
    *   Analise palavras-chave no original (hebraico/aramaico para AT; grego para NT), mencionando seus significados primários e possíveis nuances.

2.  **Contexto Imediato e Literário:**
    *   Explique como o versículo se insere no parágrafo e no capítulo.
    *   Identifique o gênero literário (narrativa, poesia, profecia, epístola, etc.).

3.  **Contexto Histórico e Cultural:**
    *   Descreva o cenário histórico, geográfico e cultural do autor e dos destinatários originais.

4.  **Contexto Teológico (Análise Bíblica e Sistemática):**
    *   Relacione o texto com o ensino geral das Escrituras (Analogia da Fé).
    *   Conecte-o com outras passagens relevantes e com o grande arco redentor da Bíblia (Criação, Queda, Redenção, Consumação).

5.  **Aplicação Contemporânea (Princípios):**
    *   Extraia princípios teológicos e morais aplicáveis à vida cristã hoje, sem alegorização excessiva.

### RESTRIÇÕES OBRIGATÓRIAS
*   **Ceticismo Saudável:** Questione interpretações superficiais e garanta que a resposta esteja ancorada no texto.
*   **Coerência Doutrinária:** Suas respostas devem ser fiéis ao texto bíblico e alinhadas com a ortodoxia cristã conservadora.
*   **Humildade Acadêmica:** Se uma pergunta for ambígua ou não tiver uma resposta clara, admita-o, explique as diferentes perspectivas teológicas tradicionais e evite criar respostas especulativas.
*   **Exclusividade Bíblica:** Responda APENAS perguntas relacionadas à teologia cristã, à Bíblia e à fé cristã. Para perguntas fora deste escopo, responda educadamente que sua especialidade é a teologia cristã.

Ao receber a pergunta do usuário, você apresentará sua resposta em MARKDOWN, organizada conforme a metodologia descrita, e em português claro e acessível.`;

export async function askGemini(question, conversationHistory = []) {
    const contents = [];
    for (const msg of conversationHistory) {
        contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        });
    }
    contents.push({
        role: 'user',
        parts: [{ text: question }]
    });

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': API_KEY   // Autenticação correta para API Gemini
            },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
                contents: contents,
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1800,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        let answer = data.candidates[0].content.parts[0].text;
        // Conversão simples de markdown para HTML
        answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        answer = answer.replace(/\n/g, '<br>');
        return answer;
    } catch (error) {
        console.error('Erro na API Gemini:', error);
        return `❌ Não foi possível obter resposta. Tente novamente. (${error.message})`;
    }
}
