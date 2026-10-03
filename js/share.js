// js/share.js — Share Engine independente do background da experiência.
import { appState } from './state.js';
import { resolveVisualForVerse } from './visualEngine.js';

export const SHARE_FORMATS = Object.freeze({
  story:{ width:1080, height:1920, safeTop:190, safeBottom:290, purpose:'share-portrait' },
  feed:{ width:1080, height:1350, safeTop:110, safeBottom:130, purpose:'share-portrait' },
  square:{ width:1080, height:1080, safeTop:90, safeBottom:100, purpose:'share-square' },
  og:{ width:1200, height:630, safeTop:56, safeBottom:60, purpose:'share-og' }
});

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
  const words = String(text || '').split(/\s+/);
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

function loadImage(url) {
  if (!url) return Promise.resolve(null);
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img.naturalWidth ? img : null);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function drawAbstract(ctx, width, height, visual, intent) {
  const palette = visual?.palette ||
    intent?.photography?.paletteHints ||
    ['#0b131a','#243843','#6d6656','#d2bd91'];

  const linear = ctx.createLinearGradient(0, 0, width, height);
  linear.addColorStop(0, palette[0] || '#0b131a');
  linear.addColorStop(0.52, palette[1] || '#243843');
  linear.addColorStop(1, palette[0] || '#0b131a');
  ctx.fillStyle = linear;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(
    width * 0.25,
    height * 0.22,
    0,
    width * 0.25,
    height * 0.22,
    Math.max(width, height) * 0.62
  );
  glow.addColorStop(0, 'rgba(228,179,99,0.18)');
  glow.addColorStop(1, 'rgba(228,179,99,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  const secondary = ctx.createRadialGradient(
    width * 0.82,
    height * 0.76,
    0,
    width * 0.82,
    height * 0.76,
    Math.max(width, height) * 0.52
  );
  secondary.addColorStop(0, 'rgba(255,255,255,0.045)');
  secondary.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = secondary;
  ctx.fillRect(0, 0, width, height);
}

function drawPhotoCover(ctx, img, width, height, focal) {
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const overflowX = Math.max(0, drawW - width);
  const overflowY = Math.max(0, drawH - height);
  const fx = Math.max(0, Math.min(1, Number(focal?.x ?? 0.5)));
  const fy = Math.max(0, Math.min(1, Number(focal?.y ?? 0.5)));
  const ox = -overflowX * fx;
  const oy = -overflowY * fy;
  ctx.drawImage(img, ox, oy, drawW, drawH);
}

function drawAdaptiveScrim(ctx, width, height, strength) {
  const alpha = Math.max(0.18, Math.min(0.48, Number(strength || 0.24) + 0.08));
  const vertical = ctx.createLinearGradient(0, 0, 0, height);
  vertical.addColorStop(0, 'rgba(0,0,0,' + (alpha * 0.58).toFixed(3) + ')');
  vertical.addColorStop(0.5, 'rgba(0,0,0,' + alpha.toFixed(3) + ')');
  vertical.addColorStop(1, 'rgba(0,0,0,' + (alpha * 0.9).toFixed(3) + ')');
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, width, height);

  const vignette = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.72);
  vignette.addColorStop(0, 'rgba(0,0,0,0.02)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.30)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function fontForVerse(ctx, verseText, target, maxWidth, availableHeight) {
  let size;
  const length = verseText.length;

  if (target.purpose === 'share-og') {
    size = length > 180 ? 44 : length > 110 ? 52 : 62;
  } else if (target.purpose === 'share-square') {
    size = length > 220 ? 54 : length > 150 ? 62 : length > 90 ? 72 : 80;
  } else {
    size = length > 240 ? 58 : length > 180 ? 66 : length > 120 ? 74 : 84;
  }

  while (size >= 38) {
    ctx.font = '400 ' + size + 'px "Cormorant Garamond", Georgia, serif';
    const lines = wrapText(ctx, verseText, maxWidth);
    const lineHeight = size * 1.42;
    if (lines.length * lineHeight <= availableHeight) {
      return { size, lines, lineHeight };
    }
    size -= 3;
  }

  ctx.font = '400 38px "Cormorant Garamond", Georgia, serif';
  return {
    size:38,
    lines:wrapText(ctx, verseText, maxWidth),
    lineHeight:54
  };
}

async function resolveShareVisual(verse, target) {
  try {
    return await resolveVisualForVerse(verse, { purpose:target.purpose });
  } catch {
    return {
      intent:appState.currentVisualIntent || null,
      visual:{ mode:'abstract', palette:appState.currentVisual?.palette || null, overlayStrength:0.18 }
    };
  }
}

export async function generateShareImage(format = 'story') {
  if (!appState.currentVerse) return null;

  const verse = appState.currentVerse;
  const target = SHARE_FORMATS[format] || SHARE_FORMATS.story;
  const W = target.width;
  const H = target.height;
  const refText = getBookName(verse.book) + ' ' + verse.chapter + ':' + verse.verse;

  const selection = await resolveShareVisual(verse, target);
  const visual = selection.visual;
  const intent = selection.intent || appState.currentVisualIntent;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';

  let photoDrawn = false;
  if (visual?.mode === 'photo' && visual.imageUrl) {
    const img = await loadImage(visual.imageUrl);
    if (img) {
      const sourceRatio = img.naturalWidth / img.naturalHeight;
      const portraitTarget = target.purpose === 'share-portrait';

      // Uma foto landscape extrema não é sacrificada para caber em Story/Feed.
      if (!(portraitTarget && sourceRatio > 1.58)) {
        const focal = portraitTarget
          ? (visual.mobileFocalPoint || visual.focalPoint || {x:0.5,y:0.5})
          : (visual.focalPoint || {x:0.5,y:0.5});
        drawPhotoCover(ctx, img, W, H, focal);
        photoDrawn = true;
      }
    }
  }

  if (!photoDrawn) drawAbstract(ctx, W, H, visual, intent);
  drawAdaptiveScrim(ctx, W, H, photoDrawn ? visual?.overlayStrength : 0.16);

  const sideMargin = target.purpose === 'share-og' ? 92 : 88;
  const maxTextWidth = W - sideMargin * 2;
  const contentTop = target.safeTop;
  const contentBottom = H - target.safeBottom;
  const refBlockHeight = target.purpose === 'share-og' ? 92 : 130;
  const logoBlockHeight = target.purpose === 'share-og' ? 58 : 92;
  const availableTextHeight = contentBottom - contentTop - refBlockHeight - logoBlockHeight;

  const typography = fontForVerse(ctx, verse.text, target, maxTextWidth, availableTextHeight);
  const totalTextHeight = typography.lines.length * typography.lineHeight;
  const contentCenter = contentTop + availableTextHeight * 0.48;
  const startY = Math.max(
    contentTop + typography.size,
    contentCenter - totalTextHeight / 2 + typography.size * 0.52
  );

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '400 ' + typography.size + 'px "Cormorant Garamond", Georgia, serif';
  ctx.fillStyle = '#FFFCF5';
  ctx.shadowColor = 'rgba(0,0,0,0.78)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 3;
  typography.lines.forEach((line, index) => {
    ctx.fillText(line, W / 2, startY + index * typography.lineHeight);
  });
  ctx.restore();

  const lastTextY = startY + (typography.lines.length - 1) * typography.lineHeight;
  const refFont = target.purpose === 'share-og' ? 30 : 38;
  const refY = Math.min(contentBottom - logoBlockHeight, lastTextY + typography.lineHeight + 42);

  ctx.save();
  ctx.font = '600 ' + refFont + 'px Inter, sans-serif';
  ctx.textAlign = 'center';
  const measured = ctx.measureText(refText).width;
  const pillW = Math.min(W - sideMargin * 2, measured + 88);
  const pillH = target.purpose === 'share-og' ? 64 : 74;
  const pillX = (W - pillW) / 2;
  const pillY = refY - pillH + 16;

  ctx.fillStyle = 'rgba(7,10,14,0.58)';
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(228,179,99,0.86)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.stroke();

  ctx.fillStyle = '#E4B363';
  ctx.fillText(refText, W / 2, refY);
  ctx.restore();

  const logoY = H - Math.max(38, target.safeBottom * 0.34);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '500 ' + (target.purpose === 'share-og' ? 20 : 24) + 'px Inter, sans-serif';
  ctx.fillStyle = 'rgba(255,252,245,0.76)';
  ctx.fillText('V E R S   D A Y', W / 2, logoY);
  ctx.beginPath();
  ctx.arc(W / 2, logoY + 18, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = '#E4B363';
  ctx.fill();
  ctx.restore();

  return canvas.toDataURL('image/png');
}

function showToast(msg) {
  let toast = document.getElementById('vd-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'vd-toast';
    toast.style.cssText = [
      'position:fixed','bottom:32px','left:50%','transform:translateX(-50%) translateY(16px)',
      'background:rgba(16,22,32,0.96)','color:#ECE8E0','padding:13px 26px',
      'border-radius:100px','font:500 0.88rem/1 Inter,sans-serif',
      'border:1px solid rgba(228,179,99,0.35)','box-shadow:0 8px 32px rgba(0,0,0,0.45)',
      'z-index:9999','opacity:0','transition:opacity .22s ease,transform .22s ease',
      'pointer-events:none','white-space:nowrap','max-width:90vw','text-align:center'
    ].join(';');
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._tid);
  toast._tid = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(16px)';
  }, 3200);
}

async function blobFromDataUrl(dataUrl) {
  const response = await fetch(dataUrl);
  return response.blob();
}

function forceDownload(dataUrl, filename) {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export async function shareWhatsApp() {
  showToast('⏳ Gerando card VersDay...');
  const dataUrl = await generateShareImage('square');
  if (!dataUrl) {
    showToast('❌ Erro ao gerar imagem.');
    return;
  }

  const blob = await blobFromDataUrl(dataUrl);
  const file = new File([blob], 'versday_whatsapp.png', { type:'image/png' });

  if (navigator.canShare?.({ files:[file] })) {
    try {
      await navigator.share({
        files:[file],
        title:'VersDay',
        text:appState.currentVerse
          ? '"' + appState.currentVerse.text + '" — ' + getBookName(appState.currentVerse.book) + ' ' + appState.currentVerse.chapter + ':' + appState.currentVerse.verse
          : ''
      });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }

  forceDownload(dataUrl, 'versday_whatsapp.png');
  showToast('📥 Imagem salva!');
}

export async function shareInstagram() {
  showToast('✨ Gerando Story 9:16...');
  const dataUrl = await generateShareImage('story');
  if (!dataUrl) {
    showToast('❌ Erro ao gerar imagem.');
    return;
  }

  forceDownload(dataUrl, 'versday_instagram_story.png');
  showToast('📸 Story salvo!');
}

export function copyVerseText() {
  if (!appState.currentVerse) return;
  const verse = appState.currentVerse;
  const text = '"' + verse.text + '" — ' + getBookName(verse.book) + ' ' + verse.chapter + ':' + verse.verse + ' (ARA)';

  navigator.clipboard.writeText(text)
    .then(() => showToast('📋 Versículo copiado!'))
    .catch(() => {
      const element = document.createElement('textarea');
      element.value = text;
      document.body.appendChild(element);
      element.select();
      document.execCommand('copy');
      document.body.removeChild(element);
      showToast('📋 Versículo copiado!');
    });
}
