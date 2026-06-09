import { fetchVerseFromAPI, getRandomFallbackVerse, shouldTryAPI } from './api.js';
import { appState } from './state.js';

let verseCache = [];
const CACHE_SIZE = 15;

export function getCache() { return verseCache; }
export function setCache(newCache) { verseCache = newCache; }
export function isVerseInCache(verse) {
  return verseCache.some(v => v.reference === verse.reference);
}

export async function addToCache(lastVerseRef, isRecentlyUsed) {
  if (appState.isLoading) return;

  // Alterna entre API e fallback para manter diversidade
  const useAPI = shouldTryAPI() && Math.random() > 0.3; // 70% API, 30% fallback quando API ok

  let newVerse = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (!newVerse && attempts < maxAttempts) {
    let fetched = null;

    if (useAPI) {
      fetched = await fetchVerseFromAPI();
    }

    // Se API falhou ou não foi tentada, usa fallback
    if (!fetched) {
      fetched = getRandomFallbackVerse();
    }

    if (
      fetched &&
      !isVerseInCache(fetched) &&
      !isRecentlyUsed(fetched.reference) &&
      (!appState.currentVerse || fetched.reference !== appState.currentVerse.reference)
    ) {
      newVerse = fetched;
      break;
    }
    attempts++;
    if (useAPI) await new Promise(r => setTimeout(r, 200));
  }

  if (newVerse) {
    verseCache.push(newVerse);
    if (verseCache.length > CACHE_SIZE) verseCache.shift();
  }
}
