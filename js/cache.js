import { fetchVerseFromAPI } from './api.js';

let verseCache = [];
let CACHE_SIZE = 15;

export function getCache() { return verseCache; }
export function setCache(newCache) { verseCache = newCache; }
export function isVerseInCache(verse) {
  return verseCache.some(v => v.reference === verse.reference);
}
export async function addToCache(currentVerse, isLoading, lastVerseRef, isRecentlyUsed) {
  if (isLoading) return;
  let newVerse = null;
  let attempts = 0;
  const maxAttempts = 5;
  while (!newVerse && attempts < maxAttempts) {
    const fetched = await fetchVerseFromAPI();
    if (fetched && !isVerseInCache(fetched) && !isRecentlyUsed(fetched.reference) && (!currentVerse || fetched.reference !== currentVerse.reference)) {
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
