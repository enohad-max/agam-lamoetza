import { SLOTS } from './data.js';
import { renderCountdown } from './countdown.js';
import { confetti } from './confetti.js';
import { play, isMuted, setMuted } from './sound.js';
import { loadSaved, storeSaved } from './storage.js';

const $ = (id) => document.getElementById(id);
const choice = { a: null, b: null, c: null };
let saved = loadSaved();
let currentSlogan = '';

const sloganOf = ({ a, b, c }) => `${a} - ${b}! ${c}`;

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 1800);
}

function shareText(slogan) {
  return `${slogan}\n\n🗳️ בחירות ביום שישי 23.10 – מצביעים אגם!\n${location.href.split('#')[0]}`;
}

function renderChips() {
  for (const slot of Object.keys(SLOTS)) {
    const box = $(`chips-${slot}`);
    box.replaceChildren();
    for (const opt of SLOTS[slot]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = opt.label;
      b.setAttribute('aria-pressed', String(choice[slot] === opt.text));
      b.addEventListener('click', () => {
        choice[slot] = opt.text;
        play('tap');
        renderChips();
        update(false);
      });
      box.append(b);
    }
  }
}

function update(celebrate) {
  const ready = choice.a && choice.b && choice.c;
  $('result').hidden = !ready;
  if (!ready) return;
  currentSlogan = sloganOf(choice);
  $('slogan').textContent = currentSlogan;
  if (celebrate || !update.shown) {
    confetti();
    play('win');
  }
  update.shown = true;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)].text;
}

function renderSaved() {
  $('saved-card').hidden = saved.length === 0;
  const ul = $('saved');
  ul.replaceChildren();
  saved.forEach((text, i) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.className = 'txt';
    span.textContent = text;
    const send = document.createElement('button');
    send.type = 'button';
    send.textContent = '📤';
    send.setAttribute('aria-label', 'שלחו');
    send.addEventListener('click', () => openWhatsApp(text));
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '🗑️';
    del.setAttribute('aria-label', 'מחקו');
    del.addEventListener('click', () => {
      saved.splice(i, 1);
      storeSaved(saved);
      renderSaved();
    });
    li.append(span, send, del);
    ul.append(li);
  });
}

function openWhatsApp(slogan) {
  window.open(`https://wa.me/?text=${encodeURIComponent(shareText(slogan))}`, '_blank', 'noopener');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch {}
    ta.remove();
    return ok;
  }
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
  renderChips();
  renderSaved();
  setupInstallHint();

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

  $('surprise').addEventListener('click', () => {
    for (const slot of Object.keys(SLOTS)) choice[slot] = pick(SLOTS[slot]);
    renderChips();
    update(true);
  });

  $('share-wa').addEventListener('click', () => openWhatsApp(currentSlogan));

  if (navigator.share) {
    const btn = $('share-native');
    btn.hidden = false;
    btn.addEventListener('click', () => {
      navigator.share({ text: shareText(currentSlogan) }).catch(() => {});
    });
  }

  $('copy').addEventListener('click', async () => {
    toast((await copyText(shareText(currentSlogan))) ? 'הועתק! 📋' : 'לא הצלחנו להעתיק');
  });

  $('save').addEventListener('click', () => {
    if (!saved.includes(currentSlogan)) {
      saved.unshift(currentSlogan);
      saved = saved.slice(0, 20);
      storeSaved(saved);
      renderSaved();
    }
    play('tap');
    toast('נשמר! ⭐');
  });

  // רענון הספירה לאחור כשחוזרים לאפליקציה ביום אחר
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderCountdown($('count-big'), $('count-small'));
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
