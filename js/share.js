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
export async function generateShareImage() {
  if (!appState.currentVerse) return null;
  const verse = appState.currentVerse;
  const fullBook = getBookName(verse.book);
  const refText  = `${fullBook} ${verse.chapter}:${verse.verse}`;

  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // ── 1. Fundo fotográfico ──
  const bgUrl = appState.currentBackgroundImageUrl ||
    'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1920';

  const bgImg = new Image();
  bgImg.crossOrigin = 'Anonymous';
  await new Promise(resolve => { bgImg.onload = resolve; bgImg.onerror = resolve; bgImg.src = bgUrl; });

  if (bgImg.complete && bgImg.naturalWidth > 0) {
    const scale = Math.max(W / bgImg.width, H / bgImg.height);
    const ox = (W - bgImg.width  * scale) / 2;
    const oy = (H - bgImg.height * scale) / 2;
    ctx.drawImage(bgImg, ox, oy, bgImg.width * scale, bgImg.height * scale);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   '#1a2535');
    grad.addColorStop(0.5, '#0d1520');
    grad.addColorStop(1,   '#070d18');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── 2. Overlay multicamada ──
  // Escurece topo e base, mantém centro um pouco mais vivo
  const topGrad = ctx.createLinearGradient(0, 0, 0, H * 0.4);
  topGrad.addColorStop(0,   'rgba(0,0,0,0.72)');
  topGrad.addColorStop(1,   'rgba(0,0,0,0.08)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, H * 0.4);

  const botGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
  botGrad.addColorStop(0,   'rgba(0,0,0,0.08)');
  botGrad.addColorStop(1,   'rgba(0,0,0,0.80)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  // Véu central suave para destacar o texto
  const midVeil = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.75);
  midVeil.addColorStop(0,   'rgba(0,0,0,0.38)');
  midVeil.addColorStop(1,   'rgba(0,0,0,0.0)');
  ctx.fillStyle = midVeil;
  ctx.fillRect(0, 0, W, H);

  const PAD = 96; // margem horizontal

  // ── 3. Topo: logotipo app ──
  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur   = 18;

  // Ícone + nome do app
  ctx.font = `700 52px 'Inter', sans-serif`;
  ctx.fillStyle = '#E4B363';
  ctx.letterSpacing = '6px';
  ctx.fillText('VERS DAY', W / 2, 148);

  // Linha dourada decorativa
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = '#E4B363';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PAD * 1.5, 178);
  ctx.lineTo(W - PAD * 1.5, 178);
  ctx.stroke();
  ctx.restore();

  // ── 4. Aspas de abertura ──
  ctx.save();
  ctx.font = `italic 280px 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228,179,99,0.22)';
  ctx.shadowBlur = 0;
  ctx.fillText('\u201C', PAD - 20, H * 0.43);
  ctx.restore();

  // ── 5. Texto do versículo ──
  const textLen = verse.text.length;
  let fontSize = textLen > 220 ? 58 : textLen > 160 ? 66 : textLen > 110 ? 74 : 82;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `400 ${fontSize}px 'Georgia', serif`;
  ctx.fillStyle = '#F5F0E8';
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur   = 22;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  const maxW = W - PAD * 2.4;
  const lines = wrapText(ctx, verse.text, maxW);
  const lineH = fontSize * 1.48;
  const blockH = lines.length * lineH;
  const startY = H / 2 - blockH / 2 + fontSize * 0.36;

  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineH);
  });
  ctx.restore();

  // ── 6. Aspas de fechamento ──
  const lastY = startY + (lines.length - 1) * lineH;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `italic 280px 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228,179,99,0.22)';
  ctx.fillText('\u201D', W - PAD + 20, lastY + 80);
  ctx.restore();

  // ── 7. Pílula de referência ──
  const refY = lastY + lineH + 54;

  ctx.save();
  ctx.font = `600 52px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  const refMeasure = ctx.measureText(refText).width;
  const pillW = refMeasure + 90;
  const pillH = 80;
  const pillX = W / 2 - pillW / 2;
  const pillYtop = refY - pillH + 14;

  // Fundo da pílula
  ctx.fillStyle = 'rgba(0,0,0,0.52)';
  roundRect(ctx, pillX, pillYtop, pillW, pillH, 40);
  ctx.fill();

  // Borda dourada fina
  ctx.strokeStyle = 'rgba(228,179,99,0.5)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, pillX, pillYtop, pillW, pillH, 40);
  ctx.stroke();

  // Texto da referência
  ctx.fillStyle = '#E4B363';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  ctx.fillText(refText, W / 2, refY);
  ctx.restore();

  // ── 8. Rodapé ──
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `400 38px 'Inter', sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.shadowBlur = 0;
  ctx.fillText('✨  Vers Day  ·  Fábio Cruz', W / 2, H - 72);
  ctx.restore();

  return canvas.toDataURL('image/png', 1.0);
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
