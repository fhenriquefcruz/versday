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
const favListDiv = document.getElementById('favoritesList');
const histListDiv = document.getElementById('historyList');
const favoriteCurrentBtn = document.getElementById('favoriteCurrentBtn');

// Estado local (histórico de referências para evitar repetição)
let verseHistoryRefs = [];
let lastVerseRef = null;

function isRecentlyUsed(ref) { return verseHistoryRefs.includes(ref); }
function addToHistoryRef(ref) {
  verseHistoryRefs.unshift(ref);
  if (verseHistoryRefs.length > 30) verseHistoryRefs.pop();
}

// Funções auxiliares
function getFullBookName(abbrev) {
  const map = {
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
  return map[abbrev] || abbrev;
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[m]));
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
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const el = document.querySelector('.timer-circle');
      if (el) el.textContent = elapsed;
      if (elapsed >= 10) {
        const msgDiv = document.getElementById('delayMessage');
        if (msgDiv && !msgDiv.innerHTML) {
          msgDiv.innerHTML = '<div class="delay-message">🙏 Aguarde, muitas requisições simultâneas. Em breve aparecerá.</div>';
        }
      }
    }, 1000);
    appState.timerInterval = timer;
  } else if (!show && appState.timerInterval) {
    clearInterval(appState.timerInterval);
    appState.timerInterval = null;
  }
}

// Botão favoritar atual
function updateFavoriteButton() {
  if (!appState.currentVerse) return;
  const isFav = isFavorite(appState.currentVerse.reference);
  favoriteCurrentBtn.textContent = isFav ? '❤️' : '🤍';
  favoriteCurrentBtn.setAttribute('aria-label', isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
}

function toggleFavoriteCurrent() {
  if (!appState.currentVerse) return;
  if (isFavorite(appState.currentVerse.reference)) {
    removeFavorite(appState.currentVerse.reference);
  } else {
    addFavorite(appState.currentVerse);
  }
  updateFavoriteButton();
  renderFavorites(); // atualiza modal se estiver aberto
}

favoriteCurrentBtn.addEventListener('click', toggleFavoriteCurrent);

// Renderização do versículo
function displayVerse(verse) {
  appState.currentVerse = verse;
  lastVerseRef = verse.reference;
  addToHistoryRef(verse.reference);
  addToHistory(verse);
  updateFavoriteButton();
  const fullBook = getFullBookName(verse.book);
  const displayRef = `${fullBook} ${verse.chapter}:${verse.verse}`;
  const html = `
    <div class="verse-text">${escapeHtml(verse.text)}</div>
    <div class="verse-reference-wrapper">
      <span class="verse-reference">${escapeHtml(displayRef)}</span>
      <a href="https://www.bibliaonline.com.br/ara/${verse.book.toLowerCase()}/${verse.chapter}" target="_blank" class="chapter-link" rel="noopener noreferrer">📖</a>
    </div>
  `;
  smoothUpdate(html);
  setBackgroundImage(verse.text);
}

// Lógica principal de carregamento
async function loadNewVerse() {
  if (appState.isLoading) return;
  appState.isLoading = true;
  showLoading(true);
  try {
    let verse = null;
    // 1) Cache centralizado
    let cache = getCache();
    if (cache.length > 0) {
      let idx = 0;
      while (idx < cache.length && (cache[idx].reference === lastVerseRef || isRecentlyUsed(cache[idx].reference))) {
        idx++;
      }
      if (idx < cache.length) {
        verse = cache[idx];
        cache.splice(idx, 1);
        setCache(cache);
        addToCache(lastVerseRef, isRecentlyUsed);
      }
    }
    // 2) API
    if (!verse) {
      const apiVerse = await fetchVerseFromAPI();
      if (apiVerse && !isRecentlyUsed(apiVerse.reference)) verse = apiVerse;
    }
    // 3) Fallback local
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
    console.error(err);
    displayVerse(getRandomFallbackVerse());
  } finally {
    appState.isLoading = false;
    showLoading(false);
    if (getCache().length < 8) addToCache(lastVerseRef, isRecentlyUsed);
  }
}

// ========== MODAIS ==========
function renderFavorites() {
  const favs = getFavorites();
  if (favs.length === 0) {
    favListDiv.innerHTML = '<p style="text-align:center">Nenhum favorito ainda. ❤️</p>';
    return;
  }
  favListDiv.innerHTML = favs.map(fav => `
    <div class="favorite-item">
      <div><strong>${getFullBookName(fav.book)} ${fav.chapter}:${fav.verse}</strong><br><small>${fav.text.substring(0, 80)}...</small></div>
      <div>
        <button class="load-fav" data-ref="${fav.reference}" data-book="${fav.book}" data-chapter="${fav.chapter}" data-verse="${fav.verse}" data-text="${escapeHtml(fav.text)}">📖 Ler</button>
        <button class="remove-fav" data-ref="${fav.reference}">🗑️</button>
      </div>
    </div>
  `).join('');
  // Eventos
  document.querySelectorAll('.load-fav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ref = btn.dataset.ref;
      const found = getFavorites().find(f => f.reference === ref);
      if (found) displayVerse(found);
      favModal.style.display = 'none';
    });
  });
  document.querySelectorAll('.remove-fav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ref = btn.dataset.ref;
      removeFavorite(ref);
      renderFavorites();
    });
  });
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    histListDiv.innerHTML = '<p style="text-align:center">Nenhum versículo visto ainda. 📜</p>';
    return;
  }
  histListDiv.innerHTML = history.map(hist => `
    <div class="history-item">
      <div><strong>${getFullBookName(hist.book)} ${hist.chapter}:${hist.verse}</strong><br><small>${hist.text.substring(0, 80)}...</small></div>
      <div>
        <button class="load-hist" data-ref="${hist.reference}" data-book="${hist.book}" data-chapter="${hist.chapter}" data-verse="${hist.verse}" data-text="${escapeHtml(hist.text)}">📖 Ler</button>
        <button class="fav-hist" data-ref="${hist.reference}" data-book="${hist.book}" data-chapter="${hist.chapter}" data-verse="${hist.verse}" data-text="${escapeHtml(hist.text)}">❤️</button>
      </div>
    </div>
  `).join('');
  document.querySelectorAll('.load-hist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const ref = btn.dataset.ref;
      const found = getHistory().find(h => h.reference === ref);
      if (found) displayVerse(found);
      histModal.style.display = 'none';
    });
  });
  document.querySelectorAll('.fav-hist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const verse = {
        text: btn.dataset.text,
        reference: btn.dataset.ref,
        book: btn.dataset.book,
        chapter: parseInt(btn.dataset.chapter),
        verse: parseInt(btn.dataset.verse)
      };
      addFavorite(verse);
      alert('Adicionado aos favoritos! ❤️');
      renderHistory(); // atualiza lista
    });
  });
}

// Fechar modais ao clicar fora
window.onclick = (e) => {
  if (e.target === favModal) favModal.style.display = 'none';
  if (e.target === histModal) histModal.style.display = 'none';
};

// Eventos
refreshBtn.onclick = () => loadNewVerse();
shareWABtn.onclick = () => shareWhatsApp();
shareIGBtn.onclick = () => shareInstagram();
copyBtn.onclick = () => copyVerseText();
favoritesBtn.onclick = () => { renderFavorites(); favModal.style.display = 'flex'; };
historyBtn.onclick = () => { renderHistory(); histModal.style.display = 'flex'; };
document.querySelectorAll('.modal .close').forEach(btn => {
  btn.onclick = () => btn.closest('.modal').style.display = 'none';
});

// Inicialização
initTheme();
initBackgroundLayers();
loadNewVerse();
