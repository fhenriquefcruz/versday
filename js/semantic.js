// Compatibilidade com a API antiga. A inteligência real vive em visual-semantic.js.
import { analyzeVerseVisualIntent, buildVisualQueries } from './visual-semantic.js';

export function classifyVerseTheme(verseText) {
  const intent = analyzeVerseVisualIntent({ text: verseText || '' });
  return { theme: intent.semantic.primaryTheme, confidence: intent.confidence };
}

export function getImageQueryForVerse(verse) {
  const intent = analyzeVerseVisualIntent(verse || {});
  const queries = buildVisualQueries(intent);
  return { theme: intent.semantic.primaryTheme, query: queries[0] || '', intent, queries };
}
