const STORAGE_KEY = 'versday_favorites';

export function getFavorites() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function saveFavorites(favorites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function addFavorite(verse) {
  const favs = getFavorites();
  if (!favs.some(f => f.reference === verse.reference)) {
    favs.unshift({ ...verse, createdAt: new Date().toISOString() });
    saveFavorites(favs);
  }
}

export function removeFavorite(reference) {
  const favs = getFavorites().filter(f => f.reference !== reference);
  saveFavorites(favs);
}

export function isFavorite(reference) {
  return getFavorites().some(f => f.reference === reference);
}
