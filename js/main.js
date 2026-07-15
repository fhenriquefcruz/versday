// js/main.js
import { appState } from './state.js';
import { getRandomFallbackVerse } from './api.js';
import { getCache, setCache, addToCache, isVerseInCache } from './cache.js';
import { getHistory, addToHistory } from './history.js';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from './favorites.js';
import { initTheme } from './theme.js';
import { initBackgroundLayers, setBackgroundImage } from './background.js';
import { shareWhatsApp, shareInstagram, copyVerseText } from './share.js';
import { initChat } from './chat.js';

// ========== DOM ==========
const dynamicZone      = document.getElementById('verseDynamicZone');
const refreshBtn       = document.getElementById('refreshBtn');
const shareWABtn       = document.getElementById('shareWABtn');
const shareIGBtn       = document.getElementById('shareIGBtn');
const copyBtn          = document.getElementById('copyTextBtn');
const favoritesBtn     = document.getElementById('favoritesBtn');
const historyBtn       = document.getElementById('historyBtn');
const favModal         = document.getElementById('favoritesModal');
const histModal        = document.getElementById('historyModal');
const favListDiv       = document.getElementById('favoritesList');
const histListDiv      = document.getElementById('historyList');
const favoriteCurrentBtn = document.getElementById('favoriteCurrentBtn');

// ========== Estado local ==========
let verseHistoryRefs = [];
let lastVerseRef = null;

function isRecentlyUsed(ref) {
  return verseHistoryRefs.includes(ref);
}
function addToHistoryRef(ref) {
  verseHistoryRefs.unshift(ref);
  if (verseHistoryRefs.length > 30) verseHistoryRefs.pop();
}

// ========== Livros ==========
const BOOK_NAMES = {
  "gn":"Gênesis","ex":"Êxodo","lv":"Levítico","nm":"Números","dt":"Deuteronômio",
  "js":"Josué","jz":"Juízes","rt":"Rute","1sm":"1 Samuel","2sm":"2 Samuel",
  "1rs":"1 Reis","2rs":"2 Reis","1cr":"1 Crônicas","2cr":"2 Crônicas","ed":"Esdras",
  "ne":"Neemias","et":"Ester","jó":"Jó","sl":"Salmos","pv":"Provérbios",
  "ec":"Eclesiastes","ct":"Cantares","is":"Isaías","jr":"Jeremias","lm":"Lamentações",
  "ez":"Ezequiel","dn":"Daniel","os":"Oséias","jl":"Joel","am":"Amós",
  "ob":"Obadias","jn":"Jonas","mq":"Miquéias","na":"Naum","hc":"Habacuque",
  "sf":"Sofonias","ag":"Ageu","zc":"Zacarias","ml":"Malaquias",
  "mt":"Mateus","mc":"Marcos","lc":"Lucas","jo":"João","atos":"Atos","rm":"Romanos",
  "1co":"1 Coríntios","2co":"2 Coríntios","gl":"Gálatas","ef":"Efésios","fp":"Filipenses",
  "cl":"Colossenses","1ts":"1 Tessalonicenses","2ts":"2 Tessalonicenses","1tm":"1 Timóteo",
  "2tm":"2 Timóteo","tt":"Tito","fm":"Filemom","hb":"Hebreus","tg":"Tiago",
  "1pe":"1 Pedro","2pe":"2 Pedro","1jo":"1 João","2jo":"2 João","3jo":"3 João",
  "jd":"Judas","ap":"Apocalipse"
};

function getFullBookName(abbrev) {
  return BOOK_NAMES[abbrev] || abbrev;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m])
  );
}

// ========== Loading ==========
function smoothUpdate(html) {
  dynamicZone.style.transition = 'opacity 0.15s';
  dynamicZone.style.opacity = '0';
  setTimeout(() => {
    dynamicZone.innerHTML = html;
    dynamicZone.style.opacity = '1';
  }, 150);
}

let timerInterval = null;

function showLoading(show) {
  if (show) {
    dynamicZone.innerHTML = `
      <div class="loading-timer">
        <div class="timer-circle">0</div>
        <div class="loading-message">Buscando versículo...</div>
        <div id="delayMessage"></div>
      </div>
    `;
    let seconds = 0;
    const start = Date.now();
    timerInterval = setInterval(() => {
      if (!appState.isLoading) { clearInterval(timerInterval); return; }
      const el = document.querySelector('.timer-circle');
      if (el) el.textContent = Math.floor((Date.now() - start) / 1000);
      if (Math.floor((Date.now() - start) / 1000) >= 8) {
        const msgDiv = document.getElementById('delayMessage');
        if (msgDiv && !msgDiv.innerHTML) {
          msgDiv.innerHTML = '<div class="delay-message">🙏 Aguarde, buscando nos repositórios...</div>';
        }
      }
    }, 1000);
  } else {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }
}

// ========== Exibir versículo ==========
function displayVerse(verse) {
  appState.currentVerse = verse;
  lastVerseRef = verse.reference;
  addToHistoryRef(verse.reference);
  addToHistory(verse);

  const fullBook = getFullBookName(verse.book);
  const displayRef = `${fullBook} ${verse.chapter}:${verse.verse}`;

  const html = `
    <div class="verse-text">${escapeHtml(verse.text)}</div>
    <div class="verse-reference-wrapper">
      <span class="verse-reference">${escapeHtml(displayRef)}</span>
      <a href="https://www.bibliaonline.com.br/ara/${verse.book.toLowerCase()}/${verse.chapter}"
         target="_blank" rel="noopener noreferrer" class="chapter-link" title="Ler capítulo completo">📖</a>
    </div>
  `;

  smoothUpdate(html);
  setBackgroundImage(verse);
  updateFavoriteButton();
}

// ========== Carregar versículo — equilibrado entre API e fallback ==========
async function loadNewVerse() {
  if (appState.isLoading) return;
  appState.isLoading = true;
  showLoading(true);

  try {
    let verse = null;

    // 1. Tenta usar o cache
    const cache = getCache();
    if (cache.length > 0) {
      let idx = cache.findIndex(v =>
        v.reference !== lastVerseRef && !isRecentlyUsed(v.reference)
      );
      if (idx !== -1) {
        verse = cache[idx];
        cache.splice(idx, 1);
        setCache(cache);
        addToCache(lastVerseRef, isRecentlyUsed); // repõe cache em background
      }
    }

    // 2. Cache vazio — sorteia do acervo curado local
    if (!verse) {
      let fallback = getRandomFallbackVerse();
      let attempts = 0;
      while (isRecentlyUsed(fallback.reference) && attempts < 20) {
        fallback = getRandomFallbackVerse();
        attempts++;
      }
      verse = fallback;
    }

    displayVerse(verse);

  } catch (err) {
    console.error('[VersDay] Erro ao carregar versículo:', err);
    displayVerse(getRandomFallbackVerse());
  } finally {
    appState.isLoading = false;
    showLoading(false);
    // Repõe cache se necessário
    if (getCache().length < 8) addToCache(lastVerseRef, isRecentlyUsed);
  }
}

// ========== Favoritar versículo atual ==========
function updateFavoriteButton() {
  if (!appState.currentVerse || !favoriteCurrentBtn) return;
  const fav = isFavorite(appState.currentVerse.reference);
  favoriteCurrentBtn.textContent = fav ? '⭐' : '☆';
  favoriteCurrentBtn.setAttribute('aria-label', fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
}

function toggleFavoriteCurrent() {
  if (!appState.currentVerse) return;
  if (isFavorite(appState.currentVerse.reference)) {
    removeFavorite(appState.currentVerse.reference);
  } else {
    addFavorite(appState.currentVerse);
  }
  updateFavoriteButton();
  renderFavorites();
}

if (favoriteCurrentBtn) favoriteCurrentBtn.addEventListener('click', toggleFavoriteCurrent);

// ========== Modais ==========
function renderFavorites() {
  const favs = getFavorites();
  if (!favs.length) {
    favListDiv.innerHTML = '<p style="text-align:center;padding:20px;opacity:.7">Nenhum favorito ainda. ⭐</p>';
    return;
  }
  favListDiv.innerHTML = favs.map(fav => `
    <div class="favorite-item">
      <div style="flex:1;min-width:0">
        <strong>${getFullBookName(fav.book)} ${fav.chapter}:${fav.verse}</strong>
        <br><small style="opacity:.75">${escapeHtml(fav.text.substring(0, 90))}…</small>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="load-fav" data-ref="${escapeHtml(fav.reference)}" title="Ler">📖</button>
        <button class="remove-fav" data-ref="${escapeHtml(fav.reference)}" title="Remover">🗑️</button>
      </div>
    </div>
  `).join('');

  favListDiv.querySelectorAll('.load-fav').forEach(btn => {
    btn.addEventListener('click', () => {
      const found = getFavorites().find(f => f.reference === btn.dataset.ref);
      if (found) displayVerse(found);
      favModal.style.display = 'none';
    });
  });
  favListDiv.querySelectorAll('.remove-fav').forEach(btn => {
    btn.addEventListener('click', () => {
      removeFavorite(btn.dataset.ref);
      renderFavorites();
      updateFavoriteButton();
    });
  });
}

function renderHistory() {
  const history = getHistory();
  if (!history.length) {
    histListDiv.innerHTML = '<p style="text-align:center;padding:20px;opacity:.7">Nenhum versículo visto ainda. 📜</p>';
    return;
  }
  histListDiv.innerHTML = history.map(hist => `
    <div class="history-item">
      <div style="flex:1;min-width:0">
        <strong>${getFullBookName(hist.book)} ${hist.chapter}:${hist.verse}</strong>
        <br><small style="opacity:.75">${escapeHtml(hist.text.substring(0, 90))}…</small>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0">
        <button class="load-hist" data-ref="${escapeHtml(hist.reference)}" title="Ler">📖</button>
        <button class="fav-hist" data-ref="${escapeHtml(hist.reference)}"
          data-book="${escapeHtml(hist.book)}"
          data-chapter="${hist.chapter}"
          data-verse="${hist.verse}"
          data-text="${escapeHtml(hist.text)}"
          title="Favoritar">⭐</button>
      </div>
    </div>
  `).join('');

  histListDiv.querySelectorAll('.load-hist').forEach(btn => {
    btn.addEventListener('click', () => {
      const found = getHistory().find(h => h.reference === btn.dataset.ref);
      if (found) displayVerse(found);
      histModal.style.display = 'none';
    });
  });
  histListDiv.querySelectorAll('.fav-hist').forEach(btn => {
    btn.addEventListener('click', () => {
      addFavorite({
        text: btn.dataset.text,
        reference: btn.dataset.ref,
        book: btn.dataset.book,
        chapter: parseInt(btn.dataset.chapter),
        verse: parseInt(btn.dataset.verse)
      });
      btn.textContent = '✅';
      btn.disabled = true;
    });
  });
}

// ========== Eventos ==========
refreshBtn.addEventListener('click', loadNewVerse);
shareWABtn.addEventListener('click', shareWhatsApp);
shareIGBtn.addEventListener('click', shareInstagram);
copyBtn.addEventListener('click', copyVerseText);

favoritesBtn.addEventListener('click', () => {
  renderFavorites();
  favModal.style.display = 'flex';
});
historyBtn.addEventListener('click', () => {
  renderHistory();
  histModal.style.display = 'flex';
});

document.querySelectorAll('.modal .close').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.modal').style.display = 'none');
});
window.addEventListener('click', e => {
  if (e.target === favModal)  favModal.style.display  = 'none';
  if (e.target === histModal) histModal.style.display = 'none';
});

// ========== Boot ==========
initTheme();
initBackgroundLayers();
loadNewVerse();
initChat();
