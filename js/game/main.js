import { CONFIG } from './config.js';
import { ITEMS, ZONES, RARITIES, ITEM_BY_ID, ZONE_BY_ID } from './items.js';
import { getState, update, resetState, placedCount } from './state.js';
import { CatchGame } from './catch.js';
import { rollReward, unlockWithStars } from './rewards.js';
import { ACHIEVEMENTS, checkAchievements } from './achievements.js';
import { avatarHTML, loadAvatarImage } from './avatar.js';
import { confetti } from '../confetti.js';
import { play, isMuted, setMuted } from '../sound.js';
import { ICONS } from '../icons.js';

const $ = (id) => document.getElementById(id);
const SCREENS = ['home', 'play', 'result', 'class', 'collection'];
const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

let selectedId = null;
let countdownTimer;
let bannerTimer;
let toastTimer;

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ---------- ניווט ---------- */
function show(name) {
  for (const s of SCREENS) $(`screen-${s}`).hidden = s !== name;
  document.body.classList.toggle('is-play', name === 'play');
  window.scrollTo(0, 0);
  if (name === 'home') renderHome();
  if (name === 'class') renderClass();
  if (name === 'collection') renderCollection();
}

/* ---------- מסך ראשי ---------- */
function renderHome() {
  $('home-avatar').innerHTML = avatarHTML();
  $('home-title').textContent = CONFIG.title;
  $('home-slogan').textContent = CONFIG.slogan;
  $('home-tagline').textContent = CONFIG.tagline;
  $('home-value').textContent = pickOne(CONFIG.values);
  $('home-progress').textContent = `${getState().owned.length} מתוך ${ITEMS.length}`;
}

/* ---------- משחק ---------- */
let game;

function setHud({ score, time, ideas }) {
  $('hud-score').textContent = score;
  $('hud-time').textContent = time;
  $('hud-ideas').textContent = ideas;
}

function banner(text) {
  const b = $('banner');
  b.textContent = text;
  b.classList.add('on');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => b.classList.remove('on'), 1800);
}

function startPlay() {
  show('play');
  setHud({ score: 0, time: CONFIG.durationSec, ideas: 0 });
  game.resize();
  const overlay = $('countdown');
  $('play-hint').classList.add('on');
  let n = CONFIG.countdownSec;
  const tick = () => {
    if (n > 0) {
      overlay.textContent = n--;
      overlay.classList.add('on');
      play('tap');
      countdownTimer = setTimeout(tick, 700);
    } else {
      overlay.textContent = 'יאללה!';
      countdownTimer = setTimeout(() => {
        overlay.classList.remove('on');
        $('play-hint').classList.remove('on');
        game.start();
      }, 500);
    }
  };
  tick();
}

function exitPlay() {
  clearTimeout(countdownTimer);
  game.stop();
  $('countdown').classList.remove('on');
  $('play-hint').classList.remove('on');
  show('home');
}

function onGameEnd(result) {
  const prevBest = getState().best;
  update((s) => {
    s.games += 1;
    s.ideas += result.ideas;
    s.bulbs += result.bulbs;
    s.goldStars += result.gold;
    if (result.score > s.best) s.best = result.score;
  });
  const reward = rollReward(result.score);
  const fresh = checkAchievements();
  renderResult(result, reward, fresh, result.score > prevBest && result.score > 0);
}

function itemCard(item, { tag, note }) {
  const r = RARITIES[item.rarity];
  const card = el('div', 'reward-card');
  card.style.setProperty('--c', r.color);
  const rarity = el('span', 'rarity', r.label);
  rarity.style.background = r.color;
  card.append(
    el('div', 'reward-tag', tag),
    el('div', 'reward-emoji', item.emoji),
    el('div', 'reward-name', item.name),
    rarity,
    el('p', 'reward-note', note),
  );
  return card;
}

function renderResult(result, reward, fresh, newBest) {
  const n = result.ideas;
  $('res-title').textContent = n === 0 ? 'כל הכבוד על המשחק!'
    : n === 1 ? 'כל הכבוד! אספת רעיון אחד!' : `כל הכבוד! אספת ${n} רעיונות!`;
  $('res-sub').textContent = `ניקוד: ${result.score}${newBest ? ' · שיא חדש! 🏅' : ''}`;

  const box = $('res-reward');
  box.replaceChildren();
  if (reward.type === 'item') {
    box.append(itemCard(reward.item, { tag: 'חדש באוסף!', note: 'קיבלת פריט חדש לכיתה שלך!' }));
  } else {
    const card = el('div', 'reward-card');
    card.style.setProperty('--c', '#f59e0b');
    card.append(
      el('div', 'reward-tag', 'כוכבי יצירה!'),
      el('div', 'reward-emoji', '⭐'),
      el('div', 'reward-name', `+${reward.stars}`),
      el('p', 'reward-note', `אוספים ${CONFIG.starsPerUnlock} כוכבים ופותחים פריט חדש באוסף.`),
    );
    box.append(card);
  }

  const badges = $('res-badges');
  badges.replaceChildren();
  for (const a of fresh) badges.append(el('div', 'badge-new', `${a.emoji} הישג חדש: ${a.name}`));

  $('res-value').textContent = pickOne(CONFIG.values);
  $('res-closing').textContent = CONFIG.closing;
  $('res-slogan').textContent = CONFIG.fullSlogan;
  show('result');
  confetti();
  play('win');
}

/* ---------- הכיתה שלי ---------- */
function removePlaced(id) {
  const zone = ITEM_BY_ID[id].zone;
  update((s) => { s.placed[zone] = (s.placed[zone] || []).filter((x) => x !== id); });
}

function placeSelected(zoneId) {
  const item = ITEM_BY_ID[selectedId];
  if (!item) return;
  if (item.zone !== zoneId) {
    toast(`${item.name} שייך ל${ZONE_BY_ID[item.zone].name}`);
    return;
  }
  const zone = ZONE_BY_ID[zoneId];
  if ((getState().placed[zoneId] || []).length >= zone.slots) {
    toast('המקום מלא – לחצו על פריט כדי להסיר אותו');
    return;
  }
  update((s) => {
    (s.placed[zoneId] ||= []).push(item.id);
    s.placedEver += 1;
  });
  selectedId = null;
  play('win-s');
  const fresh = checkAchievements();
  if (fresh.length) {
    confetti();
    toast(`הישג חדש: ${fresh[0].name}`);
  }
  renderClass();
}

function renderClass() {
  const state = getState();
  const selected = ITEM_BY_ID[selectedId];
  $('class-hint').textContent = selected
    ? `לחצו על ${ZONE_BY_ID[selected.zone].name} כדי להציב: ${selected.name}`
    : 'בחרו פריט למטה, ואז לחצו על המקום שלו בכיתה';

  const room = $('room');
  room.replaceChildren();
  for (const z of ZONES) {
    const zone = el('div', `zone zone-${z.id}`);
    if (selected?.zone === z.id) zone.classList.add('glow');
    zone.addEventListener('click', () => placeSelected(z.id));
    zone.append(el('span', 'zone-label', z.name));
    const ids = state.placed[z.id] || [];
    const row = el('div', 'zone-items');
    for (const id of ids) {
      const b = el('button', 'placed-item', ITEM_BY_ID[id].emoji);
      b.type = 'button';
      b.setAttribute('aria-label', `הסר ${ITEM_BY_ID[id].name}`);
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        removePlaced(id);
        play('tap');
        renderClass();
      });
      row.append(b);
    }
    if (!ids.length) row.append(el('span', 'zone-empty', '＋'));
    zone.append(row);
    room.append(zone);
  }

  const tray = $('tray');
  tray.replaceChildren();
  const owned = ITEMS.filter((i) => state.owned.includes(i.id));
  $('tray-empty').hidden = owned.length > 0;
  for (const item of owned) {
    const placed = (state.placed[item.zone] || []).includes(item.id);
    const b = el('button', 'tray-item');
    b.type = 'button';
    b.style.setProperty('--c', RARITIES[item.rarity].color);
    if (placed) b.classList.add('is-placed');
    if (selectedId === item.id) b.classList.add('is-selected');
    b.append(el('span', 'ti-emoji', item.emoji), el('span', 'ti-name', placed ? '✓ מוצב' : item.name));
    b.addEventListener('click', () => {
      play('tap');
      if (placed) removePlaced(item.id);
      else selectedId = selectedId === item.id ? null : item.id;
      renderClass();
    });
    tray.append(b);
  }
}

/* ---------- האוסף שלי ---------- */
function showReveal(item) {
  const card = $('reveal-card');
  card.replaceChildren(itemCard(item, { tag: 'חדש באוסף!', note: 'קיבלת פריט חדש לכיתה שלך!' }));
  const ok = el('button', 'g-btn g-btn-play small', 'מעולה!');
  ok.type = 'button';
  ok.addEventListener('click', () => { $('reveal').hidden = true; });
  const go = el('button', 'g-btn g-btn-blue small', 'לכיתה שלי');
  go.type = 'button';
  go.addEventListener('click', () => { $('reveal').hidden = true; show('class'); });
  card.append(ok, go);
  $('reveal').hidden = false;
  confetti();
  play('win');
}

function renderCollection() {
  const state = getState();
  const total = ITEMS.length;
  $('col-count').textContent = `${state.owned.length} מתוך ${total} פריטים נאספו`;
  $('col-bar').style.width = `${(state.owned.length / total) * 100}%`;

  const stars = $('stars-box');
  stars.replaceChildren();
  const missing = ITEMS.some((i) => !state.owned.includes(i.id));
  stars.append(el('div', 'stars-count', `⭐ כוכבי יצירה: ${state.stars} / ${CONFIG.starsPerUnlock}`));
  if (state.stars >= CONFIG.starsPerUnlock && missing) {
    const b = el('button', 'g-btn g-btn-play small', 'פתחו פריט חדש!');
    b.type = 'button';
    b.addEventListener('click', () => {
      const item = unlockWithStars();
      if (!item) return;
      checkAchievements();
      renderCollection();
      showReveal(item);
    });
    stars.append(b);
  } else {
    stars.append(el('p', 'g-sub', 'כוכבי יצירה מקבלים כשדרגת פריטים כבר מלאה.'));
  }

  const grid = $('col-grid');
  grid.replaceChildren();
  for (const item of ITEMS) {
    const r = RARITIES[item.rarity];
    const own = state.owned.includes(item.id);
    const cell = el('div', own ? 'cell own' : 'cell lock');
    cell.style.setProperty('--c', r.color);
    cell.append(el('span', 'cell-emoji', item.emoji));
    cell.append(el('span', 'cell-name', own ? item.name : '?'));
    const tag = el('i', 'cell-rarity', r.label);
    tag.style.background = r.color;
    cell.append(tag);
    grid.append(cell);
  }

  const ach = $('ach-grid');
  ach.replaceChildren();
  for (const a of ACHIEVEMENTS) {
    const done = state.achievements.includes(a.id);
    const badge = el('div', done ? 'ach done' : 'ach');
    badge.append(el('span', 'ach-emoji', a.emoji), el('b', '', a.name), el('small', '', a.desc));
    ach.append(badge);
  }

  $('stats').textContent =
    `שיא: ${state.best} · משחקים: ${state.games} · רעיונות שנאספו: ${state.ideas} · פריטים בכיתה: ${placedCount()}`;
}

/* ---------- הגדרות ---------- */
function syncSound() {
  $('toggle-sound').textContent = `קול: ${isMuted() ? 'כבוי 🔇' : 'פועל 🔊'}`;
}

function setupSettings() {
  $('open-settings').innerHTML = ICONS.gear;
  syncSound();
  $('open-settings').addEventListener('click', () => { $('settings').hidden = false; });
  $('close-settings').addEventListener('click', () => { $('settings').hidden = true; });
  $('toggle-sound').addEventListener('click', () => {
    setMuted(!isMuted());
    syncSound();
    play('tap');
  });
  $('reset-game').addEventListener('click', () => {
    if (!confirm('למחוק את כל ההתקדמות במשחק? אי אפשר לבטל.')) return;
    resetState();
    selectedId = null;
    $('settings').hidden = true;
    renderHome();
    toast('המשחק אופס');
  });
}

/* ---------- אתחול ---------- */
async function init() {
  game = new CatchGame($('game-canvas'), { hud: setHud, banner, end: onGameEnd });
  loadAvatarImage().then((img) => game.setAvatar(img));

  $('go-play').addEventListener('click', () => { play('tap'); startPlay(); });
  $('go-class').addEventListener('click', () => { play('tap'); show('class'); });
  $('go-collection').addEventListener('click', () => { play('tap'); show('collection'); });
  $('exit-play').addEventListener('click', exitPlay);
  $('res-again').addEventListener('click', startPlay);
  $('res-class').addEventListener('click', () => show('class'));
  $('res-collection').addEventListener('click', () => show('collection'));
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => show(b.dataset.go)));
  setupSettings();
  $('to-campaign').href = CONFIG.campaignUrl;

  show('home');

  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded || document.body.classList.contains('is-play')) return;
      reloaded = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();
