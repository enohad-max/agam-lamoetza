// אייקוני SVG מקומיים (24x24) – נראים זהה בכל מכשיר, בניגוד לאימוג'י
const svg = (body) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  speaker: svg('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>'),
  muted: svg('<path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6"/><path d="m21 9-5 6"/>'),
  send: svg('<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>'),
  trash: svg('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m6 6 1 14h10l1-14"/><path d="M10 11v5"/><path d="M14 11v5"/>'),
  target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
  mail: svg('<path d="M4 4h16v13H4z"/><path d="m4 7 8 6 8-6"/><path d="M12 17v4"/>'),
  phone: svg('<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18.5h2"/>'),
  check: svg('<path d="m5 12 5 5 9-10"/>'),
  award: svg('<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>'),
  refresh: svg('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'),
};
