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
import { saveVisualFeedback, getFeedback } from './visualMemory.js';
import {
  initVisualDebugPanel,
  renderVisualDebugPanel
} from './visualDebugPanel.js';

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
const visualFeedback   = document.getElementById('visualFeedback');

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

function normalizePositiveInteger(value, max = 200) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1 || number > max) {
    return null;
  }
  return number;
}

function normalizeBookCode(value) {
  const code = String(value || '').trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(BOOK_NAMES, code)
    ? code
    : '';
}

function buildChapterUrl(verse) {
  const book = normalizeBookCode(verse?.book);
  const chapter = normalizePositiveInteger(verse?.chapter, 200);
  if (!book || !chapter) return '';

  return `https://www.bibliaonline.com.br/ara/${encodeURIComponent(book)}/${chapter}`;
}

function createElement(tag, options = {}) {
  const element = document.createElement(tag);

  if (options.className) element.className = options.className;
  if (options.text !== undefined) {
    element.textContent = String(options.text);
  }
  if (options.title) element.title = options.title;

  return element;
}

function renderEmptyState(container, text) {
  const message = createElement('p', { text });
  message.style.textAlign = 'center';
  message.style.padding = '20px';
  message.style.opacity = '.7';
  container.replaceChildren(message);
}

// ========== Loading ==========
function smoothUpdate(render) {
  dynamicZone.style.transition = 'opacity 0.15s';
  dynamicZone.style.opacity = '0';

  setTimeout(() => {
    dynamicZone.replaceChildren();
    render(dynamicZone);
    dynamicZone.style.opacity = '1';
  }, 150);
}

let timerInterval = null;

function showLoading(show) {
  if (show) {
    const wrapper = createElement('div', {
      className: 'loading-timer'
    });
    const timer = createElement('div', {
      className: 'timer-circle',
      text: '0'
    });
    const message = createElement('div', {
      className: 'loading-message',
      text: 'Buscando versículo...'
    });
    const delay = createElement('div');
    delay.id = 'delayMessage';

    wrapper.append(timer, message, delay);
    dynamicZone.replaceChildren(wrapper);

    const start = Date.now();
    timerInterval = setInterval(() => {
      if (!appState.isLoading) {
        clearInterval(timerInterval);
        return;
      }

      const seconds = Math.floor((Date.now() - start) / 1000);
      const timerElement = document.querySelector('.timer-circle');
      if (timerElement) timerElement.textContent = String(seconds);

      if (seconds >= 8) {
        const delayElement = document.getElementById('delayMessage');
        if (delayElement && !delayElement.hasChildNodes()) {
          delayElement.appendChild(
            createElement('div', {
              className: 'delay-message',
              text: '🙏 Aguarde, buscando nos repositórios...'
            })
          );
        }
      }
    }, 1000);
  } else if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ========== Exibir versículo ==========
function displayVerse(verse) {
  appState.currentVerse = verse;
  lastVerseRef = verse.reference;
  addToHistoryRef(verse.reference);
  addToHistory(verse);

  const fullBook = getFullBookName(
    normalizeBookCode(verse.book) || String(verse.book || '')
  );
  const chapter = normalizePositiveInteger(verse.chapter, 200);
  const verseNumber = normalizePositiveInteger(verse.verse, 300);
  const displayRef = [
    fullBook,
    chapter && verseNumber
      ? `${chapter}:${verseNumber}`
      : String(verse.reference || '')
  ].filter(Boolean).join(' ');

  smoothUpdate(container => {
    const verseText = createElement('div', {
      className: 'verse-text',
      text: verse.text || ''
    });
    const referenceWrapper = createElement('div', {
      className: 'verse-reference-wrapper'
    });
    const reference = createElement('span', {
      className: 'verse-reference',
      text: displayRef
    });

    referenceWrapper.appendChild(reference);

    const chapterUrl = buildChapterUrl(verse);
    if (chapterUrl) {
      const chapterLink = createElement('a', {
        className: 'chapter-link',
        text: '📖',
        title: 'Ler capítulo completo'
      });
      chapterLink.href = chapterUrl;
      chapterLink.target = '_blank';
      chapterLink.rel = 'noopener noreferrer';
      referenceWrapper.appendChild(chapterLink);
    }

    container.append(verseText, referenceWrapper);
  });

  setBackgroundImage(verse)
    .then(selection => {
      renderVisualFeedback();
      renderVisualDebugPanel(selection);
    })
    .catch(error =>
      console.warn('[VersDay] Falha visual não bloqueante:', error)
    );
  updateFavoriteButton();
}

function renderVisualFeedback() {
  if (
    !visualFeedback ||
    !appState.currentVerse ||
    appState.currentVisual?.mode !== 'photo'
  ) {
    if (visualFeedback) visualFeedback.hidden = true;
    return;
  }

  visualFeedback.hidden = false;
  const current = getFeedback(
    appState.currentVerse.reference,
    appState.currentVisual.id
  );
  visualFeedback
    .querySelectorAll('[data-visual-feedback]')
    .forEach(button => {
      const active = button.dataset.visualFeedback === current;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
}

// ========== Carregar versículo — equilibrado entre API e fallback ==========
async function loadNewVerse() {
  if (appState.isLoading) return;
  appState.isLoading = true;
  showLoading(true);

  try {
    let verse = null;

    const cache = getCache();
    if (cache.length > 0) {
      const idx = cache.findIndex(v =>
        v.reference !== lastVerseRef &&
        !isRecentlyUsed(v.reference)
      );

      if (idx !== -1) {
        verse = cache[idx];
        cache.splice(idx, 1);
        setCache(cache);
        addToCache(lastVerseRef, isRecentlyUsed);
      }
    }

    if (!verse) {
      let fallback = getRandomFallbackVerse();
      let attempts = 0;

      while (
        isRecentlyUsed(fallback.reference) &&
        attempts < 20
      ) {
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

    if (getCache().length < 8) {
      addToCache(lastVerseRef, isRecentlyUsed);
    }
  }
}

// ========== Favoritar versículo atual ==========
function updateFavoriteButton() {
  if (!appState.currentVerse || !favoriteCurrentBtn) return;
  const fav = isFavorite(appState.currentVerse.reference);
  favoriteCurrentBtn.textContent = fav ? '⭐' : '☆';
  favoriteCurrentBtn.setAttribute(
    'aria-label',
    fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'
  );
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

if (favoriteCurrentBtn) {
  favoriteCurrentBtn.addEventListener(
    'click',
    toggleFavoriteCurrent
  );
}

// ========== Modais ==========
function createVerseListItem(item, kind) {
  const row = createElement('div', {
    className:
      kind === 'favorite'
        ? 'favorite-item'
        : 'history-item'
  });

  const content = createElement('div');
  content.style.flex = '1';
  content.style.minWidth = '0';

  const bookCode = normalizeBookCode(item.book);
  const bookName = getFullBookName(
    bookCode || String(item.book || '')
  );
  const chapter = normalizePositiveInteger(item.chapter, 200);
  const verseNumber = normalizePositiveInteger(item.verse, 300);
  const referenceText =
    chapter && verseNumber
      ? `${bookName} ${chapter}:${verseNumber}`
      : String(item.reference || '');

  const title = createElement('strong', {
    text: referenceText
  });
  const preview = createElement('small', {
    text: `${String(item.text || '').slice(0, 90)}…`
  });
  preview.style.opacity = '.75';

  content.append(
    title,
    document.createElement('br'),
    preview
  );

  const actions = createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '4px';
  actions.style.flexShrink = '0';

  const load = createElement('button', {
    className: kind === 'favorite' ? 'load-fav' : 'load-hist',
    text: '📖',
    title: 'Ler'
  });
  load.type = 'button';
  load.addEventListener('click', () => {
    const collection =
      kind === 'favorite'
        ? getFavorites()
        : getHistory();
    const found = collection.find(
      entry => entry.reference === item.reference
    );

    if (found) displayVerse(found);

    if (kind === 'favorite') {
      favModal.style.display = 'none';
    } else {
      histModal.style.display = 'none';
    }
  });

  actions.appendChild(load);

  if (kind === 'favorite') {
    const remove = createElement('button', {
      className: 'remove-fav',
      text: '🗑️',
      title: 'Remover'
    });
    remove.type = 'button';
    remove.addEventListener('click', () => {
      removeFavorite(item.reference);
      renderFavorites();
      updateFavoriteButton();
    });
    actions.appendChild(remove);
  } else {
    const favorite = createElement('button', {
      className: 'fav-hist',
      text: '⭐',
      title: 'Favoritar'
    });
    favorite.type = 'button';
    favorite.addEventListener('click', () => {
      addFavorite({
        text: String(item.text || ''),
        reference: String(item.reference || ''),
        book: bookCode,
        chapter,
        verse: verseNumber
      });
      favorite.textContent = '✅';
      favorite.disabled = true;
    });
    actions.appendChild(favorite);
  }

  row.append(content, actions);
  return row;
}

function renderFavorites() {
  const favs = getFavorites();

  if (!favs.length) {
    renderEmptyState(
      favListDiv,
      'Nenhum favorito ainda. ⭐'
    );
    return;
  }

  favListDiv.replaceChildren(
    ...favs.map(fav =>
      createVerseListItem(fav, 'favorite')
    )
  );
}

function renderHistory() {
  const history = getHistory();

  if (!history.length) {
    renderEmptyState(
      histListDiv,
      'Nenhum versículo visto ainda. 📜'
    );
    return;
  }

  histListDiv.replaceChildren(
    ...history.map(item =>
      createVerseListItem(item, 'history')
    )
  );
}

// ========== Eventos ==========
refreshBtn.addEventListener('click', loadNewVerse);
shareWABtn.addEventListener('click', shareWhatsApp);
shareIGBtn.addEventListener('click', shareInstagram);
copyBtn.addEventListener('click', copyVerseText);

if (visualFeedback) {
  visualFeedback.addEventListener('click', async event => {
    const button = event.target.closest('[data-visual-feedback]');
    if (!button || !appState.currentVerse || !appState.currentVisual?.id) return;

    const value = button.dataset.visualFeedback;
    saveVisualFeedback(
      appState.currentVerse.reference,
      appState.currentVisual.id,
      value,
      {
        primaryTheme:
          appState.currentVisualIntent?.semantic?.primaryTheme || null,
        sceneSignature:
          appState.currentVisual?.sceneSignature || null,
        provider:
          appState.currentVisual?.provider || null
      }
    );
    renderVisualFeedback();

    if (value === 'down') {
      visualFeedback.hidden = true;
      try {
        const selection = await setBackgroundImage(
          appState.currentVerse,
          { force: true }
        );
        renderVisualDebugPanel(selection);
      } finally {
        renderVisualFeedback();
      }
    }
  });
}

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

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(registration =>
        console.log(
          '[VersDay] SW registrado:',
          registration.scope
        )
      )
      .catch(error =>
        console.warn(
          '[VersDay] SW falhou:',
          error
        )
      );
  });
}

// ========== Boot ==========
initTheme();
initBackgroundLayers();
initVisualDebugPanel();
initServiceWorker();
loadNewVerse();
initChat();