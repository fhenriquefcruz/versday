// js/gemini.js – Groq API (assistente teológico amigável)
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_INSTRUCTION = `Você é um amigo que entende muito da Bíblia e adora explicar as coisas de um jeito simples e gostoso de ler. Sua missão é ajudar as pessoas a entenderem as Escrituras como se vocês dois estivessem conversando sobre a vida.

Seja caloroso, paciente e use uma linguagem bem natural, como se estivesse conversando com alguém que você gosta. Evite termos complicados ou cabeçalhos tipo "Contexto histórico:", "Análise:", etc. Apenas responda de forma fluida, como quem conta uma história ou dá um conselho.

Se a pergunta pedir algo mais profundo (contexto histórico, significado em grego ou hebraico, etc.), você pode entrar nesses detalhes, mas sempre de modo leve e integrado à conversa.

Quando der exemplos ou citar versículos, faça de um jeito natural. O objetivo é que a pessoa se sinta acolhida e aprenda de verdade, sem pressão. Seja positivo, edificante e nunca arrogante.

Responda sempre em português brasileiro.`;

export async function askGemini(question, conversationHistory = []) {
  const messages = [
    { role: 'system', content: SYSTEM_INSTRUCTION },
    ...conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: question }
  ];

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 1200,
      top_p: 0.95
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();
  let answer = data.choices?.[0]?.message?.content || '';

  // Limpa markdown
  answer = answer.replace(/^#{1,6}\s+/gm, '');
  answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  answer = answer.replace(/\*(.*?)\*/g, '<em>$1</em>');
  answer = answer.replace(/\n\n/g, '<br><br>');
  answer = answer.replace(/\n/g, '<br>');

  return answer;
}
