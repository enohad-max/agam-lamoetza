export function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

export function store(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
