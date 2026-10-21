import { renderCountdown } from './countdown.js';
import { initQuiz } from './quiz.js';
import { sendWhatsApp } from './whatsapp.js';
import { PLATFORM } from './data.js';
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

function renderPlatform() {
  const ul = $('promises');
  for (const p of PLATFORM) {
    const li = document.createElement('li');
    const tile = document.createElement('span');
    tile.className = `tile ${p.tone}`;
    tile.innerHTML = ICONS[p.icon];
    const body = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = p.title;
    const t = document.createElement('p');
    t.textContent = p.text;
    body.append(h, t);
    if (p.cta) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'promise-cta';
      b.textContent = p.cta.label;
      b.addEventListener('click', () => {
        play('tap');
        location.hash = '#ideas';
      });
      body.append(b);
    }
    li.append(tile, body);
    ul.append(li);
  }
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

  confetti();
  play('win');
  $('idea-text').value = '';
  renderItems();
  toast('ההצעה בקופסה! עכשיו שלחו אותה לאגם');
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

const SCREENS = ['home', 'platform', 'quiz', 'ideas'];

// ניווט לפי hash: כפתור "אחורה" של הטלפון חוזר לתפריט
function route() {
  const name = location.hash.slice(1);
  const current = SCREENS.includes(name) ? name : 'home';
  for (const s of SCREENS) $(`screen-${s}`).hidden = s !== current;
  window.scrollTo(0, 0);
}

function init() {
  window.addEventListener('hashchange', () => { route(); play('tap'); });
  route();
  document.querySelectorAll('[data-icon]').forEach((n) => { n.innerHTML = ICONS[n.dataset.icon]; });
  const countdown = () => renderCountdown($('count-num'), $('count-big'), $('count-small'));
  countdown();
  renderPlatform();
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

  if ('serviceWorker' in navigator) {
    // כשגרסה חדשה משתלטת – טוענים מחדש פעם אחת כדי להציג אותה מיד
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return;
      reloaded = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
