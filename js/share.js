import { appState } from './state.js';

const bookNameMap = {
  "gn": "Gênesis", "ex": "Êxodo", "lv": "Levítico", "nm": "Números", "dt": "Deuteronômio",
  "js": "Josué", "jz": "Juízes", "rt": "Rute", "1sm": "1 Samuel", "2sm": "2 Samuel",
  "1rs": "1 Reis", "2rs": "2 Reis", "1cr": "1 Crônicas", "2cr": "2 Crônicas", "ed": "Esdras",
  "ne": "Neemias", "et": "Ester", "jó": "Jó", "sl": "Salmos", "pv": "Provérbios",
  "ec": "Eclesiastes", "ct": "Cantares", "is": "Isaías", "jr": "Jeremias", "lm": "Lamentações",
  "ez": "Ezequiel", "dn": "Daniel", "os": "Oséias", "jl": "Joel", "am": "Amós",
  "ob": "Obadias", "jn": "Jonas", "mq": "Miquéias", "na": "Naum", "hc": "Habacuque",
  "sf": "Sofonias", "ag": "Ageu", "zc": "Zacarias", "ml": "Malaquias",
  "mt": "Mateus", "mc": "Marcos", "lc": "Lucas", "jo": "João", "atos": "Atos",
  "rm": "Romanos", "1co": "1 Coríntios", "2co": "2 Coríntios", "gl": "Gálatas",
  "ef": "Efésios", "fp": "Filipenses", "cl": "Colossenses", "1ts": "1 Tessalonicenses",
  "2ts": "2 Tessalonicenses", "1tm": "1 Timóteo", "2tm": "2 Timóteo", "tt": "Tito",
  "fm": "Filemom", "hb": "Hebreus", "tg": "Tiago", "1pe": "1 Pedro", "2pe": "2 Pedro",
  "1jo": "1 João", "2jo": "2 João", "3jo": "3 João", "jd": "Judas", "ap": "Apocalipse"
};

function getFullBookName(abbrev) {
  return bookNameMap[abbrev] || abbrev;
}

// Quebra texto em linhas respeitando largura máxima do canvas
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const test = current ? current + ' ' + word : word;
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

// Gera imagem 1080x1920 (9:16 — Stories/Reels)
export async function generateShareImage() {
  if (!appState.currentVerse) return null;

  const verse = appState.currentVerse;
  const fullBook = getFullBookName(verse.book);
  const displayRef = `${fullBook} ${verse.chapter}:${verse.verse}`;

  const WIDTH  = 1080;
  const HEIGHT = 1920;

  const canvas = document.createElement('canvas');
  canvas.width  = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  // ── Fundo ──
  let bgUrl = appState.currentBackgroundImageUrl;
  if (!bgUrl) bgUrl = 'https://images.pexels.com/photos/1191710/forest-mist-morning-nature-1191710.jpeg?auto=compress&cs=tinysrgb&w=1600';

  const bgImg = new Image();
  bgImg.crossOrigin = 'Anonymous';
  await new Promise(resolve => {
    bgImg.onload = resolve;
    bgImg.onerror = resolve;
    bgImg.src = bgUrl;
  });

  if (bgImg.complete && bgImg.naturalWidth > 0) {
    // Cover: preenche todo o canvas mantendo proporção
    const scale = Math.max(WIDTH / bgImg.width, HEIGHT / bgImg.height);
    const x = (WIDTH  - bgImg.width  * scale) / 2;
    const y = (HEIGHT - bgImg.height * scale) / 2;
    ctx.drawImage(bgImg, x, y, bgImg.width * scale, bgImg.height * scale);
  } else {
    // Fundo degradê de fallback
    const fallbackGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    fallbackGrad.addColorStop(0, '#1a2a3a');
    fallbackGrad.addColorStop(1, '#0a1520');
    ctx.fillStyle = fallbackGrad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  // ── Overlay gradiente para legibilidade ──
  const overlay = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  overlay.addColorStop(0,   'rgba(0,0,0,0.55)');
  overlay.addColorStop(0.35,'rgba(0,0,0,0.25)');
  overlay.addColorStop(0.6, 'rgba(0,0,0,0.35)');
  overlay.addColorStop(1,   'rgba(0,0,0,0.75)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const PAD = 100; // margem lateral
  ctx.textAlign = 'center';

  // ── Topo: título do app ──
  ctx.font = `600 46px 'Inter', sans-serif`;
  ctx.fillStyle = '#E4B363';
  ctx.letterSpacing = '4px';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  ctx.fillText('VERSÍCULO DO DIA', WIDTH / 2, 140);

  // Linha decorativa dourada
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#E4B363';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(PAD, 170);
  ctx.lineTo(WIDTH - PAD, 170);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // ── Aspas de abertura ──
  ctx.font = `bold 180px 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228,179,99,0.35)';
  ctx.shadowBlur = 0;
  ctx.fillText('\u201C', PAD - 10, HEIGHT * 0.38);

  // ── Texto do versículo ──
  const verseText = verse.text;
  const maxTextWidth = WIDTH - PAD * 2.2;

  // Ajusta tamanho da fonte dinamicamente baseado no comprimento do texto
  let fontSize = 72;
  if (verseText.length > 200) fontSize = 54;
  else if (verseText.length > 150) fontSize = 62;
  else if (verseText.length > 100) fontSize = 68;

  ctx.font = `500 ${fontSize}px 'Georgia', serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 16;

  const lines = wrapText(ctx, verseText, maxTextWidth);
  const lineHeight = fontSize * 1.42;
  const totalTextHeight = lines.length * lineHeight;

  // Centraliza verticalmente na área principal (entre 35% e 75% da altura)
  const textAreaCenter = HEIGHT * 0.55;
  let startY = textAreaCenter - totalTextHeight / 2;

  lines.forEach((line, i) => {
    ctx.fillText(line, WIDTH / 2, startY + i * lineHeight);
  });

  // ── Aspas de fechamento ──
  const lastLineY = startY + (lines.length - 1) * lineHeight;
  ctx.font = `bold 180px 'Georgia', serif`;
  ctx.fillStyle = 'rgba(228,179,99,0.35)';
  ctx.shadowBlur = 0;
  ctx.fillText('\u201D', WIDTH - PAD + 10, lastLineY + 60);

  // ── Referência bíblica ──
  const refY = lastLineY + lineHeight + 60;
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';

  // Pílula de fundo
  ctx.font = `500 52px 'Inter', sans-serif`;
  const refWidth = ctx.measureText(displayRef).width + 80;
  const refX = WIDTH / 2 - refWidth / 2;
  const refPillY = refY - 50;

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, refX, refPillY, refWidth, 72, 36);
  ctx.fill();

  ctx.fillStyle = '#E4B363';
  ctx.fillText(displayRef, WIDTH / 2, refY + 8);

  // ── Rodapé ──
  ctx.shadowBlur = 0;
  ctx.font = `400 38px 'Inter', sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillText('✨ Vers Day · Fábio Cruz', WIDTH / 2, HEIGHT - 80);

  return canvas.toDataURL('image/png', 1.0);
}

// Utilitário: retângulo com bordas arredondadas
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
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
  const dataUrl = await generateShareImage();
  if (!dataUrl) return;

  const blob = await blobFromDataUrl(dataUrl);
  const file = new File([blob], 'versiculo_whatsapp.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: 'Versículo do Dia',
        text: appState.currentVerse
          ? `"${appState.currentVerse.text}" — ${getFullBookName(appState.currentVerse.book)} ${appState.currentVerse.chapter}:${appState.currentVerse.verse}`
          : 'Versículo do Dia'
      });
      return;
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('[VersDay] Share falhou, baixando:', e);
    }
  }
  forceDownload(dataUrl, 'versiculo_whatsapp.png');
}

export async function shareInstagram() {
  const dataUrl = await generateShareImage();
  if (!dataUrl) return;

  forceDownload(dataUrl, 'versiculo_instagram_story.png');

  // Toast informativo
  showToast('📸 Imagem 9:16 salva! Abra o Instagram e use em Story, Reels ou Feed.');
}

export function copyVerseText() {
  if (!appState.currentVerse) return;
  const v = appState.currentVerse;
  const fullBook = getFullBookName(v.book);
  const text = `"${v.text}" — ${fullBook} ${v.chapter}:${v.verse} (ARA)`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Versículo copiado!');
  }).catch(() => {
    // fallback para navegadores sem clipboard API
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('📋 Versículo copiado!');
  });
}

// Toast não-bloqueante (substitui alert)
function showToast(message) {
  let toast = document.getElementById('versday-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'versday-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background: rgba(20,25,28,0.95);
      color: #FCF7F0;
      padding: 14px 28px;
      border-radius: 50px;
      font-size: 0.9rem;
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      backdrop-filter: blur(12px);
      border: 1px solid rgba(228,179,99,0.3);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.25s ease, transform 0.25s ease;
      pointer-events: none;
      white-space: nowrap;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}
