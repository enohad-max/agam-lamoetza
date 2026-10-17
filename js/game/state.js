import { load, store } from '../storage.js';
import { ITEM_BY_ID, ZONE_BY_ID } from './items.js';

// ההתקדמות נשמרת במכשיר בלבד (localStorage). בלי שם ובלי מידע אישי.
const KEY = 'agam-game';

const defaults = () => ({
  v: 1,
  best: 0,
  games: 0,
  ideas: 0,
  bulbs: 0,
  goldStars: 0,
  stars: 0,
  placedEver: 0,
  owned: [],
  placed: {},
  achievements: [],
});

const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

function sanitize(raw) {
  const s = defaults();
  if (!raw || typeof raw !== 'object') return s;
  for (const k of ['best', 'games', 'ideas', 'bulbs', 'goldStars', 'stars', 'placedEver']) s[k] = num(raw[k]);
  s.owned = Array.isArray(raw.owned) ? [...new Set(raw.owned.filter((id) => ITEM_BY_ID[id]))] : [];
  s.achievements = Array.isArray(raw.achievements) ? raw.achievements.filter((a) => typeof a === 'string') : [];
  if (raw.placed && typeof raw.placed === 'object') {
    for (const [zone, ids] of Object.entries(raw.placed)) {
      if (!ZONE_BY_ID[zone] || !Array.isArray(ids)) continue;
      s.placed[zone] = ids.filter((id) => s.owned.includes(id) && ITEM_BY_ID[id].zone === zone);
    }
  }
  return s;
}

let state = sanitize(load(KEY, null));

export const getState = () => state;

export function update(fn) {
  fn(state);
  store(KEY, state);
}

export function resetState() {
  state = defaults();
  store(KEY, state);
}

export const placedCount = () => Object.values(state.placed).reduce((n, ids) => n + ids.length, 0);
export const isPlaced = (id) => (state.placed[ITEM_BY_ID[id]?.zone] || []).includes(id);
