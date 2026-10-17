// האוסף: 30 פריטים. לכל פריט מקום קבוע בכיתה: pos = [x, y, גודל] במערכת הקואורדינטות של הסצנה
// (רוחב 100 × גובה 130, ראו js/game/scene.js). x,y = מרכז הפריט; גודל = אחוז מרוחב הסצנה.
// להוסיף פריט = להוסיף שורה (id ייחודי ומקום פנוי בסצנה – ראו js/game/scene.js).
export const RARITIES = {
  common: { label: 'רגיל', color: '#0ea5e9' },
  special: { label: 'מיוחד', color: '#8b5cf6' },
  rare: { label: 'נדיר', color: '#f59e0b' },
  super: { label: 'סופר נדיר', color: '#ec4899' },
};

export const ITEMS = [
  // רגיל
  { id: 'clock', emoji: '🕐', name: 'שעון', rarity: 'common', pos: [67, 6, 9] },
  { id: 'flags', emoji: '🎏', name: 'דגלונים', rarity: 'common', pos: [47, 6, 9] },
  { id: 'rug', emoji: '🧶', name: 'שטיח צבעוני', rarity: 'common', pos: [24, 108, 11] },
  { id: 'pot', emoji: '🌵', name: 'עציץ', rarity: 'common', pos: [7, 94, 10] },
  { id: 'ball', emoji: '⚽', name: 'כדור', rarity: 'common', pos: [68, 120, 8.5] },
  { id: 'boxgames', emoji: '🎲', name: 'משחקי קופסה', rarity: 'common', pos: [46, 65, 9] },
  { id: 'flower', emoji: '🌸', name: 'פרח בכד', rarity: 'common', pos: [56, 65, 9] },
  { id: 'craft', emoji: '🎨', name: 'פינת יצירה', rarity: 'common', pos: [10, 62, 9] },
  { id: 'library', emoji: '📖', name: 'ספרייה', rarity: 'common', pos: [44, 47, 9.5] },
  { id: 'moon', emoji: '🌙', name: 'קישוט ירח', rarity: 'common', pos: [11, 16, 8.5] },
  // מיוחד
  { id: 'poster', emoji: '🖼️', name: 'פוסטר', rarity: 'special', pos: [9, 45, 9.5] },
  { id: 'board', emoji: '📋', name: 'לוח מקושט', rarity: 'special', pos: [20, 45, 9.5] },
  { id: 'pillows', emoji: '🛋️', name: 'כריות', rarity: 'special', pos: [50, 108, 10.5] },
  { id: 'reading', emoji: '📚', name: 'פינת קריאה', rarity: 'special', pos: [20, 62, 9] },
  { id: 'globe', emoji: '🌐', name: 'גלובוס', rarity: 'special', pos: [66, 65, 9] },
  { id: 'gamecorner', emoji: '🎮', name: 'פינת משחקים', rarity: 'special', pos: [30, 62, 9] },
  { id: 'dog', emoji: '🐶', name: 'כלבלב קטיפה', rarity: 'special', pos: [55, 47, 9.5] },
  { id: 'sun', emoji: '🌞', name: 'שמש לחלון', rarity: 'special', pos: [24, 16, 8.5] },
  { id: 'butterflies', emoji: '🦋', name: 'פרפרים לחלון', rarity: 'special', pos: [11, 28, 8.5] },
  { id: 'music', emoji: '🎵', name: 'פינת מוזיקה', rarity: 'special', pos: [10, 72, 9] },
  // נדיר
  { id: 'kindboard', emoji: '💬', name: 'לוח "מילה טובה"', rarity: 'rare', pos: [31, 45, 9.5] },
  { id: 'lamp', emoji: '💡', name: 'מנורה מיוחדת', rarity: 'rare', pos: [76, 65, 9] },
  { id: 'ideabox', emoji: '📮', name: 'קופסת רעיונות', rarity: 'rare', pos: [86, 65, 9] },
  { id: 'science', emoji: '🔬', name: 'פינת מדע', rarity: 'rare', pos: [20, 72, 9] },
  { id: 'sushi', emoji: '🍣', name: 'פינת סושי', rarity: 'rare', pos: [66, 47, 9.5] },
  { id: 'rainbow', emoji: '🌈', name: 'קשת לחלון', rarity: 'rare', pos: [24, 28, 8.5] },
  { id: 'guitar', emoji: '🎸', name: 'גיטרה', rarity: 'rare', pos: [30, 72, 9] },
  // סופר נדיר
  { id: 'trophy', emoji: '🏆', name: 'גביע הכיתה', rarity: 'super', pos: [77, 47, 9.5] },
  { id: 'rocket', emoji: '🚀', name: 'מודל חללית', rarity: 'super', pos: [88, 47, 9.5] },
  { id: 'robot', emoji: '🤖', name: 'רובוט חבר', rarity: 'super', pos: [86, 106, 11] },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
