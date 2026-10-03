// Compatibilidade legada. Não contém chaves de API.
// O acesso ao Unsplash agora passa exclusivamente pelo proxy seguro em visual-provider.js.
import { analyzeVerseVisualIntent, buildVisualQueries } from './visual-semantic.js';
import { searchExternalCandidates } from './visual-provider.js';
import { getCuratedCandidates } from './visual-library.js';

export async function fetchContextualImage(queryOrVerse) {
  const verse = typeof queryOrVerse === 'object' ? queryOrVerse : { text: String(queryOrVerse || '') };
  const intent = analyzeVerseVisualIntent(verse);
  const queries = buildVisualQueries(intent);
  const external = await searchExternalCandidates(intent, queries, 12);
  const first = external[0];
  if (!first) return null;
  return {
    imageUrl:first.imageUrl,
    attribution:{
      photographer:first.photographer || null,
      photographerLink:first.photographerLink || null,
      providerName:first.providerName || 'Unsplash',
      providerPage:first.providerPage || 'https://unsplash.com/'
    }
  };
}

export function getFallbackImage(theme) {
  const intent = analyzeVerseVisualIntent({ text:'', theme });
  return getCuratedCandidates(intent,1)[0]?.imageUrl || '';
}
