// js/gemini.js — Groq API
// IMPORTANTE: A chave abaixo foi reportada como inválida (erro 401).
// O usuário deve substituir por uma chave válida em https://console.groq.com/keys
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_INSTRUCTION = `Você é um amigo que entende muito da Bíblia e adora explicar as coisas de um jeito simples e gostoso de ler. Ajude as pessoas a entenderem as Escrituras como se estivessem conversando sobre a vida.

Seja caloroso, paciente e use linguagem natural e fluida. Evite cabeçalhos como "Contexto histórico:" ou "Análise:". Responda como quem conta uma história ou dá um conselho.

Para perguntas profundas (contexto histórico, grego, hebraico), inclua os detalhes de modo leve e integrado. Cite versículos de forma natural. Seja positivo, edificante e nunca arrogante. Responda sempre em português brasileiro.`;

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
      temperature: 0.72,
      max_tokens: 1200,
      top_p: 0.95
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `HTTP ${response.status}`;
    // Erro 401 = chave inválida — instrui o usuário
    if (response.status === 401) {
      throw new Error('Chave da API inválida. Acesse console.groq.com/keys e atualize GROQ_API_KEY em js/gemini.js');
    }
    throw new Error(msg);
  }

  const data = await response.json();
  let answer = data.choices?.[0]?.message?.content || '';
  answer = answer.replace(/^#{1,6}\s+/gm, '');
  answer = answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  answer = answer.replace(/\*(.*?)\*/g, '<em>$1</em>');
  answer = answer.replace(/\n\n/g, '<br><br>');
  answer = answer.replace(/\n/g, '<br>');
  return answer;
}
