import { fetchVerseFromAPI } from './api.js';
import { getCache, setCache, addToCache, isVerseInCache } from './cache.js';
import { getHistory, addToHistory } from './history.js';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from './favorites.js';
import { initTheme } from './theme.js';
import { initBackgroundLayers, setBackgroundImage } from './background.js';
import { generateShareImage, shareImageWithWebShare, copyVerseText, shareVerseText } from './share.js';
import { renderFavoritesModal, renderHistoryModal } from './ui.js';

// Variáveis globais
let currentVerse = null;
let verseCache = [];
let verseHistory = []; // em memória
let lastVerseRef = null;
let isLoading = false;
let timerInterval = null;

// DOM
const dynamicZone = document.getElementById('verseDynamicZone');
const refreshBtn = document.getElementById('refreshBtn');
const shareWABtn = document.getElementById('shareWABtn');
const shareIGFeedBtn = document.getElementById('shareIGFeedBtn');
const shareIGStoryBtn = document.getElementById('shareIGStoryBtn');
const copyTextBtn = document.getElementById('copyTextBtn');
const shareTextBtn = document.getElementById('shareTextBtn');
const favoritesBtn = document.getElementById('favoritesBtn');
const historyBtn = document.getElementById('historyBtn');

// Inicialização
initBackgroundLayers();
initTheme();
loadNewVerse();

// Eventos
refreshBtn.onclick = () => loadNewVerse();
shareWABtn.onclick = () => shareImageWithWebShare('whatsapp', 'versiculo_whatsapp', currentVerse, currentBackgroundImageUrl);
shareIGFeedBtn.onclick = () => shareImageWithWebShare('feed', 'versiculo_feed', currentVerse, currentBackgroundImageUrl);
shareIGStoryBtn.onclick = () => shareImageWithWebShare('story', 'versiculo_story', currentVerse, currentBackgroundImageUrl);
copyTextBtn.onclick = () => copyVerseText(currentVerse?.text, currentVerse?.reference);
shareTextBtn.onclick = () => shareVerseText(currentVerse?.text, currentVerse?.reference);
favoritesBtn.onclick = () => renderFavoritesModal();
historyBtn.onclick = () => renderHistoryModal();

async function loadNewVerse() { /* lógica original preservada */ }
function displayVerse(verse) { /* atualiza UI, adiciona ao histórico, favoritos, background crossfade */ }
function showLoadingWithTimer() { /* existente */ }
function getNextVerse() { /* usa cache e evita repetição */ }
