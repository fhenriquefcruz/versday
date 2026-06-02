import { fetchVerseFromAPI } from './api.js';
import { appState } from './state.js';

let verseCache = [];
const CACHE_SIZE = 15;

export function getCache() { return verseCache; }
export function setCache(newCache) { verseCache = newCache; }
export function isVerseInCache(verse) { return verseCache.some(v => v.reference === verse.reference); }

export async function addToCache(lastVerseRef, isRecentlyUsed) {
  if (appState.isLoading) return;
  let newVerse = null;
  let attempts = 0;
  while (!newVerse && attempts < 5) {
    const fetched = await fetchVerseFromAPI();
    if (fetched && !isVerseInCache(fetched) && !isRecentlyUsed(fetched.reference) && (!appState.currentVerse || fetched.reference !== appState.currentVerse.reference)) {
      newVerse = fetched;
      break;
    }
    attempts++;
    await new Promise(r => setTimeout(r, 200));
  }
  if (newVerse) {
    verseCache.push(newVerse);
    if (verseCache.length > CACHE_SIZE) verseCache.shift();
  }
}
