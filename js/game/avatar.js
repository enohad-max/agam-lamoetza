import { CONFIG } from './config.js';

// דמות ברירת מחדל מאוירת. כדי להחליף: CONFIG.avatarSrc = 'img/agam.png'
const PLACEHOLDER = `
<svg viewBox="0 0 100 100" role="img" aria-label="אגם">
  <path d="M18 56c0-24 14-38 32-38s32 14 32 38c0 6-3 12-5 16H23c-2-4-5-10-5-16z" fill="#5b3a29"/>
  <circle cx="50" cy="52" r="28" fill="#fcd5b0"/>
  <path d="M22 50c4-20 18-28 28-28s24 8 28 28c-8-10-18-14-28-14s-20 4-28 14z" fill="#5b3a29"/>
  <circle cx="40" cy="54" r="3.2" fill="#2e1065"/>
  <circle cx="60" cy="54" r="3.2" fill="#2e1065"/>
  <circle cx="34" cy="62" r="4" fill="#f9a8d4" opacity=".7"/>
  <circle cx="66" cy="62" r="4" fill="#f9a8d4" opacity=".7"/>
  <path d="M42 64q8 8 16 0" stroke="#2e1065" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="72" cy="30" r="7" fill="#facc15"/>
  <circle cx="82" cy="34" r="5" fill="#14b8a6"/>
</svg>`;

export function avatarHTML() {
  if (CONFIG.avatarSrc) {
    return `<img src="${CONFIG.avatarSrc}" alt="${CONFIG.candidate}" draggable="false">`;
  }
  return PLACEHOLDER;
}

// תמונה לשימוש ב-canvas (אם הוגדרה); אחרת null וציור ברירת המחדל נעשה בקוד המשחק
export function loadAvatarImage() {
  if (!CONFIG.avatarSrc) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = CONFIG.avatarSrc;
  });
}
