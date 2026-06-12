// js/api.js - Usando a NET Bible API (mais confiável)
import { FALLBACK_VERSES } from './fallbackVerses.js';

export const TIMEOUT_MS = 8000; // Um pouco mais de tempo para a nova API

let consecutiveApiFailures = 0;
const MAX_FAILURES = 3;

/**
 * Busca um versículo aleatório da NET Bible API.
 * Documentação: https://labs.bible.org/api_web_service
 */
export async function fetchVerseFromAPI() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    // Endpoint para um versículo aleatório em JSON, com a tradução 'nvi' (Nova Versão Internacional)
    const apiUrl = 'https://labs.bible.org/api/?passage=random&type=json';

    try {
        const res = await fetch(apiUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        // A API retorna um array, mesmo para um único versículo
        const verseData = Array.isArray(data) ? data[0] : data;
        
        if (!verseData || !verseData.bookname || !verseData.chapter || !verseData.versenum || !verseData.text) {
            throw new Error('Resposta da API em formato inesperado.');
        }

        consecutiveApiFailures = 0;
        
        // Mapeia os dados para o formato usado pelo app
        return {
            text: verseData.text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
            reference: `${verseData.bookname} ${verseData.chapter}:${verseData.versenum}`,
            book: mapBookNameToAbbreviation(verseData.bookname),
            chapter: verseData.chapter,
            verse: verseData.versenum
        };
    } catch (e) {
        clearTimeout(timeoutId);
        console.warn(`[VersDay] Erro na NET Bible API:`, e.message);
        consecutiveApiFailures++;
        return null;
    }
}

// Função auxiliar para mapear nomes de livros para abreviações usadas internamente.
// Isso é útil para manter a compatibilidade com outras partes do app.
function mapBookNameToAbbreviation(bookName) {
    const bookMap = {
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
    return bookMap[bookName] || bookName.toLowerCase().replace(/\s/g, '');
}

export function getRandomFallbackVerse() {
    // ... (mantenha esta função exatamente como está no seu código original)
    return { ...FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)] };
}

export function shouldTryAPI() {
    return consecutiveApiFailures < MAX_FAILURES;
}
