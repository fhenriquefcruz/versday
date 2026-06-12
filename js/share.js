import { appState } from './state.js';

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
};

function getBookName(abbrev) {
  return BOOK_NAMES[abbrev] || abbrev;
}

// Quebra texto respeitando largura máxima
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Retângulo com bordas arredondadas
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Gera canvas 1080×1920 (9:16 — Stories/Reels/Feed vertical)
// ============================================================================
// SUBSTITUI DESDE AQUI (Procure por generateShareImage no seu ficheiro)
// ============================================================================

// Otimização e Ajuste Premium para Geração da Imagem de Partilha
export async function generateShareImage() {
  if (!appState.currentVerse) return null;
  const verse = appState.currentVerse;
  const refText = `${getBookName(verse.book)} ${verse.chapter}:${verse.verse}`;

  // Cria um canvas em alta resolução nativa (1080x1920 - Proporção Perfeita 9:16 para Stories/Reels)
  const canvas = document.createElement('canvas');
  const W = 1080;
  const H = 1920;
  canvas.width = W;
  canvas.height = H;
  
  const ctx = canvas.getContext('2d');
  
  // GARANTIA DE NITIDEZ MÁXIMA: Força suavização de imagem no topo do motor do browser
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // ── 1. Fundo fotográfico com tratamento ──
  const bgUrl = appState.currentBackgroundImageUrl || 'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1920';
  const bgImg = new Image();
  bgImg.crossOrigin = 'Anonymous';
  
  await new Promise(resolve => { 
    bgImg.onload = resolve; 
    bgImg.onerror = resolve; 
    bgImg.src = bgUrl; 
  });

  if (bgImg.complete && bgImg.naturalWidth > 0) {
    const scale = Math.max(W / bgImg.width, H / bgImg.height);
    const ox = (W - bgImg.width * scale) / 2;
    const oy = (H - bgImg.height * scale) / 2;
    ctx.drawImage(bgImg, ox, oy, bgImg.width * scale, bgImg.height * scale);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a2535');
    grad.addColorStop(0.5, '#0d1520');
    grad.addColorStop(1, '#070d18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. Overlay multicamada escuro e imersivo ──
  const topGrad = ctx.createLinearGradient(0, 0, 0, H);
  topGrad.addColorStop(0, 'rgba(13, 17, 23, 0.85)');
  topGrad.addColorStop(0.3, 'rgba(13, 17, 23, 0.55)');
  topGrad.addColorStop(0.7, 'rgba(13, 17, 23, 0.55)');
  topGrad.addColorStop(1, 'rgba(13, 17, 23, 0.92)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 3. Aspas de abertura conceituais ──
  const PAD = 90;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `italic 260px 'Lora', 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228, 179, 99, 0.15)';
  ctx.fillText('\u201C', PAD + 30, 420);
  ctx.restore();

  // ── 4. Renderização do Texto do Versículo (Elegante e Fluído) ──
  ctx.save();
  ctx.fillStyle = '#ECE8E0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const fontSize = 54;
  ctx.font = `400 ${fontSize}px 'Lora', 'Georgia', serif`;
  
  const maxW = W - PAD * 2.4;
  const lines = wrapText(ctx, verse.text, maxW);
  const lineH = fontSize * 1.62; // Alinhado com a fluidez do CSS comercial
  const blockH = lines.length * lineH;
  const startY = H / 2 - blockH / 2 - 40; // Deslocado ligeiramente para cima para balancear com o rodapé

  lines.forEach((line, i) => { 
    ctx.fillText(line, W / 2, startY + i * lineH); 
  });
  ctx.restore();

  // ── 5. Aspas de fechamento ──
  const lastY = startY + (lines.length - 1) * lineH;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `italic 260px 'Lora', 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228, 179, 99, 0.15)';
  ctx.fillText('\u201D', W - PAD - 30, lastY + 120);
  ctx.restore();

  // ── 6. Pílula de Referência Bíblica ──
  const refY = lastY + lineH + 90;
  ctx.save();
  ctx.font = `600 38px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  
  const refMeasure = ctx.measureText(refText).width;
  const pillW = refMeasure + 80;
  const pillH = 76;
  const pillX = W / 2 - pillW / 2;
  const pillYtop = refY - pillH / 2;

  // Desenho da pílula com cantos arredondados premium
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.roundRect(pillX, pillYtop, pillW, pillH, 38);
  ctx.fill();
  ctx.stroke();

  // Texto da referência dentro da pílula
  ctx.fillStyle = '#E4B363';
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;
  ctx.fillText(refText, W / 2, refY + 12);
  ctx.restore();

  // ── 7. ASSINATURA DE MARCA CONCEITUAL "VERS DAY" ──
  ctx.save();
  ctx.textAlign = 'center';
  
  // Pequeno ponto minimalista geométrico dourado
  ctx.beginPath();
  ctx.arc(W / 2, H - 180, 5, 0, 2 * Math.PI);
  ctx.fillStyle = '#E4B363'; 
  ctx.fill();

  // Branding tipográfico com espaçamento sofisticado
  ctx.font = `300 28px 'Inter', sans-serif`;
  ctx.fillStyle = 'rgba(236, 232, 224, 0.4)'; 
  ctx.fillText("V E R S   D A Y", W / 2, H - 130);
  ctx.restore();

  // Retorna em alta qualidade JPEG (0.95 evita a re-compressão agressiva do Instagram)
  return canvas.toDataURL('image/jpeg', 0.95);
}

// ── FUNÇÕES DE COMPARTILHAMENTO ATUALIZADAS ──
export async function shareInstagram() {
  showToast('⏳ A otimizar imagem para o Instagram...');
  const dataUrl = await generateShareImage();
  if (!dataUrl) {
    showToast('❌ Erro ao processar a imagem.');
    return;
  }
  forceDownload(dataUrl, 'versday_instagram_story.jpg');
  showToast('📸 Imagem Ultra-HD salva! Pronta para Stories ou Reels.');
}

export async function shareWhatsApp() {
  const dataUrl = await generateShareImage();
  if (!dataUrl) {
    showToast('❌ Erro ao gerar imagem.');
    return;
  }
  
  const verse = appState.currentVerse;
  const refText = verse ? `${getBookName(verse.book)} ${verse.chapter}:${verse.verse}` : '';
  const blob = await blobFromDataUrl(dataUrl);
  const file = new File([blob], 'versday_share.jpg', { type: 'image/jpeg' });
  
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'VersDay',
        text: verse ? `"${verse.text}" — ${refText}` : ''
      });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  forceDownload(dataUrl, 'versday_share.jpg');
  showToast('📥 Imagem salva com qualidade máxima!');
}

// Função auxiliar estável para quebra de linhas no Canvas
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}
// Toast não-bloqueante
function showToast(msg) {
  let t = document.getElementById('vd-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'vd-toast';
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
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._tid);
  t._tid = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(16px)';
  }, 3200);
}

async function blobFromDataUrl(dataUrl) {
  return fetch(dataUrl).then(r => r.blob());
}

function forceDownload(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
}

export async function shareWhatsApp() {
  showToast('⏳ Gerando imagem...');
  const dataUrl = await generateShareImage();
  if (!dataUrl) { showToast('❌ Erro ao gerar imagem.'); return; }

  const blob = await blobFromDataUrl(dataUrl);
  const file = new File([blob], 'versiculo_whatsapp.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Versículo do Dia',
        text: appState.currentVerse
          ? `"${appState.currentVerse.text}" — ${getBookName(appState.currentVerse.book)} ${appState.currentVerse.chapter}:${appState.currentVerse.verse}`
          : ''
      });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return; // usuário cancelou
    }
  }
  forceDownload(dataUrl, 'versiculo_whatsapp.png');
  showToast('📥 Imagem baixada!');
}

export async function shareInstagram() {
  showToast('⏳ Gerando imagem 9:16...');
  const dataUrl = await generateShareImage();
  if (!dataUrl) { showToast('❌ Erro ao gerar imagem.'); return; }
  forceDownload(dataUrl, 'versiculo_story_ig.png');
  showToast('📸 Imagem 9:16 salva! Abra o Instagram → Story ou Reels.');
}

export function copyVerseText() {
  if (!appState.currentVerse) return;
  const v = appState.currentVerse;
  const text = `"${v.text}" — ${getBookName(v.book)} ${v.chapter}:${v.verse} (ARA)`;
  navigator.clipboard.writeText(text)
    .then(() => showToast('📋 Versículo copiado!'))
    .catch(() => {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast('📋 Versículo copiado!');
    });
}
