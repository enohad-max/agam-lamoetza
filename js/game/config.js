// כל מה שאפשר לשנות במשחק במקום אחד: שם, סיסמה, זמנים, נדירות ופריטים נופלים.
export const CONFIG = {
  candidate: 'אגם',
  title: 'אגם במועצה',
  slogan: 'כל הכיתה מרוצה!',
  fullSlogan: 'אגם במועצה – כל הכיתה מרוצה!',
  gameName: 'גשם של רעיונות לאגם',
  tagline: 'עזרו לאגם לאסוף רעיונות ולבנות את הכיתה הכי כיפית שיש!',
  closing: 'כל רעיון יכול לעשות שינוי.',

  // להחלפת הדמות: שימו תמונה בתיקיית img ורשמו כאן את הנתיב, למשל 'img/agam.png'.
  // כשהשדה ריק מוצגת דמות מאוירת ברירת מחדל.
  avatarSrc: '',

  campaignUrl: 'index.html',

  // שליטה בהטיה (אופציונלית): maxDeg = כמה מעלות הטיה נותנות תנועה מלאה לצד
  tilt: { maxDeg: 22 },

  durationSec: 50,
  countdownSec: 3,

  // "גשם של רעיונות": חלונות זמן (בשניות מתחילת המשחק) שבהם מתחיל האירוע
  rain: { durationSec: 5, windows: [[10, 20], [30, 40]], pool: ['note', 'note', 'star', 'pencil', 'smile'] },

  spawn: { startEvery: 0.85, endEvery: 0.5, rainEvery: 0.11 },
  speed: { start: 150, end: 235 }, // פיקסלים בשנייה, עולה בהדרגה

  badChance: 0.14,
  badPenalty: 2,
  goldPoints: 8,

  // סיכוי לדרגת פריט בסוף משחק
  rarityWeights: { common: 62, special: 26, rare: 10, super: 2 },
  // משחק טוב מעלה מעט את הסיכוי לנדירים
  boost: { score: 45, rare: 2, super: 3 },

  // כוכבי יצירה כשדרגת הפריט כבר נאספה במלואה
  starsForRarity: { common: 1, special: 2, rare: 3, super: 5 },
  starsPerUnlock: 10,

  values: [
    'רעיון טוב מתחיל כשמקשיבים.',
    'כל אחד יכול להציע רעיון.',
    'ביחד אפשר לשפר את הכיתה.',
    'לכל ילד יש קול.',
    'רעיונות הופכים למעשים.',
  ],
};

// פריטים טובים שנופלים. tier קובע את הערך והסיכוי; points = ניקוד.
export const TIER_WEIGHTS = { regular: 60, special: 26, rare: 11, gold: 3 };

export const GOOD = [
  { id: 'note', emoji: '📝', tier: 'regular', points: 1 },
  { id: 'pencil', emoji: '✏️', tier: 'regular', points: 1 },
  { id: 'smile', emoji: '😊', tier: 'regular', points: 1 },
  { id: 'ball', emoji: '⚽', tier: 'regular', points: 1 },
  { id: 'book', emoji: '📖', tier: 'regular', points: 1 },
  { id: 'bulb', emoji: '💡', tier: 'special', points: 3 },
  { id: 'heart', emoji: '❤️', tier: 'special', points: 3 },
  { id: 'puzzle', emoji: '🧩', tier: 'special', points: 3 },
  { id: 'brush', emoji: '🖌️', tier: 'special', points: 3 },
  { id: 'flower', emoji: '🌸', tier: 'special', points: 3 },
  { id: 'star', emoji: '⭐', tier: 'rare', points: 5 },
  { id: 'friends', emoji: '🤝', tier: 'rare', points: 5 },
  { id: 'gold', emoji: '🌟', tier: 'gold', points: 0 },
];

// הפריט שאסור לתפוס: פצצה מצוירת (בלי פיצוץ ובלי אווירה מפחידה), מורידה נקודות בלבד.
// draw = ציור מותאם על ה-canvas.
export const BAD = [
  { id: 'bomb', draw: 'bomb' },
];
