// האוסף: 30 פריטים לכיתה. להוסיף פריט = להוסיף שורה (id ייחודי, zone מתוך ZONES).
export const RARITIES = {
  common: { label: 'רגיל', color: '#0ea5e9' },
  special: { label: 'מיוחד', color: '#8b5cf6' },
  rare: { label: 'נדיר', color: '#f59e0b' },
  super: { label: 'סופר נדיר', color: '#ec4899' },
};

// slots = כמה פריטים אפשר להציב באזור
export const ZONES = [
  { id: 'window', name: 'חלון', slots: 3 },
  { id: 'wall', name: 'קיר', slots: 4 },
  { id: 'shelf', name: 'מדף', slots: 4 },
  { id: 'corner', name: 'פינת הכיתה', slots: 4 },
  { id: 'table', name: 'שולחן', slots: 4 },
  { id: 'floor', name: 'רצפה', slots: 4 },
];

export const ITEMS = [
  // רגיל
  { id: 'clock', emoji: '🕐', name: 'שעון', rarity: 'common', zone: 'wall' },
  { id: 'flags', emoji: '🎏', name: 'דגלונים', rarity: 'common', zone: 'wall' },
  { id: 'rug', emoji: '🧶', name: 'שטיח צבעוני', rarity: 'common', zone: 'floor' },
  { id: 'pot', emoji: '🌵', name: 'עציץ', rarity: 'common', zone: 'floor' },
  { id: 'ball', emoji: '⚽', name: 'כדור', rarity: 'common', zone: 'floor' },
  { id: 'boxgames', emoji: '🎲', name: 'משחקי קופסה', rarity: 'common', zone: 'table' },
  { id: 'flower', emoji: '🌸', name: 'פרח בכד', rarity: 'common', zone: 'table' },
  { id: 'craft', emoji: '🎨', name: 'פינת יצירה', rarity: 'common', zone: 'corner' },
  { id: 'library', emoji: '📖', name: 'ספרייה', rarity: 'common', zone: 'shelf' },
  { id: 'moon', emoji: '🌙', name: 'קישוט ירח', rarity: 'common', zone: 'window' },
  // מיוחד
  { id: 'poster', emoji: '🖼️', name: 'פוסטר', rarity: 'special', zone: 'wall' },
  { id: 'board', emoji: '📋', name: 'לוח מקושט', rarity: 'special', zone: 'wall' },
  { id: 'pillows', emoji: '🛋️', name: 'כריות', rarity: 'special', zone: 'floor' },
  { id: 'reading', emoji: '📚', name: 'פינת קריאה', rarity: 'special', zone: 'corner' },
  { id: 'globe', emoji: '🌐', name: 'גלובוס', rarity: 'special', zone: 'table' },
  { id: 'gamecorner', emoji: '🎮', name: 'פינת משחקים', rarity: 'special', zone: 'corner' },
  { id: 'dog', emoji: '🐶', name: 'כלבלב קטיפה', rarity: 'special', zone: 'shelf' },
  { id: 'sun', emoji: '🌞', name: 'שמש לחלון', rarity: 'special', zone: 'window' },
  { id: 'butterflies', emoji: '🦋', name: 'פרפרים לחלון', rarity: 'special', zone: 'window' },
  { id: 'music', emoji: '🎵', name: 'פינת מוזיקה', rarity: 'special', zone: 'corner' },
  // נדיר
  { id: 'kindboard', emoji: '💬', name: 'לוח "מילה טובה"', rarity: 'rare', zone: 'wall' },
  { id: 'lamp', emoji: '💡', name: 'מנורה מיוחדת', rarity: 'rare', zone: 'table' },
  { id: 'ideabox', emoji: '📮', name: 'קופסת רעיונות', rarity: 'rare', zone: 'table' },
  { id: 'science', emoji: '🔬', name: 'פינת מדע', rarity: 'rare', zone: 'corner' },
  { id: 'sushi', emoji: '🍣', name: 'פינת סושי', rarity: 'rare', zone: 'shelf' },
  { id: 'rainbow', emoji: '🌈', name: 'קשת לחלון', rarity: 'rare', zone: 'window' },
  { id: 'guitar', emoji: '🎸', name: 'גיטרה', rarity: 'rare', zone: 'corner' },
  // סופר נדיר
  { id: 'trophy', emoji: '🏆', name: 'גביע הכיתה', rarity: 'super', zone: 'shelf' },
  { id: 'rocket', emoji: '🚀', name: 'מודל חללית', rarity: 'super', zone: 'shelf' },
  { id: 'robot', emoji: '🤖', name: 'רובוט חבר', rarity: 'super', zone: 'floor' },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));
