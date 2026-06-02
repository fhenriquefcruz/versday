import { appState } from './state.js';
import { getFavorites, addFavorite, removeFavorite } from './favorites.js';
import { addToHistory } from './history.js';

export async function generateShareImage() {
  if (!appState.currentVerse) return null;
  const verse = appState.currentVerse;
  const fullBook = getFullBookName(verse.book);
  const displayRef = `${fullBook} ${verse.chapter}:${verse.verse}`;
  const width = 1080, height = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');

  let bgUrl = appState.currentBackgroundImageUrl;
  if (!bgUrl) bgUrl = 'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg';
  const bgImg = new Image(); bgImg.crossOrigin = 'Anonymous';
  await new Promise((resolve) => {
    bgImg.onload = resolve;
    bgImg.onerror = resolve;
    bgImg.src = bgUrl;
  });
  if (bgImg.complete && bgImg.naturalWidth > 0) {
    const scale = Math.max(width / bgImg.width, height / bgImg.height);
    const x = (width - bgImg.width * scale) / 2;
    const y = (height - bgImg.height * scale) / 2;
    ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
  }
  // overlay escuro + vinheta
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, 'rgba(0,0,0,0.4)');
  grad.addColorStop(1, 'rgba(0,0,0,0.8)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.font = `600 ${width * 0.07}px 'Playfair Display'`;
  ctx.fillStyle = '#E4B363';
  ctx.textAlign = 'center';
  ctx.fillText('Versículo do Dia', width/2, height * 0.12);

  ctx.font = `500 ${width * 0.055}px 'Playfair Display'`;
  ctx.fillStyle = '#FCF7F0';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  const maxWidthText = width * 0.8;
  const words = verse.text.split(' ');
  let lines = [], current = '';
  for (let w of words) {
    const test = current ? current + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidthText && current) {
      lines.push(current);
      current = w;
    } else current = test;
  }
  if (current) lines.push(current);
  const lineH = width * 0.07;
  const startY = height * 0.4;
  lines.forEach((l, i) => ctx.fillText(l, width/2, startY + i * lineH));

  ctx.font = `500 ${width * 0.04}px 'Inter'`;
  ctx.fillStyle = '#E4B363';
  ctx.fillText(displayRef, width/2, startY + lines.length * lineH + width * 0.06);

  ctx.font = `${width * 0.03}px 'Inter'`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('✨ Vers Day · Fábio Cruz', width/2, height - width * 0.06);
  ctx.shadowBlur = 0;
  return canvas.toDataURL('image/png');
}

async function shareWithFile(dataUrl, filename) {
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.share) {
    try { await navigator.share({ files: [file], title: 'Versículo do Dia' }); }
    catch(e) { download(dataUrl, filename); }
  } else { download(dataUrl, filename); }
}
function download(url, name) {
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
}

export async function shareWhatsApp() {
  const dataUrl = await generateShareImage();
  if (dataUrl) await shareWithFile(dataUrl, 'versiculo_whatsapp.png');
}
export async function shareInstagram() {
  const dataUrl = await generateShareImage();
  if (dataUrl) {
    download(dataUrl, 'versiculo_instagram.png');
    alert('Imagem salva! Abra o Instagram e escolha a imagem para Feed, Story ou Reels.');
  }
}
function getFullBookName(abbrev) {
  const map = { sl:'Salmos', fp:'Filipenses', is:'Isaías', jo:'João', 1jo:'1 João', gl:'Gálatas', ef:'Efésios', pv:'Provérbios', ec:'Eclesiastes', mt:'Mateus', mc:'Marcos', lc:'Lucas', atos:'Atos', ap:'Apocalipse' };
  return map[abbrev] || abbrev;
}
export function copyVerseText() {
  if (appState.currentVerse) {
    const full = `${appState.currentVerse.text} (${getFullBookName(appState.currentVerse.book)} ${appState.currentVerse.chapter}:${appState.currentVerse.verse} - ARA)`;
    navigator.clipboard.writeText(full);
    alert('Versículo copiado!');
  }
}
