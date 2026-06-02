import { appState } from './state.js';
import { fetchVerseFromAPI, getRandomFallbackVerse } from './api.js';
import { getCache, setCache, addToCache, isVerseInCache } from './cache.js';
import { getHistory, addToHistory } from './history.js';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from './favorites.js';
import { initTheme } from './theme.js';
import { initBackgroundLayers, setBackgroundImage } from './background.js';
import { shareWhatsApp, shareInstagram, copyVerseText } from './share.js';

// DOM elements
const dynamicZone = document.getElementById('verseDynamicZone');
const refreshBtn = document.getElementById('refreshBtn');
const shareWABtn = document.getElementById('shareWABtn');
const shareIGBtn = document.getElementById('shareIGBtn');
const copyBtn = document.getElementById('copyTextBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const historyBtn = document.getElementById('historyBtn');
const favModal = document.getElementById('favoritesModal');
const histModal = document.getElementById('historyModal');

// Histórico em memória (para evitar repetições)
let verseHistoryRefs = [];
let lastVerseRef = null;
let verseCache = [];

function isRecentlyUsed(ref) { return verseHistoryRefs.includes(ref); }
function addToHistoryRef(ref) {
  verseHistoryRefs.unshift(ref);
  if (verseHistoryRefs.length > 30) verseHistoryRefs.pop();
}

async function loadNewVerse() {
  if (appState.isLoading) return;
  appState.isLoading = true;
  showLoading(true);
  try {
    let verse = null;
    // 1) tentar cache
    if (verseCache.length > 0) {
      let idx = 0;
      while (idx < verseCache.length && (verseCache[idx].reference === lastVerseRef || isRecentlyUsed(verseCache[idx].reference))) idx++;
      if (idx < verseCache.length) {
        verse = verseCache[idx];
        verseCache.splice(idx, 1);
        addToCache(lastVerseRef, isRecentlyUsed);
      }
    }
    if (!verse) {
      // 2) API
      const apiVerse = await fetchVerseFromAPI();
      if (apiVerse && !isRecentlyUsed(apiVerse.reference)) verse = apiVerse;
    }
    if (!verse) {
      // 3) fallback local
      let fallback = getRandomFallbackVerse();
      let attempts = 0;
      while (isRecentlyUsed(fallback.reference) && attempts < 10) {
        fallback = getRandomFallbackVerse();
        attempts++;
      }
      verse = fallback;
    }
    displayVerse(verse);
  } catch (err) { console.error(err); displayVerse(getRandomFallbackVerse()); }
  finally {
    appState.isLoading = false;
    showLoading(false);
    if (verseCache.length < 8) addToCache(lastVerseRef, isRecentlyUsed);
  }
}

function displayVerse(verse) {
  // Atualiza estado global
  appState.currentVerse = verse;
  lastVerseRef = verse.reference;
  addToHistoryRef(verse.reference);
  addToHistory(verse);
  // Renderiza HTML
  const fullBook = getFullBookName(verse.book);
  const displayRef = `${fullBook} ${verse.chapter}:${verse.verse}`;
  const html = `
    <div class="verse-text">${escapeHtml(verse.text)}</div>
    <div class="verse-reference-wrapper">
      <span class="verse-reference">${escapeHtml(displayRef)}</span>
      <a href="https://www.bibliaonline.com.br/ara/${verse.book.toLowerCase()}/${verse.chapter}" target="_blank" class="chapter-link">📖</a>
    </div>
  `;
  smoothUpdate(html);
  setBackgroundImage(verse.text);
  updateFavoriteButton();
}

function smoothUpdate(html) {
  const zone = dynamicZone;
  zone.style.transition = 'opacity 0.15s';
  zone.style.opacity = '0';
  setTimeout(() => {
    zone.innerHTML = html;
    zone.style.opacity = '1';
  }, 150);
}

function showLoading(show) {
  if (show && !dynamicZone.innerHTML.includes('timer-circle')) {
    dynamicZone.innerHTML = `<div class="loading-timer"><div class="timer-circle">0</div><div class="loading-message">Buscando versículo...</div><div id="delayMessage"></div></div>`;
    let seconds = 0;
    const start = Date.now();
    const timer = setInterval(() => {
      if (!appState.isLoading) { clearInterval(timer); return; }
      const elapsed = Math.floor((Date.now()-start)/1000);
      const el = document.querySelector('.timer-circle');
      if (el) el.textContent = elapsed;
      if (elapsed >= 10) {
        const msgDiv = document.getElementById('delayMessage');
        if (msgDiv && !msgDiv.innerHTML) msgDiv.innerHTML = '<div class="delay-message">🙏 Aguarde, muitas requisições...</div>';
      }
    }, 1000);
    appState.timerInterval = timer;
  } else if (!show && appState.timerInterval) {
    clearInterval(appState.timerInterval);
    appState.timerInterval = null;
  }
}

function updateFavoriteButton() { /* implementar se desejar ícone de coração dinâmico */ }
function escapeHtml(str) { return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m])); }
function getFullBookName(abbrev) { const map={sl:'Salmos',fp:'Filipenses',is:'Isaías',jo:'João','1jo':'1 João',gl:'Gálatas',ef:'Efésios',pv:'Provérbios',ec:'Eclesiastes',mt:'Mateus',mc:'Marcos',lc:'Lucas',atos:'Atos',ap:'Apocalipse'}; return map[abbrev]||abbrev; }

// Modais
function renderFavorites() { /* preenche #favoritesList */ }
function renderHistory() { /* preenche #historyList */ }

// Eventos
refreshBtn.onclick = () => loadNewVerse();
shareWABtn.onclick = () => shareWhatsApp();
shareIGBtn.onclick = () => shareInstagram();
copyBtn.onclick = () => copyVerseText();
favoritesBtn.onclick = () => { renderFavorites(); favModal.style.display = 'flex'; };
historyBtn.onclick = () => { renderHistory(); histModal.style.display = 'flex'; };
document.querySelectorAll('.modal .close').forEach(btn => btn.onclick = () => btn.closest('.modal').style.display = 'none');

// Inicialização
initTheme();
initBackgroundLayers();
loadNewVerse();
