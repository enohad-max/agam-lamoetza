const KEY = 'saved-slogans';

export function loadSaved() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function storeSaved(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
}
