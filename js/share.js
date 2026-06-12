// js/share.js — Design premium, sem aspecto fosco, fonte conceitual (Cormorant Garamond)
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

function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}

export async function generateShareImage() {
  if (!appState.currentVerse) return null;
  const verse = appState.currentVerse;
  const fullBook = getBookName(verse.book);
  const refText = `${fullBook} ${verse.chapter}:${verse.verse}`;
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';

  // 1. Fundo (imagem ou gradiente)
  const bgUrl = appState.currentBackgroundImageUrl || 'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1920';
  const bgImg = new Image();
  bgImg.crossOrigin = 'Anonymous';
  await new Promise(resolve => { bgImg.onload = resolve; bgImg.onerror = resolve; bgImg.src = bgUrl; });
  if (bgImg.complete && bgImg.naturalWidth > 0) {
    const scale = Math.max(W/bgImg.width, H/bgImg.height);
    const ox = (W - bgImg.width*scale)/2;
    const oy = (H - bgImg.height*scale)/2;
    ctx.drawImage(bgImg, ox, oy, bgImg.width*scale, bgImg.height*scale);
  } else {
    ctx.fillStyle = '#0a0f18';
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Vinheta suave (nada fosco, apenas um leve escurecimento nas bordas)
  const vignette = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.8);
  vignette.addColorStop(0, 'rgba(0,0,0,0.12)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // 3. Aspas de abertura (elegantes e discretas)
  ctx.save();
  ctx.font = 'italic 320px "Cormorant Garamond", "Georgia", serif';
  ctx.fillStyle = 'rgba(228,179,99,0.12)';
  ctx.fillText('“', 70, H*0.42);
  ctx.restore();

  // 4. Texto do versículo com glow e fonte premium
  const textLen = verse.text.length;
  let fontSize = textLen > 240 ? 56 : textLen > 180 ? 64 : textLen > 120 ? 72 : 82;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `400 ${fontSize}px "Cormorant Garamond", "Georgia", serif`;
  ctx.fillStyle = '#FFFCF5';
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  const maxWidth = W - 180;
  const lines = wrapText(ctx, verse.text, maxWidth);
  const lineHeight = fontSize * 1.55;
  const totalHeight = lines.length * lineHeight;
  let startY = (H - totalHeight) / 2 + fontSize * 0.2;

  lines.forEach((line, i) => {
    ctx.fillText(line, W/2, startY + i*lineHeight);
  });
  ctx.restore();

  // 5. Aspas de fechamento
  const lastY = startY + (lines.length-1)*lineHeight;
  ctx.save();
  ctx.font = 'italic 320px "Cormorant Garamond", "Georgia", serif';
  ctx.fillStyle = 'rgba(228,179,99,0.12)';
  ctx.fillText('”', W-100, lastY + 110);
  ctx.restore();

  // 6. Pílula de referência refinada
  const refY = lastY + lineHeight + 70;
  ctx.save();
  ctx.font = '500 42px "Inter", sans-serif';
  ctx.textAlign = 'center';
  const refWidth = ctx.measureText(refText).width;
  const pillW = refWidth + 100;
  const pillH = 80;
  const pillX = (W - pillW)/2;
  const pillY = refY - pillH + 18;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, pillX, pillY, pillW, pillH, 40);
  ctx.fill();
  ctx.strokeStyle = '#E4B363';
  ctx.lineWidth = 1.8;
  roundRect(ctx, pillX, pillY, pillW, pillH, 40);
  ctx.stroke();

  ctx.fillStyle = '#E4B363';
  ctx.shadowBlur = 8;
  ctx.fillText(refText, W/2, refY);
  ctx.restore();

  // 7. Logotipo conceitual "VERS DAY"
  ctx.save();
  ctx.textAlign = 'center';
  // Linhas decorativas laterais
  ctx.beginPath();
  ctx.moveTo(W/2 - 70, H-135);
  ctx.lineTo(W/2 - 20, H-135);
  ctx.strokeStyle = '#E4B363';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W/2 + 20, H-135);
  ctx.lineTo(W/2 + 70, H-135);
  ctx.stroke();
  // Texto
  ctx.font = '300 26px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(236,232,224,0.7)';
  ctx.letterSpacing = '6px';
  ctx.fillText('V E R S   D A Y', W/2, H-115);
  // Ponto central dourado
  ctx.beginPath();
  ctx.arc(W/2, H-105, 3, 0, 2*Math.PI);
  ctx.fillStyle = '#E4B363';
  ctx.fill();
  ctx.restore();

  // Exporta PNG de altíssima qualidade (sem compressão)
  return canvas.toDataURL('image/png');
}

// Toast e funções de compartilhamento (idênticas ao original)
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
  showToast('⏳ Gerando imagem premium...');
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
