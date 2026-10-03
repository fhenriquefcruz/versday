// js/background.js
import { resolveVisualForVerse } from './visualEngine.js';
import { appState } from './state.js';

let bgLayer1;
let bgLayer2;
let activeLayer = 1;
let currentVisualId = '';

function focalToCss(point = { x: 0.5, y: 0.5 }) {
  const x = Math.max(0, Math.min(1, Number(point.x ?? 0.5))) * 100;
  const y = Math.max(0, Math.min(1, Number(point.y ?? 0.5))) * 100;
  return `${x.toFixed(1)}% ${y.toFixed(1)}%`;
}

function preload(url) {
  if (!url) return Promise.resolve(false);
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

function updateCredit(visual) {
  const container = document.getElementById('unsplash-credit');
  if (!container) return;

  if (visual?.mode === 'photo' && visual.providerUrl) {
    const provider = String(visual.provider || 'fonte externa');
    container.innerHTML = `Imagem selecionada semanticamente · <a href="${visual.providerUrl}" target="_blank" rel="noopener noreferrer">${provider}</a>`;
    container.style.display = 'block';
    return;
  }

  container.innerHTML = '';
  container.style.display = 'none';
}

function applyVisualToLayer(layer, visual) {
  layer.classList.toggle('bg-abstract', visual.mode === 'abstract');
  layer.style.setProperty('--focal-desktop', focalToCss(visual.focalPoint));
  layer.style.setProperty('--focal-mobile', focalToCss(visual.mobileFocalPoint || visual.focalPoint));

  if (visual.mode === 'photo') {
    layer.style.backgroundImage = `url("${visual.imageUrl}")`;
    layer.style.backgroundColor = '';
  } else {
    layer.style.backgroundImage = visual.cssBackground;
    layer.style.backgroundColor = visual.palette?.[0] || '#0d1117';
  }
}

export function initBackgroundLayers() {
  const l1 = document.createElement('div');
  l1.className = 'bg-layer bg-layer-1';
  l1.setAttribute('aria-hidden', 'true');

  const l2 = document.createElement('div');
  l2.className = 'bg-layer bg-layer-2';
  l2.setAttribute('aria-hidden', 'true');

  document.body.prepend(l1, l2);
  bgLayer1 = l1;
  bgLayer2 = l2;
}

export async function setBackgroundImage(verse, options = {}) {
  if (!bgLayer1 || !bgLayer2) initBackgroundLayers();

  const selection = await resolveVisualForVerse(verse, options);
  const { visual, intent, diagnostics } = selection;

  if (!visual || (visual.id === currentVisualId && !options.force)) return selection;

  if (visual.mode === 'photo') {
    const loaded = await preload(visual.imageUrl);
    if (!loaded) {
      // Força nova resolução: a foto quebrada não deve permanecer como "melhor ruim".
      return resolveAndApplyFallback(verse, selection);
    }
  }

  const nextLayer = activeLayer === 1 ? bgLayer2 : bgLayer1;
  const currentLayer = activeLayer === 1 ? bgLayer1 : bgLayer2;

  applyVisualToLayer(nextLayer, visual);
  nextLayer.style.opacity = '1';
  currentLayer.style.opacity = '0';

  activeLayer = activeLayer === 1 ? 2 : 1;
  currentVisualId = visual.id;

  appState.currentVisual = visual;
  appState.currentVisualIntent = intent;
  appState.visualDiagnostics = diagnostics;
  appState.currentBackgroundImageUrl = visual.mode === 'photo' ? visual.imageUrl : '';

  document.body.dataset.visualMode = visual.mode;
  document.body.dataset.textPlacement = visual.textPlacement || 'center';
  document.documentElement.style.setProperty(
    '--visual-overlay-alpha',
    String(visual.overlayStrength ?? 0.22)
  );

  updateCredit(visual);
  return selection;
}

async function resolveAndApplyFallback(verse, failedSelection) {
  // Marca apenas esta renderização como abstrata. Não cria um "último recurso fotográfico".
  const intent = failedSelection.intent;
  const palette = intent?.photography?.paletteHints || ['#0b131a', '#243843', '#6d6656', '#d2bd91'];
  const fallback = {
    mode: 'abstract',
    id: `abstract-runtime:${verse.reference || Date.now()}`,
    palette,
    cssBackground: [
      `radial-gradient(circle at 22% 30%, ${palette[2]}44 0%, transparent 34%)`,
      `radial-gradient(circle at 80% 72%, ${palette[1]}88 0%, transparent 42%)`,
      `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 52%, ${palette[0]} 100%)`
    ].join(', '),
    overlayStrength: 0.16,
    textPlacement: 'center',
    reason: 'Falha ao carregar a fotografia selecionada.'
  };

  const nextLayer = activeLayer === 1 ? bgLayer2 : bgLayer1;
  const currentLayer = activeLayer === 1 ? bgLayer1 : bgLayer2;
  applyVisualToLayer(nextLayer, fallback);
  nextLayer.style.opacity = '1';
  currentLayer.style.opacity = '0';
  activeLayer = activeLayer === 1 ? 2 : 1;
  currentVisualId = fallback.id;

  appState.currentVisual = fallback;
  appState.currentVisualIntent = intent;
  appState.currentBackgroundImageUrl = '';
  document.body.dataset.visualMode = 'abstract';
  updateCredit(fallback);

  return { ...failedSelection, visual: fallback };
}
