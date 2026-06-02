import { getHistory, addToHistory } from './history.js';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from './favorites.js';
import { currentVerse, setCurrentVerse } from './main.js'; // circular? Melhor exportar do main

export function updateFavoriteButton() { /* altera estilo do coração */ }
export function renderFavoritesModal() { /* preenche a lista */ }
export function renderHistoryModal() { /* preenche com últimos 50 */ }
