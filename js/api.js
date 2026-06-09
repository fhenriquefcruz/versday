import { FALLBACK_VERSES } from './fallbackVerses.js';

export const TIMEOUT_MS = 6000;

let consecutiveApiFailures = 0;
const MAX_FAILURES = 3;

// Endpoints testados — bible-api.com suporta tradução acf e nvi em pt-BR
const BIBLE_ENDPOINTS = [
  'https://bible-api.com/data/acf/random',
  'https://bible-api.com/data/nvi/random',
];

export async function fetchVerseFromAPI() {
  for (const endpoint of BIBLE_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      if (!res.ok) { console.warn(`[VersDay] ${endpoint} → ${res.status}`); continue; }
      const data = await res.json();
      if (!data.text || !data.reference) { console.warn('[VersDay] Resposta inválida:', data); continue; }
      consecutiveApiFailures = 0;
      return {
        text: data.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
        reference: data.reference,
        book: data.book_id || data.reference.match(/^([0-9]?\s?[a-záéíóúâêôãõç]+)/i)?.[1]?.toLowerCase().replace(/\s/g, '') || 'sl',
        chapter: data.chapter || 1,
        verse: data.verse || 1
      };
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn(`[VersDay] Erro ${endpoint}:`, e.message);
    }
  }
  consecutiveApiFailures++;
  return null;
}

export function getRandomFallbackVerse() {
  return { ...FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)] };
}

export function shouldTryAPI() {
  return consecutiveApiFailures < MAX_FAILURES;
}
