import { currentVerse } from './ui.js'; // exportaremos a referência

export async function generateShareImage(format, currentVerse, currentBackgroundImageUrl) { /* ... canvas melhorado com sombras, vinheta, aspas decorativas, marca d'água elegante ... */ }
export async function shareImageWithWebShare(format, filename, currentVerse, currentBackgroundImageUrl) { /* ... */ }
export function copyVerseText(verseText, reference) {
  navigator.clipboard.writeText(`${verseText} (${reference} - ARA)`);
  alert('Versículo copiado!');
}
export async function shareVerseText(verseText, reference) {
  const text = `${verseText} (${reference} - ARA)`;
  if (navigator.share) {
    await navigator.share({ title: 'Versículo do Dia', text });
  } else {
    navigator.clipboard.writeText(text);
    alert('Texto copiado!');
  }
}
