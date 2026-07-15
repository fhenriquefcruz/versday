// js/background.js
import { fetchContextualImage, getFallbackImage } from './unsplash.js';
import { getImageQueryForVerse } from './semantic.js';
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

// Recebe o versículo atual para escolher uma imagem contextualizada
// com o tema dele (paz, coragem, gratidão, etc.), em vez de uma busca
// genérica de paisagem sempre igual.
export async function setBackgroundImage(verse) {
    const { theme, query } = getImageQueryForVerse(verse);

    const result = await fetchContextualImage(query);
    let imageUrl;
    let attribution = null;

    if (result && result.imageUrl) {
        imageUrl = result.imageUrl;
        attribution = result.attribution;
    } else {
        imageUrl = getFallbackImage(theme);
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

    // Atualiza o crédito do Unsplash no container
    const creditContainer = document.getElementById('unsplash-credit');
    if (creditContainer && attribution) {
        creditContainer.innerHTML = attribution.html;
        creditContainer.style.display = 'block';
    } else if (creditContainer && !attribution) {
        creditContainer.innerHTML = '';
        creditContainer.style.display = 'none';
    }
}
