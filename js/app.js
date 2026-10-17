import { IDEAS, WHATSAPP_NUMBER } from './data.js';
import { renderCountdown } from './countdown.js';
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
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : 'https://wa.me/';
  window.open(`${base}?text=${encodeURIComponent(messageOf(item))}`, '_blank', 'noopener');
  item.sent = true;
  store('suggestions', items);
  renderItems();
}

function renderIdeas() {
  const box = $('ideas');
  for (const idea of IDEAS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = idea;
    b.addEventListener('click', () => {
      // מורידים את האימוג'י מההתחלה כדי שההצעה תהיה טקסט נקי
      $('idea-text').value = idea.replace(/^\S+\s/, '');
      play('tap');
      $('idea-text').focus();
    });
    box.append(b);
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
    span.textContent = `${item.sent ? '✅ ' : ''}${item.text}`;
    const send = document.createElement('button');
    send.type = 'button';
    send.textContent = '📤';
    send.setAttribute('aria-label', 'שלחו לאגם');
    send.addEventListener('click', () => openWhatsApp(item));
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '🗑️';
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

  const mailbox = $('mailbox');
  const note = document.createElement('span');
  note.className = 'note';
  note.textContent = '📝';
  mailbox.append(note);
  mailbox.classList.remove('drop');
  void mailbox.offsetWidth;
  mailbox.classList.add('drop');
  setTimeout(() => note.remove(), 800);

  confetti();
  play('win');
  $('idea-text').value = '';
  renderItems();
  toast('ההצעה בקופסה! עכשיו לחצו 📤 לשליחה לאגם');
}

function setupInstallHint() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) {
    $('install-card').hidden = true;
    return;
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  $('install-text').textContent = ios
    ? 'באייפון: לחצו על כפתור השיתוף ⬆️ בסאפרי ואז "הוסף למסך הבית".'
    : 'באנדרואיד: לחצו על ⋮ בכרום ואז "הוספה למסך הבית".';
}

function init() {
  renderCountdown($('count-big'), $('count-small'));
  renderIdeas();
  renderItems();
  setupInstallHint();
  $('idea-name').value = load('my-name', '');

  const mute = $('mute');
  const syncMute = () => {
    mute.textContent = isMuted() ? '🔇' : '🔊';
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
    if (!document.hidden) renderCountdown($('count-big'), $('count-small'));
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
