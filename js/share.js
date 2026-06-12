// js/share.js — Design premium, sem fosco, tipografia conceitual
import { appState } from './state.js';

const BOOK_NAMES = { /* ... mantenha o mesmo mapeamento do seu código ... */ };
function getBookName(abbrev) { return BOOK_NAMES[abbrev] || abbrev; }

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

  // 2. Overlay suave apenas para legibilidade (sem aspecto fosco)
  // Um gradiente radial que escurece levemente as bordas e clareia o centro
  const vignette = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.8);
  vignette.addColorStop(0, 'rgba(0,0,0,0.15)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // 3. Aspas de abertura (grandes, sutis)
  ctx.save();
  ctx.font = 'italic 320px "Cormorant Garamond", "Georgia", serif';
  ctx.fillStyle = 'rgba(228,179,99,0.12)';
  ctx.fillText('“', 70, H*0.42);
  ctx.restore();

  // 4. Texto do versículo com fonte elegante e glow
  const textLen = verse.text.length;
  let fontSize = textLen > 240 ? 56 : textLen > 180 ? 64 : textLen > 120 ? 72 : 82;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `400 ${fontSize}px "Cormorant Garamond", "Georgia", serif`;
  ctx.fillStyle = '#FFFCF5';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
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
  // Linha decorativa superior
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
  // Pequeno ponto central
  ctx.beginPath();
  ctx.arc(W/2, H-105, 3, 0, 2*Math.PI);
  ctx.fillStyle = '#E4B363';
  ctx.fill();
  ctx.restore();

  // Exporta PNG de altíssima qualidade
  return canvas.toDataURL('image/png');
}

// Toast e funções de compartilhamento (idênticas ao seu código original)
function showToast(msg) { /* ... */ }
async function blobFromDataUrl(dataUrl) { /* ... */ }
function forceDownload(dataUrl, filename) { /* ... */ }
export async function shareWhatsApp() { /* ... use generateShareImage */ }
export async function shareInstagram() { /* ... */ }
export function copyVerseText() { /* ... */ }
