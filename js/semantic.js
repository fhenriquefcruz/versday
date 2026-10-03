// js/semantic.js
// Compatibilidade com chamadas antigas.
// A inteligência visual real vive em visualIntelligence.js e visualEngine.js.

import { analyzeVerse, buildVisualQueries } from './visualIntelligence.js';

export function classifyVerseTheme(verseText, theme = 'fe') {
  const intent = analyzeVerse({ text: verseText || '', theme });
  return {
    theme: intent.semantic.primaryTheme,
    confidence: intent.confidence
  };
}

export function getImageQueryForVerse(verse) {
  const intent = analyzeVerse(verse || {});
  const queries = buildVisualQueries(intent);
  return {
    theme: intent.semantic.primaryTheme,
    query: queries[0]?.query || '',
    intent,
    queries
  };
}
