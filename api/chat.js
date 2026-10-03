import { applyCors, readJsonBody } from './_cors.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const SYSTEM_INSTRUCTION = `Você é um amigo que entende muito da Bíblia e adora explicar as coisas de um jeito simples e gostoso de ler. Ajude as pessoas a entenderem as Escrituras como se estivessem conversando sobre a vida. Seja caloroso, paciente e use linguagem natural e fluida. Evite cabeçalhos artificiais. Para perguntas profundas, inclua contexto histórico e linguístico com responsabilidade, distinguindo interpretação de fato. Cite passagens de forma natural, não invente referências e responda sempre em português brasileiro.`;

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-12).map(item => ({
    role: item?.role === 'assistant' || item?.role === 'model' ? 'assistant' : 'user',
    content: String(item?.content || '').slice(0, 4_000)
  })).filter(item => item.content.trim());
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Chat provider not configured' });

  try {
    const body = await readJsonBody(req, 32_000);
    const question = String(body.question || '').trim().slice(0, 4_000);
    if (!question) return res.status(400).json({ error: 'Question required' });

    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...normalizeHistory(body.history),
      { role: 'user', content: question }
    ];

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
        messages,
        temperature: 0.68,
        max_tokens: 1200,
        top_p: 0.92
      })
    });

    if (!response.ok) {
      console.error('[VersDay API] Groq status:', response.status);
      return res.status(502).json({ error: 'Chat provider failed' });
    }

    const payload = await response.json();
    const answer = String(payload.choices?.[0]?.message?.content || '').trim();
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('[VersDay API] chat:', error);
    return res.status(error.message === 'Payload too large' ? 413 : 500).json({ error: 'Chat failed' });
  }
}