import { appState } from './state.js';

// Mapeamento completo de abreviações para nomes de livros (66 livros)
const bookNameMap = {
  // Velho Testamento
  "gn": "Gênesis", "ex": "Êxodo", "lv": "Levítico", "nm": "Números", "dt": "Deuteronômio",
  "js": "Josué", "jz": "Juízes", "rt": "Rute", "1sm": "1 Samuel", "2sm": "2 Samuel",
  "1rs": "1 Reis", "2rs": "2 Reis", "1cr": "1 Crônicas", "2cr": "2 Crônicas", "ed": "Esdras",
  "ne": "Neemias", "et": "Ester", "jó": "Jó", "sl": "Salmos", "pv": "Provérbios",
  "ec": "Eclesiastes", "ct": "Cantares", "is": "Isaías", "jr": "Jeremias", "lm": "Lamentações",
  "ez": "Ezequiel", "dn": "Daniel", "os": "Oséias", "jl": "Joel", "am": "Amós",
  "ob": "Obadias", "jn": "Jonas", "mq": "Miquéias", "na": "Naum", "hc": "Habacuque",
  "sf": "Sofonias", "ag": "Ageu", "zc": "Zacarias", "ml": "Malaquias",
  // Novo Testamento
  "mt": "Mateus", "mc": "Marcos", "lc": "Lucas", "jo": "João",
  "atos": "Atos", "rm": "Romanos", "1co": "1 Coríntios", "2co": "2 Coríntios",
  "gl": "Gálatas", "ef": "Efésios", "fp": "Filipenses", "cl": "Colossenses",
  "1ts": "1 Tessalonicenses", "2ts": "2 Tessalonicenses", "1tm": "1 Timóteo", "2tm": "2 Timóteo",
  "tt": "Tito", "fm": "Filemom", "hb": "Hebreus", "tg": "Tiago",
  "1pe": "1 Pedro", "2pe": "2 Pedro", "1jo": "1 João", "2jo": "2 João",
  "3jo": "3 João", "jd": "Judas", "ap": "Apocalipse"
};

function getFullBookName(abbrev) {
  return bookNameMap[abbrev] || abbrev;
}

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
  if (!bgUrl) bgUrl = 'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1600';
  const bgImg = new Image();
  bgImg.crossOrigin = 'Anonymous';
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
    try {
      await navigator.share({ files: [file], title: 'Versículo do Dia' });
    } catch(e) { download(dataUrl, filename); }
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
    alert('✅ Imagem salva! Abra o Instagram e escolha a imagem para Feed, Story ou Reels.');
  }
}

export function copyVerseText() {
  if (appState.currentVerse) {
    const fullBook = getFullBookName(appState.currentVerse.book);
    const text = `${appState.currentVerse.text} (${fullBook} ${appState.currentVerse.chapter}:${appState.currentVerse.verse} - ARA)`;
    navigator.clipboard.writeText(text);
    alert('📋 Versículo copiado!');
  }
}
