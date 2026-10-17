import { CONFIG } from './config.js';
import { ITEMS } from './items.js';
import { getState, update } from './state.js';

function weightedPick(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  let r = Math.random() * entries.reduce((n, [, w]) => n + w, 0);
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

// פרס בסוף משחק. מעדיפים פריט חדש מהדרגה שהוטלה; אם הדרגה נאספה במלואה – כוכבי יצירה.
export function rollReward(score) {
  const weights = { ...CONFIG.rarityWeights };
  if (score >= CONFIG.boost.score) {
    weights.rare *= CONFIG.boost.rare;
    weights.super *= CONFIG.boost.super;
  }
  const rarity = weightedPick(weights);
  const owned = getState().owned;
  const pool = ITEMS.filter((i) => i.rarity === rarity && !owned.includes(i.id));

  if (pool.length) {
    const item = pickOne(pool);
    update((s) => s.owned.push(item.id));
    return { type: 'item', item, rarity };
  }
  const stars = CONFIG.starsForRarity[rarity];
  update((s) => { s.stars += stars; });
  return { type: 'stars', stars, rarity };
}

// פתיחת פריט חדש בעזרת כוכבי יצירה (לא כולל הגרלה על כסף – רק פריט שעוד חסר באוסף)
export function unlockWithStars() {
  const s = getState();
  const pool = ITEMS.filter((i) => !s.owned.includes(i.id));
  if (s.stars < CONFIG.starsPerUnlock || !pool.length) return null;
  const item = pickOne(pool);
  update((st) => {
    st.stars -= CONFIG.starsPerUnlock;
    st.owned.push(item.id);
  });
  return item;
}
