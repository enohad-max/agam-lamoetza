import { getState, update } from './state.js';

export const ACHIEVEMENTS = [
  { id: 'first', emoji: '🎒', name: 'אוסף ראשון', desc: 'אספת 5 פריטים', test: (s) => s.owned.length >= 5 },
  { id: 'ideas', emoji: '🧺', name: 'אספן רעיונות', desc: 'אספת 100 רעיונות', test: (s) => s.ideas >= 100 },
  { id: 'bulbs', emoji: '💡', name: 'מוח יצירתי', desc: 'תפסת 20 נורות', test: (s) => s.bulbs >= 20 },
  { id: 'gold', emoji: '🌟', name: 'כוכב הכיתה', desc: 'תפסת 10 כוכבי זהב', test: (s) => s.goldStars >= 10 },
  { id: 'designer', emoji: '🎨', name: 'מעצב מתחיל', desc: 'הצבת 5 פריטים בכיתה', test: (s) => s.placedEver >= 5 },
  { id: 'perfect', emoji: '🏫', name: 'הכיתה המושלמת', desc: 'פתחת 20 פריטים', test: (s) => s.owned.length >= 20 },
];

// בודק הישגים חדשים, שומר אותם ומחזיר את הרשימה
export function checkAchievements() {
  const fresh = ACHIEVEMENTS.filter((a) => !getState().achievements.includes(a.id) && a.test(getState()));
  if (fresh.length) update((s) => s.achievements.push(...fresh.map((a) => a.id)));
  return fresh;
}
