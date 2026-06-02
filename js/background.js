import { fetchLandscapeImage, getFallbackImage } from './unsplash.js';
import { appState } from './state.js';

let bgLayer1, bgLayer2;
let activeLayer = 1;
let currentImageUrl = '';

export function initBackgroundLayers() {
    const l1 = document.createElement('div');
    l1.className = 'bg-layer bg-layer-1';
    const l2 = document.createElement('div');
    l2.className = 'bg-layer bg-layer-2';
    document.body.prepend(l1, l2);
    bgLayer1 = l1;
    bgLayer2 = l2;
}

export async function setBackgroundImage() {
    // Busca imagem do Unsplash
    const result = await fetchLandscapeImage();
    let imageUrl;
    let attribution = null;

    if (result && result.imageUrl) {
        imageUrl = result.imageUrl;
        attribution = result.attribution;
    } else {
        imageUrl = getFallbackImage();
    }

    if (imageUrl === currentImageUrl) return;

    // Pré-carrega a imagem
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = imageUrl;
    });

    const nextLayer = activeLayer === 1 ? bgLayer2 : bgLayer1;
    nextLayer.style.backgroundImage = `url('${imageUrl}')`;
    nextLayer.style.opacity = '1';
    const currentLayer = activeLayer === 1 ? bgLayer1 : bgLayer2;
    currentLayer.style.opacity = '0';
    activeLayer = activeLayer === 1 ? 2 : 1;
    currentImageUrl = imageUrl;
    appState.currentBackgroundImageUrl = imageUrl;

    // Atualiza o crédito do Unsplash no rodapé (se existir o container)
    const creditContainer = document.getElementById('unsplash-credit');
    if (creditContainer && attribution) {
        creditContainer.innerHTML = attribution.html;
        creditContainer.style.display = 'block';
    } else if (creditContainer && !attribution) {
        creditContainer.innerHTML = '';
        creditContainer.style.display = 'none';
    }
}
