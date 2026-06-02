// Mantém a classificação semântica e imagens controladas
import { getImageForVerse } from './semantic.js'; // criaremos abaixo

let currentBgUrl = '';
let bgLayer1 = null, bgLayer2 = null;
let activeLayer = 1;

export function initBackgroundLayers() {
  // Criar duas camadas no DOM
  const layer1 = document.createElement('div');
  layer1.className = 'bg-layer bg-layer-1';
  const layer2 = document.createElement('div');
  layer2.className = 'bg-layer bg-layer-2';
  document.body.prepend(layer1, layer2);
  bgLayer1 = layer1;
  bgLayer2 = layer2;
}

export async function setBackgroundImage(verseText) {
  const newUrl = getImageForVerse(verseText);
  if (newUrl === currentBgUrl) return;
  // Pré-carregar
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
  currentBgUrl = newUrl;
}
