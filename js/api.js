// js/api.js
// Fonte de versículos: acervo curado local (FALLBACK_VERSES).
//
// Por que não usamos mais o endpoint "random" do bible-api.com:
// ele sorteia literalmente qualquer versículo da Bíblia (genealogias,
// listas de leis, censos, etc.), o que resultava em versículos sem
// nenhum caráter inspirador/motivador/confortante — o oposto do
// propósito do app. Por isso a seleção agora vem sempre do acervo
// curado abaixo, que já foi escolhido a dedo por tema (paz, esperança,
// coragem, conforto, gratidão...) e é usado também para escolher a
// imagem de fundo mais contextualizada (ver semantic.js).
import { FALLBACK_VERSES } from './fallbackVerses.js';

export function getRandomFallbackVerse() {
  return { ...FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)] };
}

// Mantido por compatibilidade (não há mais chamadas de rede a limitar).
export function shouldTryAPI() {
  return false;
}
