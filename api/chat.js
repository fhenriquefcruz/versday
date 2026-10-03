// api/chat.js
import { applyCors, readJsonBody } from './_cors.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const SYSTEM_INSTRUCTION = 'Você é um amigo que entende muito da Bíblia e explica as Escrituras de modo simples, responsável e natural. Seja caloroso, paciente e responda em português brasileiro. Em perguntas históricas ou linguísticas, diferencie fatos, contexto e interpretação. Não invente referências bíblicas. Evite tom de autoridade absoluta quando existirem leituras cristãs legítimas diferentes.';

function normalizeMessages(body) {
  if (Array.isArray(body.messages)) {
    return body.messages
      .filter(item => item && item.role !== 'system')
      .slice(-12)
      .map(item => ({
        role:item.role === 'assistant' || item.role === 'model' ? 'assistant' : 'user',
        content:String(item.content || '').slice(0, 4_000)
      }))
      .filter(item => item.content.trim());
  }

  const history = Array.isArray(body.history) ? body.history : [];
  const normalized = history.slice(-11).map(item => ({
    role:item?.role === 'assistant' || item?.role === 'model' ? 'assistant' : 'user',
    content:String(item?.content || '').slice(0, 4_000)
  })).filter(item => item.content.trim());

  const question = String(body.question || '').trim().slice(0, 4_000);
  if (question) normalized.push({ role:'user', content:question });

  return normalized;
}

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error:'Method not allowed' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(503).json({ error:'Chat provider not configured' });

  try {
    const body = await readJsonBody(req, 40_000);
    const history = normalizeMessages(body);
    const lastUser = [...history].reverse().find(item => item.role === 'user');

    if (!lastUser?.content) {
      return res.status(400).json({ error:'Question required' });
    }

    const messages = [
      { role:'system', content:SYSTEM_INSTRUCTION },
      ...history
    ];

    const response = await fetch(GROQ_URL, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        Authorization:'Bearer ' + apiKey
      },
      body:JSON.stringify({
        model:process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature:0.68,
        max_tokens:1200,
        top_p:0.92
      })
    });

    if (!response.ok) {
      console.error('[VersDay API] Groq status:', response.status);
      return res.status(502).json({ error:'Chat provider failed' });
    }

    const payload = await response.json();
    const answer = String(payload.choices?.[0]?.message?.content || '').trim();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('[VersDay API] chat:', error);
    const status = error.message === 'Payload too large' ? 413 : 500;
    return res.status(status).json({ error:'Chat failed' });
  }
}
