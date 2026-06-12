// js/api.js — usando bible-api.com com random e versão Almeida Revista e Atualizada (ARA)
import { FALLBACK_VERSES } from './fallbackVerses.js';

export const TIMEOUT_MS = 8000;
let consecutiveApiFailures = 0;
const MAX_FAILURES = 3;

export async function fetchVerseFromAPI() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  // Endpoint que retorna um versículo aleatório em JSON, tradução 'almeida' (ARA)
  const url = 'https://bible-api.com/?random=1&translation=almeida';
  
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    if (!data.text || !data.reference) throw new Error('Formato inválido');
    
    // Extrai livro, capítulo e versículo da referência (ex: "João 3:16")
    const refParts = data.reference.match(/^([0-9]?\s?[a-záéíóúâêôãõç]+)\s+(\d+):(\d+)/i);
    const bookName = refParts ? refParts[1] : 'Bíblia';
    const chapter = refParts ? parseInt(refParts[2]) : 1;
    const verseNum = refParts ? parseInt(refParts[3]) : 1;
    
    consecutiveApiFailures = 0;
    return {
      text: data.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
      reference: data.reference,
      book: mapBookNameToAbbreviation(bookName),
      chapter: chapter,
      verse: verseNum
    };
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn('[VersDay] Erro na API:', e.message);
    consecutiveApiFailures++;
    return null;
  }
}

// Mapeamento de nomes para abreviações
function mapBookNameToAbbreviation(bookName) {
  const map = {
    "Gênesis": "gn", "Êxodo": "ex", "Levítico": "lv", "Números": "nm", "Deuteronômio": "dt",
    "Josué": "js", "Juízes": "jz", "Rute": "rt", "1 Samuel": "1sm", "2 Samuel": "2sm",
    "1 Reis": "1rs", "2 Reis": "2rs", "1 Crônicas": "1cr", "2 Crônicas": "2cr", "Esdras": "ed",
    "Neemias": "ne", "Ester": "et", "Jó": "jó", "Salmos": "sl", "Provérbios": "pv",
    "Eclesiastes": "ec", "Cantares": "ct", "Isaías": "is", "Jeremias": "jr", "Lamentações": "lm",
    "Ezequiel": "ez", "Daniel": "dn", "Oséias": "os", "Joel": "jl", "Amós": "am",
    "Obadias": "ob", "Jonas": "jn", "Miquéias": "mq", "Naum": "na", "Habacuque": "hc",
    "Sofonias": "sf", "Ageu": "ag", "Zacarias": "zc", "Malaquias": "ml",
    "Mateus": "mt", "Marcos": "mc", "Lucas": "lc", "João": "jo", "Atos": "atos", "Romanos": "rm",
    "1 Coríntios": "1co", "2 Coríntios": "2co", "Gálatas": "gl", "Efésios": "ef", "Filipenses": "fp",
    "Colossenses": "cl", "1 Tessalonicenses": "1ts", "2 Tessalonicenses": "2ts", "1 Timóteo": "1tm",
    "2 Timóteo": "2tm", "Tito": "tt", "Filemom": "fm", "Hebreus": "hb", "Tiago": "tg",
    "1 Pedro": "1pe", "2 Pedro": "2pe", "1 João": "1jo", "2 João": "2jo", "3 João": "3jo",
    "Judas": "jd", "Apocalipse": "ap"
  };
  return map[bookName] || bookName.toLowerCase().replace(/\s/g, '');
}

export function getRandomFallbackVerse() {
  return { ...FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)] };
}

export function shouldTryAPI() {
  return consecutiveApiFailures < MAX_FAILURES;
}
