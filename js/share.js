import { appState } from './state.js'; [cite: 5739]

// ========== MAPEAMENTO DE LIVROS ==========
const BOOK_NAMES = {
  "gn":"Gênesis","ex":"Êxodo","lv":"Levítico","nm":"Números","dt":"Deuteronômio",
  "js":"Josué","jz":"Juízes","rt":"Rute","1sm":"1 Samuel","2sm":"2 Samuel",
  "1rs":"1 Reis","2rs":"2 Reis","1cr":"1 Crônicas","2cr":"2 Crônicas","ed":"Esdras",
  "ne":"Neemias","et":"Ester","jó":"Jó","sl":"Salmos","pv":"Provérbios",
  "ec":"Eclesiastes","ct":"Cantares","is":"Isaías","jr":"Jeremias","lm":"Lamentações",
  "ez":"Ezequiel","dn":"Daniel","os":"Oséias","jl":"Joel","am":"Amós",
  "ob":"Obadias","jn":"Jonas","mq":"Miquéias","na":"Naum","hc":"Habacuque",
  "sf":"Sofonias","ag":"Ageu","zc":"Zacarias","ml":"Malaquias",
  "mt":"Mateus","mc":"Marcos","lc":"Lucas","jo":"João","atos":"Atos","rm":"Romanos",
  "1co":"1 Coríntios","2co":"2 Coríntios","gl":"Gálatas","ef":"Efésios","fp":"Filipenses",
  "cl":"Colossenses","1ts":"1 Tessalonicenses","2ts":"2 Tessalonicenses","1tm":"1 Timóteo",
  "2tm":"2 Timóteo","tt":"Tito","fm":"Filemom","hb":"Hebreus","tg":"Tiago",
  "1pe":"1 Pedro","2pe":"2 Pedro","1jo":"1 João","2jo":"2 João","3jo":"3 João",
  "jd":"Judas","ap":"Apocalipse"
}; [cite: 5740]

function getBookName(abbrev) {
  return BOOK_NAMES[abbrev] || abbrev;
} [cite: 5741]

// ========== FUNÇÕES AUXILIARES DE RENDERIZAÇÃO ==========

// Quebra o texto respeitando a largura máxima e mantendo a fluidez visual
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' '); [cite: 5741]
  const lines = []; [cite: 5742]
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word; [cite: 5742, 5743]
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current); [cite: 5743]
      current = word; [cite: 5743]
    } else {
      current = test; [cite: 5744]
    }
  }
  if (current) lines.push(current); [cite: 5744]
  return lines; [cite: 5744]
}

// Desenha retângulos com bordas arredondadas de alta precisão
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); [cite: 5745]
  ctx.beginPath(); [cite: 5746]
  ctx.moveTo(x + r, y); [cite: 5746]
  ctx.lineTo(x + w - r, y); [cite: 5746]
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); [cite: 5747]
  ctx.lineTo(x + w, y + h - r); [cite: 5747]
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); [cite: 5748]
  ctx.lineTo(x + r, y + h); [cite: 5748]
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); [cite: 5749]
  ctx.lineTo(x, y + r); [cite: 5749]
  ctx.quadraticCurveTo(x, y, x + r, y); [cite: 5749]
  ctx.closePath(); [cite: 5750]
}

// ========== GERAÇÃO DA IMAGEM ULTRA-HD (9:16) ==========
export async function generateShareImage() {
  if (!appState.currentVerse) return null; [cite: 5750]
  const verse = appState.currentVerse; [cite: 5751]
  const fullBook = getBookName(verse.book); [cite: 5751]
  const refText  = `${fullBook} ${verse.chapter}:${verse.verse}`; [cite: 5751]
  
  const W = 1080, H = 1920; [cite: 5752]
  const canvas = document.createElement('canvas'); [cite: 5752]
  canvas.width = W; canvas.height = H; [cite: 5752]
  const ctx = canvas.getContext('2d'); [cite: 5753]

  // GARANTIA DE NITIDEZ: Ativa suavização máxima vetorial no motor do canvas
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // ── 1. Fundo fotográfico com tratamento ──
  const bgUrl = appState.currentBackgroundImageUrl ||
    'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1920'; [cite: 5753, 5754]
  const bgImg = new Image(); [cite: 5754]
  bgImg.crossOrigin = 'Anonymous'; [cite: 5754]
  await new Promise(resolve => { bgImg.onload = resolve; bgImg.onerror = resolve; bgImg.src = bgUrl; }); [cite: 5754]
  
  if (bgImg.complete && bgImg.naturalWidth > 0) {
    const scale = Math.max(W / bgImg.width, H / bgImg.height); [cite: 5755]
    const ox = (W - bgImg.width  * scale) / 2; [cite: 5756]
    const oy = (H - bgImg.height * scale) / 2; [cite: 5757]
    ctx.drawImage(bgImg, ox, oy, bgImg.width * scale, bgImg.height * scale); [cite: 5757]
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H); [cite: 5758]
    grad.addColorStop(0,   '#1a2535'); [cite: 5758]
    grad.addColorStop(0.5, '#0d1520'); [cite: 5758]
    grad.addColorStop(1,   '#070d18'); [cite: 5759]
    ctx.fillStyle = grad; [cite: 5759]
    ctx.fillRect(0, 0, W, H); [cite: 5760]
  }

  // ── 2. Overlay multicamada escuro e imersivo ──
  const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.4); [cite: 5760]
  topGrad.addColorStop(0,   'rgba(13, 17, 23, 0.88)');
  topGrad.addColorStop(1,   'rgba(13, 17, 23, 0.25)');
  ctx.fillStyle = topGrad; [cite: 5761]
  ctx.fillRect(0, 0, W, H * 0.4); [cite: 5761]

  const botGrad = ctx.createLinearGradient(0, H * 0.55, 0, H); [cite: 5762]
  botGrad.addColorStop(0,   'rgba(13, 17, 23, 0.25)');
  botGrad.addColorStop(1,   'rgba(13, 17, 23, 0.94)');
  ctx.fillStyle = botGrad; [cite: 5762]
  ctx.fillRect(0, H * 0.55, W, H * 0.45); [cite: 5763]

  const midVeil = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.75); [cite: 5763]
  midVeil.addColorStop(0,   'rgba(0,0,0,0.42)');
  midVeil.addColorStop(1,   'rgba(0,0,0,0.0)');
  ctx.fillStyle = midVeil; [cite: 5764]
  ctx.fillRect(0, 0, W, H); [cite: 5764]

  const PAD = 96; [cite: 5764]

  // ── 3. Aspas de abertura conceituais ──
  ctx.save();
  ctx.font = `italic 280px 'Lora', 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228, 179, 99, 0.16)'; [cite: 5769]
  ctx.shadowBlur = 0; [cite: 5770]
  ctx.fillText('\u201C', PAD - 10, H * 0.42);
  ctx.restore();

  // ── 4. Texto do Versículo (Elegante e Fluído) ──
  const textLen = verse.text.length; [cite: 5771]
  let fontSize = textLen > 220 ? 54 : textLen > 160 ? 62 : textLen > 110 ? 70 : 78; [cite: 5771, 5772]

  ctx.save();
  ctx.textAlign = 'center'; [cite: 5772]
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${fontSize}px 'Lora', 'Georgia', serif`;
  ctx.fillStyle = '#ECE8E0'; [cite: 5773]
  ctx.shadowColor = 'rgba(0,0,0,0.65)'; [cite: 5773]
  ctx.shadowBlur = 20; [cite: 5773]
  ctx.shadowOffsetX = 0; [cite: 5773]
  ctx.shadowOffsetY = 2; [cite: 5774]

  const maxW = W - PAD * 2.5; [cite: 5774]
  const lines = wrapText(ctx, verse.text, maxW); [cite: 5774]
  const lineH = fontSize * 1.62; // Altura de linha fluída (estilo editorial) 
  const blockH = lines.length * lineH; [cite: 5775]
  const startY = H / 2 - blockH / 2 + fontSize * 0.2; [cite: 5776]

  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineH); [cite: 5777]
  });
  ctx.restore();

  // ── 5. Aspas de fechamento ──
  const lastY = startY + (lines.length - 1) * lineH; [cite: 5778]
  ctx.save();
  ctx.textAlign = 'center'; [cite: 5779]
  ctx.font = `italic 280px 'Lora', 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228, 179, 99, 0.16)'; [cite: 5779]
  ctx.fillText('\u201D', W - PAD + 10, lastY + 110);
  ctx.restore();

  // ── 6. Pílula de Referência Bíblica ──
  const refY = lastY + lineH + 72; [cite: 5781]

  ctx.save();
  ctx.font = `600 42px 'Inter', sans-serif`; [cite: 5782]
  ctx.textAlign = 'center'; [cite: 5782]
  const refMeasure = ctx.measureText(refText).width; [cite: 5782]
  const pillW = refMeasure + 86; [cite: 5782]
  const pillH = 76; [cite: 5783]
  const pillX = W / 2 - pillW / 2; [cite: 5783]
  const pillYtop = refY - pillH + 16; [cite: 5784]

  // Fundo opaco para legibilidade
  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)'; [cite: 5784]
  roundRect(ctx, pillX, pillYtop, pillW, pillH, 38); [cite: 5785]
  ctx.fill(); [cite: 5785]

  // Contorno acetinado fino
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5; [cite: 5785]
  roundRect(ctx, pillX, pillYtop, pillW, pillH, 38); [cite: 5786]
  ctx.stroke(); [cite: 5786]

  // Texto em Destaque Ouro
  ctx.fillStyle = '#E4B363'; [cite: 5786]
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; [cite: 5786]
  ctx.shadowBlur = 8; [cite: 5787]
  ctx.fillText(refText, W / 2, refY); [cite: 5787]
  ctx.restore();

  // ── 7. ASSINATURA DE MARCA CONCEITUAL "VERS DAY" (Substituição Avançada) ──
  ctx.save();
  ctx.textAlign = 'center'; [cite: 5787]
  
  // Pequena joia geométrica (ponto minimalista dourado)
  ctx.beginPath();
  ctx.arc(W / 2, H - 150, 5, 0, 2 * Math.PI);
  ctx.fillStyle = '#E4B363';
  ctx.fill();

  // Branding tipográfico com tracking espaçado de luxo
  ctx.font = `300 30px 'Inter', sans-serif`; [cite: 5788]
  ctx.fillStyle = 'rgba(236, 232, 224, 0.45)'; [cite: 5788]
  ctx.shadowBlur = 0; [cite: 5788]
  ctx.fillText("V E R S   D A Y", W / 2, H - 95);
  ctx.restore();

  // Exporta em alta definição JPEG (0.95 preserva os canais de cor e blinda contra compressão do IG)
  return canvas.toDataURL('image/jpeg', 0.95);
}

// ========== GERENCIAMENTO DE COMPARTILHAMENTO / INTERAÇÃO ==========

function showToast(msg) {
  let t = document.getElementById('vd-toast'); [cite: 5790]
  if (!t) {
    t = document.createElement('div'); [cite: 5790]
    t.id = 'vd-toast'; [cite: 5791]
    t.style.cssText = `
      position:fixed; bottom:32px; left:50%;
      transform:translateX(-50%) translateY(16px);
      background:rgba(16,22,32,0.96);
      color:#ECE8E0;
      padding:13px 26px;
      border-radius:100px;
      font:500 0.88rem/1 'Inter',sans-serif;
      letter-spacing:.02em;
      border:1px solid rgba(228,179,99,0.35);
      box-shadow:0 8px 32px rgba(0,0,0,0.45);
      z-index:9999;
      opacity:0;
      transition:opacity .22s ease, transform .22s ease;
      pointer-events:none;
      white-space:nowrap;
      max-width:90vw;
      text-align:center;
    `; [cite: 5791, 5792, 5793]
    document.body.appendChild(t); [cite: 5793]
  }
  t.textContent = msg; [cite: 5793]
  t.style.opacity = '1'; [cite: 5793]
  t.style.transform = 'translateX(-50%) translateY(0)'; [cite: 5793]
  clearTimeout(t._tid); [cite: 5793]
  t._tid = setTimeout(() => {
    t.style.opacity = '0'; [cite: 5794]
    t.style.transform = 'translateX(-50%) translateY(16px)'; [cite: 5794]
  }, 3200); [cite: 5794]
}

async function blobFromDataUrl(dataUrl) {
  return fetch(dataUrl).then(r => r.blob()); [cite: 5795]
}

function forceDownload(dataUrl, filename) {
  const a = document.createElement('a'); [cite: 5795]
  a.href = dataUrl; a.download = filename; [cite: 5796]
  document.body.appendChild(a); a.click(); [cite: 5796]
  document.body.removeChild(a); [cite: 5796]
}

export async function shareWhatsApp() {
  showToast('⏳ A processar imagem de alta fidelidade...'); [cite: 5796]
  const dataUrl = await generateShareImage(); [cite: 5797]
  if (!dataUrl) { showToast('❌ Erro ao gerar imagem.'); return; } [cite: 5797]

  const blob = await blobFromDataUrl(dataUrl); [cite: 5798]
  const file = new File([blob], 'versday_whatsapp.jpg', { type: 'image/jpeg' });
  
  if (navigator.canShare?.({ files: [file] })) { [cite: 5799]
    try {
      await navigator.share({
        files: [file],
        title: 'VersDay',
        text: appState.currentVerse
          ? `"${appState.currentVerse.text}" — ${getBookName(appState.currentVerse.book)} ${appState.currentVerse.chapter}:${appState.currentVerse.verse}`
          : '' [cite: 5799]
      });
      return; [cite: 5800]
    } catch (e) {
      if (e.name === 'AbortError') return; [cite: 5800]
    }
  }
  forceDownload(dataUrl, 'versday_whatsapp.jpg');
  showToast('📥 Imagem Ultra-HD guardada!');
}

export async function shareInstagram() {
  showToast('⏳ A otimizar imagem para o Instagram (9:16)...'); [cite: 5802]
  const dataUrl = await generateShareImage(); [cite: 5802]
  if (!dataUrl) { showToast('❌ Erro ao gerar imagem.'); return; } [cite: 5803]
  
  forceDownload(dataUrl, 'versday_instagram_story.jpg'); [cite: 5803]
  showToast('📸 Imagem Ultra-HD salva! Abra o Instagram → Stories.'); [cite: 5804]
}

export function copyVerseText() {
  if (!appState.currentVerse) return; [cite: 5804]
  const v = appState.currentVerse; [cite: 5805]
  const text = `"${v.text}" — ${getBookName(v.book)} ${v.chapter}:${v.verse} (ARA)`; [cite: 5805]
  navigator.clipboard.writeText(text) [cite: 5806]
    .then(() => showToast('📋 Versículo copiado para a área de transferência!')) [cite: 5806]
    .catch(() => {
      const el = document.createElement('textarea'); [cite: 5806]
      el.value = text; [cite: 5806]
      document.body.appendChild(el); [cite: 5806]
      el.select(); [cite: 5806]
      document.execCommand('copy'); [cite: 5806]
      document.body.removeChild(el); [cite: 5806]
      showToast('📋 Versículo copiado!'); [cite: 5806]
    });
}
