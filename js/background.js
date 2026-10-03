// js/background.js
import { resolveVisualForVerse } from './visualEngine.js';
import { appState } from './state.js';

let bgLayer1;
let bgLayer2;
let activeLayer = 1;
let currentVisualId = '';
let requestSequence = 0;

function focalToCss(point = { x:0.5, y:0.5 }) {
  const x = Math.max(0, Math.min(1, Number(point.x ?? 0.5))) * 100;
  const y = Math.max(0, Math.min(1, Number(point.y ?? 0.5))) * 100;
  return x.toFixed(1) + '% ' + y.toFixed(1) + '%';
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

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    '"':'&quot;',
    "'":'&#039;'
  }[char]));
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''), location.href);
    return ['http:','https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function updateCredit(visual) {
  const container = document.getElementById('unsplash-credit');
  if (!container) return;

  if (visual?.mode !== 'photo') {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  const provider = escapeHtml(visual.provider || visual.attribution?.provider || 'fonte externa');
  const providerUrl = safeUrl(visual.providerUrl || visual.sourceLink || visual.attribution?.providerUrl);
  const photographer = escapeHtml(visual.photographer || visual.attribution?.photographer || '');
  const photographerUrl = safeUrl(visual.photographerLink || visual.attribution?.photographerLink);

  const providerHtml = providerUrl
    ? '<a href="' + providerUrl + '" target="_blank" rel="noopener noreferrer">' + provider + '</a>'
    : provider;

  if (photographer) {
    const photographerHtml = photographerUrl
      ? '<a href="' + photographerUrl + '" target="_blank" rel="noopener noreferrer">' + photographer + '</a>'
      : photographer;
    container.innerHTML = 'Foto de ' + photographerHtml + ' · ' + providerHtml;
  } else {
    container.innerHTML = 'Imagem selecionada semanticamente · ' + providerHtml;
  }

  container.style.display = 'block';
}

function applyVisualToLayer(layer, visual) {
  layer.classList.toggle('bg-abstract', visual.mode === 'abstract');
  layer.style.setProperty('--focal-desktop', focalToCss(visual.focalPoint));
  layer.style.setProperty('--focal-mobile', focalToCss(visual.mobileFocalPoint || visual.focalPoint));

  if (visual.mode === 'photo') {
    layer.style.backgroundImage = 'url("' + visual.imageUrl + '")';
    layer.style.backgroundColor = '';
  } else {
    layer.style.backgroundImage = visual.cssBackground;
    layer.style.backgroundColor = visual.palette?.[0] || '#0d1117';
  }
}

function applyDocumentVisualState(visual) {
  document.body.dataset.visualMode = visual.mode;
  document.body.dataset.textPlacement = visual.textPlacement || 'center';
  document.documentElement.style.setProperty(
    '--visual-overlay-alpha',
    String(visual.overlayStrength ?? 0.22)
  );
}

export function initBackgroundLayers() {
  if (bgLayer1 && bgLayer2) return;

  const layer1 = document.createElement('div');
  layer1.className = 'bg-layer bg-layer-1';
  layer1.setAttribute('aria-hidden', 'true');

  const layer2 = document.createElement('div');
  layer2.className = 'bg-layer bg-layer-2';
  layer2.setAttribute('aria-hidden', 'true');

  document.body.prepend(layer1, layer2);
  bgLayer1 = layer1;
  bgLayer2 = layer2;
}

export async function setBackgroundImage(verse, options = {}) {
  if (!bgLayer1 || !bgLayer2) initBackgroundLayers();

  const requestId = ++requestSequence;
  const selection = await resolveVisualForVerse(verse, {
    ...options,
    purpose:'background'
  });

  if (requestId !== requestSequence) return selection;

  const { visual, intent, diagnostics } = selection;
  if (!visual || (visual.id === currentVisualId && !options.force)) return selection;

  if (visual.mode === 'photo') {
    const loaded = await preload(visual.imageUrl);
    if (requestId !== requestSequence) return selection;
    if (!loaded) return applyRuntimeAbstractFallback(verse, selection);
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

  applyDocumentVisualState(visual);
  updateCredit(visual);

  return selection;
}

function applyRuntimeAbstractFallback(verse, failedSelection) {
  const intent = failedSelection.intent;
  const palette = intent?.photography?.paletteHints || ['#0b131a','#243843','#6d6656','#d2bd91'];

  const fallback = {
    mode:'abstract',
    id:'abstract-runtime:' + (verse.reference || Date.now()),
    purpose:'background',
    palette,
    cssBackground:[
      'radial-gradient(circle at 22% 30%, ' + palette[2] + '44 0%, transparent 34%)',
      'radial-gradient(circle at 80% 72%, ' + palette[1] + '88 0%, transparent 42%)',
      'linear-gradient(135deg, ' + palette[0] + ' 0%, ' + palette[1] + ' 52%, ' + palette[0] + ' 100%)'
    ].join(', '),
    overlayStrength:0.16,
    textPlacement:'center',
    reason:'IMAGE_LOAD_FAILURE'
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

  applyDocumentVisualState(fallback);
  updateCredit(fallback);

  return {
    ...failedSelection,
    visual:fallback,
    diagnostics:{
      ...(failedSelection.diagnostics || {}),
      source:'abstract-runtime-fallback'
    }
  };
}
