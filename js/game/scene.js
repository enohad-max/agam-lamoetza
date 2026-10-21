// איור הכיתה (רקע בלבד). הפריטים עצמם מונחים מעליו לפי pos ב-items.js.
// מערכת קואורדינטות: 100 רוחב × 112 גובה. הרצפה (מתחת ל-FLOOR_TOP) דחוסה לגובה FLOOR_K מהמקור.
export const SCENE_HEIGHT = 112;
const FLOOR_TOP = 78;
const FLOOR_K = 34 / 52;

// ממיר גובה של פריט במערכת המקורית (130) לגובה בסצנה עם הרצפה המקוצרת
export const sceneY = (y) => (y > FLOOR_TOP ? FLOOR_TOP + (y - FLOOR_TOP) * FLOOR_K : y);

const planks = [86, 95, 105, 116, 126]
  .map((y) => `<path d="M0 ${y}H100" stroke="#c9965a" stroke-width=".35" opacity=".55"/>`)
  .join('');
const seams = [[22, 78, 86], [58, 78, 86], [84, 86, 95], [38, 86, 95], [12, 95, 105], [70, 95, 105], [48, 105, 116], [90, 105, 116], [28, 116, 126], [64, 116, 126]]
  .map(([x, a, b]) => `<path d="M${x} ${a}V${b}" stroke="#c9965a" stroke-width=".3" opacity=".45"/>`)
  .join('');

export const SCENE_SVG = `
<svg viewBox="0 0 100 112" preserveAspectRatio="none" aria-hidden="true">
  <defs>
    <linearGradient id="g-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f8f5"/><stop offset="1" stop-color="#cdeee7"/></linearGradient>
    <linearGradient id="g-floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0d5ab"/><stop offset="1" stop-color="#dcb07a"/></linearGradient>
    <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#e0f2fe"/></linearGradient>
    <linearGradient id="g-board" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#23806b"/><stop offset="1" stop-color="#1a5f50"/></linearGradient>
    <pattern id="p-stripes" width="8" height="78" patternUnits="userSpaceOnUse"><rect width="4" height="78" fill="#fff" opacity=".28"/></pattern>
  </defs>

  <!-- קיר ורצפה -->
  <rect width="100" height="78" fill="url(#g-wall)"/>
  <rect width="100" height="78" fill="url(#p-stripes)"/>
  <g transform="translate(0 78) scale(1 ${FLOOR_K}) translate(0 -78)">
    <rect y="78" width="100" height="52" fill="url(#g-floor)"/>
    ${planks}${seams}
  </g>
  <rect y="76.5" width="100" height="2.2" fill="#b7864a"/>

  <!-- חלון -->
  <rect x="2.8" y="6.8" width="29.4" height="28.4" rx="2.2" fill="#fff"/>
  <rect x="4.2" y="8.2" width="26.6" height="25.6" rx="1.2" fill="url(#g-sky)"/>
  <ellipse cx="14" cy="13" rx="5" ry="2.1" fill="#fff" opacity=".9"/>
  <ellipse cx="18.5" cy="12.2" rx="3.6" ry="2.4" fill="#fff" opacity=".9"/>
  <ellipse cx="24" cy="31" rx="9" ry="1.8" fill="#86efac" opacity=".7"/>
  <path d="M17.5 8.2V33.8M4.2 21H30.8" stroke="#fff" stroke-width=".9"/>
  <rect x="1.8" y="35" width="31.4" height="2.4" rx="1.1" fill="#d6b88a"/>

  <!-- לוח -->
  <rect x="37" y="10.5" width="60" height="27" rx="1.6" fill="#a16207"/>
  <rect x="38.5" y="12" width="57" height="24" rx="1" fill="url(#g-board)"/>
  <text x="67" y="22.5" text-anchor="middle" fill="#fff" font-size="5.2" font-weight="800" opacity=".95">אגם למועצה</text>
  <text x="67" y="29.5" text-anchor="middle" fill="#fde047" font-size="3.2" font-weight="700" opacity=".95">כל הכיתה מרוצה!</text>
  <path d="M52 32.4Q67 34 82 32.4" stroke="#fff" stroke-width=".5" fill="none" opacity=".7" stroke-linecap="round"/>
  <rect x="39" y="37.5" width="55" height="1.8" rx=".7" fill="#8a5a14"/>
  <rect x="44" y="36.9" width="4" height="1" rx=".4" fill="#fff"/>
  <rect x="50" y="36.9" width="2.6" height="1" rx=".4" fill="#fde68a"/>

  <!-- לוח פרשים מתחת לחלון -->
  <rect x="3.5" y="39.5" width="32" height="13.5" rx="1.6" fill="#e7c9a0" stroke="#b9893e" stroke-width=".7"/>

  <!-- מדף -->
  <rect x="41.5" y="52.6" width="56" height="2" rx=".7" fill="#a16207"/>
  <path d="M46 54.6l-2.4 3.6h5zM93 54.6l-2.4 3.6h5z" fill="#8a5a14"/>

  <!-- פינת הכיתה -->
  <rect x="3.5" y="55.5" width="35" height="24" rx="3.5" fill="#ddd6fe" opacity=".85" stroke="#a78bfa" stroke-width=".7" stroke-dasharray="1.6 1.2"/>

  <!-- שולחן -->
  <ellipse cx="69" cy="89" rx="29" ry="2" fill="#000" opacity=".12"/>
  <rect x="42.5" y="73.6" width="52" height="2.2" fill="#92400e"/>
  <rect x="44" y="75.6" width="2.6" height="12.9" fill="#92400e"/>
  <rect x="90.4" y="75.6" width="2.6" height="12.9" fill="#92400e"/>
  <rect x="39.5" y="70.2" width="58" height="3.4" rx="1.1" fill="#b45309"/>
</svg>`;
