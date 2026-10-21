import { renderCountdown } from './countdown.js';
import { initQuiz } from './quiz.js';
import { sendWhatsApp } from './whatsapp.js';
import { PLATFORM, PLATFORM_INTRO } from './data.js';
import { ICONS } from './icons.js';
import { confetti } from './confetti.js';
import { play, isMuted, setMuted } from './sound.js';
import { load, store } from './storage.js';

const $ = (id) => document.getElementById(id);
const MAX_ITEMS = 30;
let items = load('suggestions', []).filter((i) => i && typeof i.text === 'string');

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

function messageOf(item) {
  const who = item.name ? item.name : 'חבר/ה מד3';
  return `📮 הצעה למועצה מ${who}:\n${item.text}`;
}

function openWhatsApp(item) {
  sendWhatsApp(messageOf(item));
  item.sent = true;
  store('suggestions', items);
  renderItems();
}

const CAT_COLORS = { 't-purple': '#8b5cf6', 't-pink': '#ec4899', 't-green': '#16a34a', 't-yellow': '#f59e0b' };

function renderPlatform() {
  const root = $('promises');
  PLATFORM.forEach((cat, i) => {
    const box = document.createElement('details');
    box.className = 'cat';
    box.style.setProperty('--i', i);
    box.style.setProperty('--c', CAT_COLORS[cat.tone] || '#8b5cf6');

    const sum = document.createElement('summary');
    const tile = document.createElement('span');
    tile.className = `tile ${cat.tone}`;
    tile.textContent = cat.emoji;
    const name = document.createElement('span');
    name.className = 'cat-name';
    name.textContent = cat.title;
    sum.append(tile, name);
    sum.addEventListener('click', () => play('tap'));

    const body = document.createElement('div');
    body.className = 'cat-body';
    for (const it of cat.items) {
      const h = document.createElement('h3');
      h.textContent = it.title;
      const t = document.createElement('p');
      t.textContent = it.text;
      body.append(h, t);
      if (it.cta) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'promise-cta';
        b.textContent = it.cta.label;
        b.addEventListener('click', () => { play('tap'); location.hash = it.cta.hash; });
        body.append(b);
      }
    }
    for (const n of cat.notes || []) {
      const p = document.createElement('p');
      p.className = 'cat-note';
      p.textContent = n;
      body.append(p);
    }
    box.append(sum, body);
    box.addEventListener('toggle', syncPlatformHint);
    root.append(box);
  });
}

// השלט "לחצו לפתיחה" והרעידה העדינה של הכרטיסים מופיעים רק כשהכול סגור
function syncPlatformHint() {
  const any = [...$('promises').querySelectorAll('details')].some((d) => d.open);
  $('promises').classList.toggle('all-closed', !any);
  $('platform-hint').classList.toggle('gone', any);
}

function closePlatform() {
  $('promises').querySelectorAll('details').forEach((d) => { d.open = false; });
  syncPlatformHint();
}

function renderItems() {
  $('saved-card').hidden = items.length === 0;
  const ul = $('saved');
  ul.replaceChildren();
  items.forEach((item, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = item.sent ? 'txt sent' : 'txt';
    span.textContent = item.text;
    if (item.sent) {
      const done = document.createElement('span');
      done.className = 'sent-tag';
      done.textContent = 'נשלח';
      span.append(done);
    }
    const send = document.createElement('button');
    send.type = 'button';
    send.className = 'row-btn send';
    send.innerHTML = ICONS.send;
    send.setAttribute('aria-label', 'שלחו לאגם');
    send.addEventListener('click', () => openWhatsApp(item));
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'row-btn';
    del.innerHTML = ICONS.trash;
    del.setAttribute('aria-label', 'מחקו');
    del.addEventListener('click', () => {
      items.splice(i, 1);
      store('suggestions', items);
      renderItems();
    });
    li.append(span, send, del);
    ul.append(li);
  });
}

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// נקודת הפתח של הקופסה בתוך התמונה (באחוזים מהתמונה)
const BOX_MOUTH = { x: 0.70, y: 0.55 };

// פתק קטן עף מהשדה אל הקופסה שאגם מחזיקה, ואז התפרצות של כוכבים ורעיונות
function flyNote(text, done) {
  const pic = $('idea-pic');
  if (reduceMotion() || !pic.clientWidth) return done();
  const from = $('idea-text').getBoundingClientRect();
  const to = pic.getBoundingClientRect();
  const tx = to.left + to.width * BOX_MOUTH.x;
  const ty = to.top + to.height * BOX_MOUTH.y;
  const note = document.createElement('div');
  note.className = 'fly-note';
  note.textContent = text.length > 22 ? `${text.slice(0, 22)}…` : text;
  document.body.append(note);
  const sx = from.left + from.width / 2;
  const sy = from.top + from.height / 2;
  const w = note.offsetWidth;
  const h = note.offsetHeight;
  const place = (x, y, rot, scale, op) =>
    ({ transform: `translate(${x - w / 2}px, ${y - h / 2}px) rotate(${rot}deg) scale(${scale})`, opacity: op });
  const anim = note.animate([
    place(sx, sy, -4, 1, 1),
    place((sx + tx) / 2 + 30, Math.min(sy, ty) - 70, 14, 0.85, 1),
    place(tx, ty, 38, 0.25, 0.9),
  ], { duration: 820, easing: 'cubic-bezier(.4, 0, .6, 1)', fill: 'forwards' });
  anim.onfinish = () => {
    note.remove();
    burst(pic, BOX_MOUTH);
    done();
  };
}

function burst(pic, at) {
  const pieces = ['⭐', '💡', '✨', '💜', '🌟', '✏️', '✨', '⭐'];
  pic.classList.remove('bump');
  void pic.offsetWidth;
  pic.classList.add('bump');
  const size = pic.clientWidth;
  pieces.forEach((emoji, i) => {
    const el = document.createElement('span');
    el.className = 'burst';
    el.textContent = emoji;
    el.style.left = `${at.x * 100}%`;
    el.style.top = `${at.y * 100}%`;
    pic.append(el);
    const ang = (-Math.PI * (0.15 + 0.7 * (i / (pieces.length - 1)))) + (Math.random() - 0.5) * 0.3;
    const dist = size * (0.22 + Math.random() * 0.2);
    el.animate([
      { transform: 'translate(-50%, -50%) scale(.3)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1.1) rotate(${(Math.random() - 0.5) * 120}deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(calc(-50% + ${Math.cos(ang) * dist * 1.2}px), calc(-50% + ${Math.sin(ang) * dist * 1.2 + 30}px)) scale(.6)`, opacity: 0 },
    ], { duration: 1100, easing: 'ease-out', fill: 'forwards' }).onfinish = () => el.remove();
  });
}

function dropInBox() {
  const text = $('idea-text').value.trim();
  if (text.length < 3) {
    toast('כתבו הצעה קצרה קודם ✏️');
    $('idea-text').focus();
    return;
  }
  const name = $('idea-name').value.trim();
  store('my-name', name);
  items.unshift({ text, name, sent: false });
  items = items.slice(0, MAX_ITEMS);
  store('suggestions', items);

  const btn = $('drop');
  btn.classList.remove('pop');
  void btn.offsetWidth;
  btn.classList.add('pop');

  play('tap');
  // הרשימה מתעדכנת רק אחרי הנחיתה, כדי שהתמונה לא תשנה גודל באמצע הטיסה
  flyNote(text, () => {
    renderItems();
    confetti();
    play('win');
    toast('ההצעה בקופסה! עכשיו שלחו אותה לאגם');
  });
  $('idea-text').value = '';
}

function setupInstallHint() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) {
    $('install-text').hidden = true;
    return;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  $('install-text').textContent = ios
    ? 'באייפון: לחצו על כפתור השיתוף ⬆️ בסאפרי ואז "הוסף למסך הבית".'
    : 'באנדרואיד: לחצו על ⋮ בכרום ואז "הוספה למסך הבית".';
}

const SAYINGS = {
  start: ['בהצלחה! 💜'],
  right: ['כל הכבוד! 🎉', 'בול! ⭐', 'יפה מאוד! 😄'],
  wrong: ['כמעט! 😉', 'לא נורא, ממשיכים! 💪'],
  pick: ['תודה ששיתפתם! 💜'],
  done: ['תודה שבאתם! 💜'],
  perfect: ['וואו, אתם מכירים אותי! 🏆'],
};

function setupQuizBubble() {
  const bubble = $('quiz-bubble');
  document.addEventListener('quiz-react', (e) => {
    const list = SAYINGS[e.detail] || SAYINGS.start;
    bubble.textContent = list[Math.floor(Math.random() * list.length)];
    bubble.classList.remove('say');
    void bubble.offsetWidth;
    bubble.classList.add('say');
  });
}

// עמוד הפתיחה מוצג בכל פתיחה חדשה (לשונית/הפעלת האפליקציה), גם אם הכתובת שנשמרה בדפדפן כוללת #platform וכד'
const INTRO_KEY = 'agam-intro-seen';
const introSeen = () => { try { return sessionStorage.getItem(INTRO_KEY) === '1'; } catch { return false; } };
const markIntroSeen = () => { try { sessionStorage.setItem(INTRO_KEY, '1'); } catch {} };

const SCREENS = ['intro', 'home', 'platform', 'quiz', 'ideas'];

// ניווט לפי hash: כפתור "אחורה" של הטלפון חוזר לתפריט
function route() {
  const name = location.hash.slice(1);
  const current = SCREENS.includes(name) ? name : 'intro';
  for (const s of SCREENS) $(`screen-${s}`).hidden = s !== current;
  if (current === 'platform') closePlatform(); // בכל כניסה למסך הכול סגור
  window.scrollTo(0, 0);
}

function init() {
  if (!introSeen() && location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.addEventListener('hashchange', () => { route(); play('tap'); });
  $('intro-go').addEventListener('click', (e) => {
    e.preventDefault();
    play('win');
    confetti();
    markIntroSeen();
    location.replace('#home'); // בלי להשאיר את הפתיחה בהיסטוריה
    route();
  });
  route();
  document.querySelectorAll('[data-icon]').forEach((n) => { n.innerHTML = ICONS[n.dataset.icon]; });
  const countdown = () => renderCountdown($('count-num'), $('count-big'), $('count-small'));
  countdown();
  $('platform-intro').textContent = PLATFORM_INTRO;
  renderPlatform();
  setupQuizBubble();
  initQuiz($('quiz'));
  renderItems();
  setupInstallHint();
  $('idea-name').value = load('my-name', '');

  const mute = $('mute');
  const syncMute = () => {
    mute.innerHTML = isMuted() ? ICONS.muted : ICONS.speaker;
    mute.setAttribute('aria-pressed', String(isMuted()));
  };
  syncMute();
  mute.addEventListener('click', () => {
    setMuted(!isMuted());
    syncMute();
    play('tap');
  });

  $('drop').addEventListener('click', dropInBox);

  // רענון הספירה לאחור כשחוזרים לאפליקציה ביום אחר
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) countdown();
  });

  // בלי רענון אוטומטי באמצע שימוש: ה-Service Worker מביא קבצים מהרשת קודם, אז גרסה חדשה נטענת בפתיחה הבאה
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

init();
