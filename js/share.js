// js/share.js — exportação de imagem com qualidade máxima, tipografia elegante e logotipo conceitual
import { appState } from './state.js';

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
};

function getBookName(abbrev) {
  return BOOK_NAMES[abbrev] || abbrev;
}

// ========== FUNÇÕES AUXILIARES DE RENDERIZAÇÃO ==========

// Quebra o texto respeitando a largura máxima
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

// Desenha retângulos com bordas arredondadas
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

// ========== GERAÇÃO DA IMAGEM ULTRA-HD (9:16) ==========
export async function generateShareImage() {
  if (!appState.currentVerse) return null;
  const verse = appState.currentVerse;
  const fullBook = getBookName(verse.book);
  const refText  = `${fullBook} ${verse.chapter}:${verse.verse}`;

  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // GARANTIA DE NITIDEZ
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // ── 1. Fundo fotográfico ──
  const bgUrl = appState.currentBackgroundImageUrl ||
    'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1920';
  const bgImg = new Image();
  bgImg.crossOrigin = 'Anonymous';
  await new Promise(resolve => { bgImg.onload = resolve; bgImg.onerror = resolve; bgImg.src = bgUrl; });

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
  const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.4);
  topGrad.addColorStop(0, 'rgba(13, 17, 23, 0.88)');
  topGrad.addColorStop(1, 'rgba(13, 17, 23, 0.25)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, H * 0.4);

  const botGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
  botGrad.addColorStop(0, 'rgba(13, 17, 23, 0.25)');
  botGrad.addColorStop(1, 'rgba(13, 17, 23, 0.94)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  const midVeil = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.75);
  midVeil.addColorStop(0, 'rgba(0,0,0,0.42)');
  midVeil.addColorStop(1, 'rgba(0,0,0,0.0)');
  ctx.fillStyle = midVeil;
  ctx.fillRect(0, 0, W, H);

  const PAD = 96;

  // ── 3. Aspas de abertura ──
  ctx.save();
  ctx.font = `italic 280px 'Lora', 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228, 179, 99, 0.16)';
  ctx.shadowBlur = 0;
  ctx.fillText('\u201C', PAD - 10, H * 0.42);
  ctx.restore();

  // ── 4. Texto do versículo (elegante e fluído) ──
  const textLen = verse.text.length;
  let fontSize = textLen > 220 ? 54 : textLen > 160 ? 62 : textLen > 110 ? 70 : 78;

  ctx.save();
  ctx.textAlign = 'center';
  // NÃO USAR textBaseline = 'middle' para evitar desalinhamento
  ctx.font = `400 ${fontSize}px 'Lora', 'Georgia', serif`;
  ctx.fillStyle = '#ECE8E0';
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  const maxW = W - PAD * 2.5;
  const lines = wrapText(ctx, verse.text, maxW);
  const lineH = fontSize * 1.62;
  const blockH = lines.length * lineH;
  const startY = H / 2 - blockH / 2 + fontSize * 0.2;

  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineH);
  });
  ctx.restore();

  // ── 5. Aspas de fechamento ──
  const lastY = startY + (lines.length - 1) * lineH;
  ctx.save();
  ctx.font = `italic 280px 'Lora', 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228, 179, 99, 0.16)';
  ctx.fillText('\u201D', W - PAD + 10, lastY + 110);
  ctx.restore();

  // ── 6. Pílula de referência ──
  const refY = lastY + lineH + 72;
  ctx.save();
  ctx.font = `600 42px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  const refMeasure = ctx.measureText(refText).width;
  const pillW = refMeasure + 86;
  const pillH = 76;
  const pillX = W / 2 - pillW / 2;
  const pillYtop = refY - pillH + 16;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
  roundRect(ctx, pillX, pillYtop, pillW, pillH, 38);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, pillX, pillYtop, pillW, pillH, 38);
  ctx.stroke();

  ctx.fillStyle = '#E4B363';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.fillText(refText, W / 2, refY);
  ctx.restore();

  // ── 7. Logotipo conceitual "VERS DAY" ──
  ctx.save();
  ctx.textAlign = 'center';

  // Ponto minimalista dourado
  ctx.beginPath();
  ctx.arc(W / 2, H - 150, 5, 0, 2 * Math.PI);
  ctx.fillStyle = '#E4B363';
  ctx.fill();

  // Texto com degradê dourado (simulado com cor sólida para canvas)
  ctx.font = `300 30px 'Inter', sans-serif`;
  ctx.fillStyle = 'rgba(236, 232, 224, 0.55)';
  ctx.shadowBlur = 0;
  ctx.fillText("V E R S   D A Y", W / 2, H - 95);
  ctx.restore();

  // ── 8. Exportação em PNG (qualidade máxima) ──
  return canvas.toDataURL('image/png');
}

// ========== TOAST E COMPARTILHAMENTO ==========
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
  const res = await fetch(dataUrl);
  return res.blob();
}

function forceDownload(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function shareWhatsApp() {
  showToast('⏳ Gerando imagem em HD...');
  const dataUrl = await generateShareImage();
  if (!dataUrl) { showToast('❌ Erro ao gerar imagem.'); return; }
  const blob = await blobFromDataUrl(dataUrl);
  const file = new File([blob], 'versday_whatsapp.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'VersDay',
        text: appState.currentVerse
          ? `"${appState.currentVerse.text}" — ${getBookName(appState.currentVerse.book)} ${appState.currentVerse.chapter}:${appState.currentVerse.verse}`
          : ''
      });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  forceDownload(dataUrl, 'versday_whatsapp.png');
  showToast('📥 Imagem salva!');
}

export async function shareInstagram() {
  showToast('✨ Gerando imagem 9:16 para Instagram...');
  const dataUrl = await generateShareImage();
  if (!dataUrl) { showToast('❌ Erro ao gerar imagem.'); return; }
  forceDownload(dataUrl, 'versday_instagram_story.png');
  showToast('📸 Imagem salva! Publique no Story ou Reels.');
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
