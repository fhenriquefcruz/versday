import { FALLBACK_VERSES } from './fallbackVerses.js';

export const API_URL = 'https://bible-api.com/data/ara/random';
export const TIMEOUT_MS = 5000;

// Controle para não usar fallback em excesso
let consecutiveApiFailures = 0;
const MAX_FAILURES_BEFORE_FALLBACK = 2;

export async function fetchVerseFromAPI() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.text || !data.reference) throw new Error('Resposta inválida');
    consecutiveApiFailures = 0; // reseta contador em sucesso
    return {
      text: data.text,
      reference: data.reference,
      book: data.book_id,
      chapter: data.chapter,
      verse: data.verse
    };
  } catch (e) {
    clearTimeout(timeoutId);
    consecutiveApiFailures++;
    console.warn(`[VersDay] API falhou (tentativa ${consecutiveApiFailures}):`, e.message);
    return null;
  }
}

export function getRandomFallbackVerse() {
  const randomIndex = Math.floor(Math.random() * FALLBACK_VERSES.length);
  return { ...FALLBACK_VERSES[randomIndex] };
}

// Retorna true se deve tentar a API (não excedeu falhas consecutivas)
export function shouldTryAPI() {
  return consecutiveApiFailures < MAX_FAILURES_BEFORE_FALLBACK;
}
