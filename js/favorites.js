const STORAGE_KEY = 'versday_favorites';

export function getFavorites() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addFavorite(verse) {
  const favs = getFavorites();
  if (!favs.some(f => f.reference === verse.reference)) {
    favs.unshift({ ...verse, createdAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
  }
}

export function removeFavorite(reference) {
  const favs = getFavorites().filter(f => f.reference !== reference);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

export function isFavorite(reference) {
  return getFavorites().some(f => f.reference === reference);
}
