import { getImageForVerse } from './semantic.js';
import { appState } from './state.js';

let bgLayer1, bgLayer2;
let activeLayer = 1;

export function initBackgroundLayers() {
  const l1 = document.createElement('div');
  l1.className = 'bg-layer bg-layer-1';
  const l2 = document.createElement('div');
  l2.className = 'bg-layer bg-layer-2';
  document.body.prepend(l1, l2);
  bgLayer1 = l1; bgLayer2 = l2;
}

export async function setBackgroundImage(verseText) {
  const newUrl = getImageForVerse(verseText);
  if (newUrl === appState.currentBackgroundImageUrl) return;
  // pré-carregar
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  await new Promise((resolve) => {
    img.onload = resolve;
    img.onerror = resolve;
    img.src = newUrl;
  });
  const nextLayer = activeLayer === 1 ? bgLayer2 : bgLayer1;
  nextLayer.style.backgroundImage = `url('${newUrl}')`;
  nextLayer.style.opacity = '1';
  const currentLayer = activeLayer === 1 ? bgLayer1 : bgLayer2;
  currentLayer.style.opacity = '0';
  activeLayer = activeLayer === 1 ? 2 : 1;
  appState.currentBackgroundImageUrl = newUrl;
}
