// Chat bíblico via backend seguro. Nenhuma chave privada é enviada ao navegador.
import { getApiBase } from './visual-provider.js';

function safeHtml(markdown='') {
  return String(markdown)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^#{1,6}\s+/gm,'')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/\n\n/g,'<br><br>')
    .replace(/\n/g,'<br>');
}

export async function askGemini(question, conversationHistory=[]) {
  const apiBase = getApiBase();
  if (apiBase === null) {
    throw new Error('O assistente bíblico precisa do backend seguro do VersDay. A chave privada foi removida do navegador.');
  }
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),18_000);
  try {
    const response = await fetch(`${apiBase}/api/chat`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        question:String(question || '').slice(0,4000),
        history:conversationHistory.slice(-12).map(m=>({role:m.role,content:String(m.content || '').replace(/<[^>]*>/g,'').slice(0,5000)}))
      }),
      signal:controller.signal
    });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || `Falha no assistente (HTTP ${response.status}).`);
    return safeHtml(data.answer || '');
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('O assistente demorou demais para responder. Tente novamente.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
