const HISTORY_KEY = 'versday_history';
const MAX_HISTORY = 50;

export function getHistory() {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addToHistory(verse) {
  let history = getHistory();
  history = history.filter(h => h.reference !== verse.reference);
  history.unshift({ ...verse, viewedAt: new Date().toISOString() });
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
