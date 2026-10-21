import { CONFIG, GOOD, TIER_WEIGHTS } from './config.js';
import { CatchGame } from './catch.js';
import { play } from '../sound.js';

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const GOOD_BY_ID = Object.fromEntries(GOOD.map((g) => [g.id, g]));

function weighted(weights) {
  let r = Math.random() * Object.values(weights).reduce((n, w) => n + w, 0);
  for (const [key, w] of Object.entries(weights)) {
    r -= w;
    if (r <= 0) return key;
  }
  return Object.keys(weights)[0];
}

// כל המידות ביחידות u, כש-u = גובה המסך / 640, כך שהמשחק נראה ומרגיש אותו דבר בכל טלפון.
// לחיצה קצרה (שחרור מוקדם) חותכת את הקפיצה לגובה נמוך; החזקה שומרת על כבידה חלשה בעלייה = קפיצה גבוהה.
const JUMP_V = 700;
const G_HOLD = 1500;
const G_FALL = 3300;
const CUT_V = 380;
const MIN_HOLD = 0.1; // גם נגיעה קצרה מאוד נותנת קפיצה נמוכה מלאה
const BUFFER = 0.1; // לחיצה קצת לפני הנחיתה עדיין קופצת
const PLAYER_H = 70;
const PLAYER_HALF_W = 12;
const IDEA_R = 19;
const BOMB_R = 17;
// בריצה הרעיונות פזורים בצפיפות גבוהה יותר, ולכן שווים קצת פחות מאשר במשחק התפיסה
const RUN_POINTS = { regular: 1, special: 2, rare: 3, gold: 5 };
const STUMBLE = 0.6;
const INVULN = 1.4;

// תבניות מסלול. dx = מרחק מתחילת התבנית, c = גובה מרכז הפריט מעל הקרקע.
const arc = (n, dx0, step, base, peak) =>
  Array.from({ length: n }, (_, i) => ({ t: 'idea', dx: dx0 + i * step, c: base + peak * Math.sin((Math.PI * i) / (n - 1)) }));

const PATTERNS = [
  { weight: 8, width: 130, parts: () => arc(3, 0, 42, 40, 0) }, // שורה על הקרקע, בלי לקפוץ
  { weight: 22, width: 210, parts: () => [{ t: 'obs', kind: 'low', dx: 104 }, ...arc(3, 62, 38, 40, 75)] },
  { weight: 18, width: 290, parts: () => [{ t: 'obs', kind: 'tall', dx: 140 }, ...arc(4, 70, 52, 60, 155)] },
  { weight: 18, width: 150, parts: () => [{ t: 'bomb', dx: 60, c: 20 }, ...arc(3, 25, 40, 40, 70)] },
  // מכשול נמוך עם פצצה באוויר מעליו: חייבים קפיצה נמוכה, גבוהה תפגוש את הפצצה
  { weight: 14, width: 210, parts: () => [{ t: 'obs', kind: 'low', dx: 104 }, { t: 'bomb', dx: 104, c: 190 }, ...arc(3, 62, 38, 40, 65)] },
];
const RAIN = { width: 240, parts: () => Array.from({ length: 6 }, (_, i) => ({ t: 'idea', dx: i * 40, c: 75 + 38 * Math.sin(i * 0.9) })) };

// פצצה מצוירת: אותו ציור כמו במשחק התפיסה (הפונקציה לא משתמשת ב-this)
const drawBomb = (g, s) => CatchGame.prototype.drawBomb(g, s);

// משחק הריצה: אין Game Over, רק זמן שנגמר. ui = { hud, banner, end } כמו במשחק התפיסה.
export class RunGame {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.running = false;
    this.paused = false;
    this.avatar = null;
    this.holding = false;

    const down = (e) => { if (this.running) { canvas.setPointerCapture?.(e.pointerId); this.press(); } };
    const up = () => this.release();
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    const isJumpKey = (e) => e.code === 'Space' || e.key === 'ArrowUp' || e.key.toLowerCase() === 'w';
    window.addEventListener('keydown', (e) => {
      if (!this.running || !isJumpKey(e)) return;
      e.preventDefault();
      if (!e.repeat) this.press();
    });
    window.addEventListener('keyup', (e) => { if (this.running && isJumpKey(e)) this.release(); });
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (!this.running) return;
      this.paused = document.hidden;
      this.last = performance.now();
      if (document.hidden) this.release();
    });
  }

  setAvatar(img) { this.avatar = img; }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = r.width;
    this.H = r.height;
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.u = this.H / 640;
    this.gy = this.H * 0.8;
    this.px = this.W * 0.24;
    if (!this.clouds) this.makeClouds();
  }

  makeClouds() {
    this.clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 0.22, y: rand(0.06, 0.34), s: rand(0.7, 1.2) }));
  }

  start() {
    this.resize();
    this.entities = [];
    this.floats = [];
    this.t = 0;
    this.dist = 0;
    this.score = 0;
    this.ideas = 0;
    this.bulbs = 0;
    this.gold = 0;
    this.h = 0;
    this.vh = 0;
    this.holding = false;
    this.buffer = 0;
    this.cutAt = null;
    this.pressT = 0;
    this.phase = 0;
    this.land = 0;
    this.stumble = 0;
    this.invuln = 0;
    this.edge = this.W + 120 * this.u;
    this.rainUntil = -1;
    this.rainAt = CONFIG.rain.windows.map(([a, b]) => rand(a, b));
    this.running = true;
    this.paused = false;
    this.last = performance.now();
    this.pushHud(true);
    this.raf = requestAnimationFrame((ts) => this.loop(ts));
  }

  stop() {
    this.running = false;
    this.holding = false;
    cancelAnimationFrame(this.raf);
  }

  pushHud(force) {
    const time = Math.max(0, Math.ceil(CONFIG.durationSec - this.t));
    const sig = `${this.score}|${time}|${this.ideas}`;
    if (!force && sig === this.hudSig) return;
    this.hudSig = sig;
    this.ui.hud({ score: this.score, time, ideas: this.ideas });
  }

  press() {
    this.holding = true;
    if (this.h <= 0.5) this.jump();
    else this.buffer = BUFFER;
  }

  release() {
    this.holding = false;
    this.buffer = 0;
    // שחרור באמצע העלייה חותך את הקפיצה (אחרי זמן מינימלי, כדי שגם נגיעה קצרה תתן קפיצה מלאה נמוכה)
    this.cutAt = Math.max(this.t || 0, (this.pressT || 0) + MIN_HOLD);
  }

  jump() {
    this.pressT = this.t;
    this.cutAt = null;
    this.vh = JUMP_V * this.u;
    this.h = Math.max(this.h, 0.01);
    this.buffer = 0;
  }

  loop(ts) {
    if (!this.running) return;
    this.raf = requestAnimationFrame((n) => this.loop(n));
    if (this.paused) return;
    const dt = Math.min(0.05, (ts - this.last) / 1000);
    this.last = ts;
    this.update(dt);
    this.draw();
    if (this.t >= CONFIG.durationSec) {
      this.stop();
      this.ui.end({ score: this.score, ideas: this.ideas, bulbs: this.bulbs, gold: this.gold });
    }
  }

  get speed() {
    const progress = Math.min(1, this.t / CONFIG.durationSec);
    const base = lerp(CONFIG.run.start, CONFIG.run.end, progress) * this.u;
    return this.stumble > 0 ? base * 0.4 : base;
  }

  update(dt) {
    this.t += dt;
    const u = this.u;
    const v = this.speed;
    const dx = v * dt;
    this.dist += dx;
    this.stumble = Math.max(0, this.stumble - dt);
    this.invuln = Math.max(0, this.invuln - dt);
    this.land = Math.max(0, this.land - dt * 5);
    this.phase += dt * (v / u) * 0.05;

    if (this.cutAt != null && this.t >= this.cutAt) {
      this.cutAt = null;
      this.vh = Math.min(this.vh, CUT_V * u);
    }

    // קפיצה: כבידה חלשה בעלייה כל עוד האצבע לחוצה
    if (this.h > 0) {
      const g = (this.holding && this.vh > 0 ? G_HOLD : G_FALL) * u;
      this.vh -= g * dt;
      this.h += this.vh * dt;
      if (this.h <= 0) {
        if (this.vh < -200 * u) this.land = 1;
        this.h = 0;
        this.vh = 0;
        if (this.buffer > 0) this.jump();
      }
    }
    this.buffer = Math.max(0, this.buffer - dt);

    // גשם של רעיונות
    for (let i = 0; i < this.rainAt.length; i++) {
      if (this.rainAt[i] != null && this.t >= this.rainAt[i]) {
        this.rainAt[i] = null;
        this.rainUntil = this.t + CONFIG.rain.durationSec;
        this.ui.banner('גשם של רעיונות! 🌈');
        play('win');
      }
    }

    // התקדמות העולם ויצירת תבניות חדשות
    for (const e of this.entities) e.x -= dx;
    this.edge -= dx;
    if (this.edge < this.W + 40 * u) this.spawn(this.t < this.rainUntil);
    this.entities = this.entities.filter((e) => !e.done && e.x > -80 * u);

    this.collide();
    for (const f of this.floats) { f.y -= 46 * dt; f.life -= dt; }
    this.floats = this.floats.filter((f) => f.life > 0);
    this.pushHud(false);
  }

  spawn(raining) {
    const u = this.u;
    const pattern = raining ? RAIN : this.choosePattern();
    const gap = raining ? 70 * u : this.speed * rand(1.2, 1.8);
    const x0 = Math.max(this.W + 40 * u, this.edge + gap);
    for (const part of pattern.parts()) {
      const e = { type: part.t, x: x0 + part.dx * u, c: part.c, kind: part.kind, bob: rand(0, 6.28) };
      if (part.t === 'idea') {
        e.def = raining ? GOOD_BY_ID[pick(CONFIG.rain.pool)] : pick(this.goodOfTier(weighted(TIER_WEIGHTS)));
      }
      this.entities.push(e);
    }
    this.edge = x0 + pattern.width * u;
  }

  goodOfTier(tier) {
    return GOOD.filter((g) => g.tier === tier);
  }

  choosePattern() {
    let r = Math.random() * PATTERNS.reduce((n, p) => n + p.weight, 0);
    for (const p of PATTERNS) {
      r -= p.weight;
      if (r <= 0) return p;
    }
    return PATTERNS[0];
  }

  collide() {
    const u = this.u;
    const left = this.px - PLAYER_HALF_W * u;
    const right = this.px + PLAYER_HALF_W * u;
    const bottom = this.h;
    const top = this.h + PLAYER_H * u;
    for (const e of this.entities) {
      if (e.done) continue;
      if (e.type === 'obs') {
        const w = (e.kind === 'tall' ? 40 : 44) * u;
        const hgt = (e.kind === 'tall' ? 112 : 46) * u;
        if (right > e.x - w / 2 && left < e.x + w / 2 && bottom < hgt - 6 * u && this.invuln <= 0) {
          e.done = true;
          this.hit('אוי!', 0);
        }
        continue;
      }
      // פריטים עגולים (רעיון/פצצה): מרחק מהמלבן של הילדה
      const r = (e.type === 'bomb' ? BOMB_R : IDEA_R) * u;
      const cy = e.c * u;
      const nx = Math.min(Math.max(e.x, left), right);
      const ny = Math.min(Math.max(cy, bottom), top);
      if ((e.x - nx) ** 2 + (cy - ny) ** 2 > r * r) continue;
      if (e.type === 'idea') this.collect(e);
      else if (this.invuln <= 0) {
        e.done = true;
        this.hit(`-${CONFIG.badPenalty}`, CONFIG.badPenalty);
      }
    }
  }

  // פגיעה: מכשול רק מאט, פצצה גם מורידה נקודות
  hit(text, penalty) {
    this.stumble = STUMBLE;
    this.invuln = INVULN;
    if (penalty) this.score = Math.max(0, this.score - penalty);
    this.floats.push({ x: this.px, y: this.gy - (this.h + PLAYER_H + 14 * this.u), text, color: '#64748b', life: 0.9 });
    play('oops');
  }

  collect(e) {
    const { def } = e;
    e.done = true;
    const points = RUN_POINTS[def.tier] ?? def.points;
    this.score += points;
    this.ideas += 1;
    if (def.id === 'bulb') this.bulbs += 1;
    if (def.tier === 'gold') this.gold += 1;
    this.floats.push({ x: e.x, y: this.gy - e.c * this.u - 20 * this.u, text: `+${points}`, color: def.tier === 'gold' ? '#f59e0b' : '#0d9488', life: 0.9 });
    play(points >= 3 ? 'win-s' : 'catch');
  }

  /* ---------- ציור ---------- */
  draw() {
    const g = this.ctx;
    this.drawBackground(g);
    for (const e of this.entities) this.drawEntity(g, e);
    this.drawPlayer(g);
    g.font = '800 22px Rubik, system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const f of this.floats) {
      g.globalAlpha = Math.min(1, f.life * 1.6);
      g.fillStyle = f.color;
      g.fillText(f.text, f.x, f.y);
    }
    g.globalAlpha = 1;
  }

  drawBackground(g) {
    const { W, H, u, gy, dist } = this;
    const sky = g.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, '#7dd3fc');
    sky.addColorStop(1, '#e0f7ff');
    g.fillStyle = sky;
    g.fillRect(0, 0, W, gy);

    // שמש
    g.fillStyle = 'rgba(253, 224, 71, .35)';
    g.beginPath(); g.arc(W * 0.84, H * 0.13, 46 * u, 0, 6.283); g.fill();
    g.fillStyle = '#fde047';
    g.beginPath(); g.arc(W * 0.84, H * 0.13, 28 * u, 0, 6.283); g.fill();

    // עננים (תנועה איטית)
    g.fillStyle = 'rgba(255, 255, 255, .85)';
    for (const c of this.clouds) {
      const x = ((c.x * W * 1.6 - dist * 0.12) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3;
      const y = c.y * gy;
      const s = c.s * u;
      for (const [ex, ey, rx, ry] of [[0, 0, 38, 14], [22, -8, 24, 14], [-22, -5, 20, 11]]) {
        g.beginPath();
        g.ellipse(x + ex * s, y + ey * s, rx * s, ry * s, 0, 0, 6.283);
        g.fill();
      }
    }

    // גבעות רחוקות
    g.fillStyle = '#a7f3d0';
    g.beginPath(); g.moveTo(0, gy);
    for (let x = 0; x <= W + 8; x += 8) g.lineTo(x, gy - (46 + 24 * Math.sin((x + dist * 0.25) / (90 * u))) * u);
    g.lineTo(W, gy); g.closePath(); g.fill();

    // בית ספר שחולף ברקע
    const span = 1500 * u;
    const bx = W + 120 * u - ((dist * 0.4) % span);
    this.drawSchool(g, bx, gy - 6 * u, u);

    // עצים קרובים יותר
    const gapT = 280 * u;
    for (let i = 0; i < Math.ceil(W / gapT) + 2; i++) {
      const x = i * gapT - ((dist * 0.6) % gapT) + 40 * u;
      g.fillStyle = '#92400e';
      g.fillRect(x - 4 * u, gy - 42 * u, 8 * u, 42 * u);
      g.fillStyle = i % 2 ? '#22c55e' : '#16a34a';
      g.beginPath(); g.arc(x, gy - 56 * u, 26 * u, 0, 6.283); g.fill();
      g.beginPath(); g.arc(x + 14 * u, gy - 46 * u, 18 * u, 0, 6.283); g.fill();
    }

    // קרקע
    g.fillStyle = '#4ade80';
    g.fillRect(0, gy, W, 14 * u);
    g.fillStyle = '#e8c08a';
    g.fillRect(0, gy + 14 * u, W, H - gy);
    g.fillStyle = 'rgba(146, 64, 14, .22)';
    const step = 70 * u;
    for (let i = 0; i < Math.ceil(W / step) + 2; i++) {
      const x = i * step - (dist % step);
      g.fillRect(x, gy + 30 * u, 26 * u, 4 * u);
      g.fillRect(x + 34 * u, gy + 52 * u, 18 * u, 4 * u);
    }
  }

  drawSchool(g, x, y, u) {
    g.fillStyle = '#fcd34d';
    g.fillRect(x - 90 * u, y - 70 * u, 180 * u, 70 * u);
    g.fillStyle = '#ef4444';
    g.beginPath();
    g.moveTo(x - 100 * u, y - 70 * u); g.lineTo(x, y - 112 * u); g.lineTo(x + 100 * u, y - 70 * u);
    g.closePath(); g.fill();
    g.fillStyle = '#e0f2fe';
    for (const wx of [-62, -26, 26, 62]) g.fillRect(x + (wx - 9) * u, y - 52 * u, 18 * u, 20 * u);
    g.fillStyle = '#92400e';
    g.fillRect(x - 10 * u, y - 34 * u, 20 * u, 34 * u);
    g.strokeStyle = '#78350f';
    g.lineWidth = 2 * u;
    g.beginPath(); g.moveTo(x, y - 112 * u); g.lineTo(x, y - 132 * u); g.stroke();
    g.fillStyle = '#ec4899';
    g.fillRect(x, y - 132 * u, 18 * u, 11 * u);
  }

  drawEntity(g, e) {
    const u = this.u;
    if (e.type === 'obs') return this.drawObstacle(g, e);
    const y = this.gy - e.c * u;
    if (e.type === 'bomb') {
      g.save();
      g.translate(e.x, y);
      drawBomb(g, 46 * u);
      g.restore();
      return;
    }
    const { def } = e;
    g.save();
    g.translate(e.x, y + Math.sin(this.t * 4 + e.bob) * 3 * u);
    if (def.tier === 'gold') {
      g.shadowColor = 'rgba(250, 204, 21, .9)';
      g.shadowBlur = 18;
    }
    g.fillStyle = '#000'; // אמוג'י נצבע בשקיפות של צבע המילוי האחרון
    g.font = `${42 * u}px ${EMOJI_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(def.emoji, 0, 0);
    g.restore();
  }

  // נמוך = ערימת ספרים, גבוה = ערימת ארגזים
  drawObstacle(g, e) {
    const u = this.u;
    const gy = this.gy;
    if (e.kind === 'low') {
      const colors = ['#3b82f6', '#ec4899', '#facc15'];
      colors.forEach((col, i) => {
        const w = (44 - i * 4) * u;
        g.fillStyle = col;
        g.beginPath(); g.roundRect(e.x - w / 2 + (i % 2) * 2 * u, gy - (i + 1) * 15.3 * u, w, 15.3 * u, 3 * u); g.fill();
        g.fillStyle = 'rgba(255, 255, 255, .55)';
        g.fillRect(e.x - w / 2 + 6 * u, gy - (i + 1) * 15.3 * u + 5 * u, w - 12 * u, 2.5 * u);
      });
      return;
    }
    for (let i = 0; i < 3; i++) {
      const top = gy - (i + 1) * 37.3 * u;
      g.fillStyle = i % 2 ? '#d6a15f' : '#c68a45';
      g.beginPath(); g.roundRect(e.x - 20 * u, top, 40 * u, 37.3 * u, 3 * u); g.fill();
      g.fillStyle = 'rgba(120, 53, 15, .45)';
      g.fillRect(e.x - 3 * u, top, 6 * u, 37.3 * u);
      g.strokeStyle = 'rgba(120, 53, 15, .5)';
      g.lineWidth = 1.5 * u;
      g.strokeRect(e.x - 20 * u, top, 40 * u, 37.3 * u);
    }
  }

  // ראש התמונה של אגם על גוף מצויר, בסגנון "ראש גדול"
  drawPlayer(g) {
    const u = this.u;
    const air = this.h > 2;
    const sw = air ? 0 : Math.sin(this.phase);
    const bob = air ? 0 : Math.abs(Math.sin(this.phase)) * 3 * u;
    const baseY = this.gy - this.h;

    const shadow = Math.max(0.35, 1 - this.h / (200 * u));
    g.fillStyle = 'rgba(15, 23, 42, .2)';
    g.beginPath(); g.ellipse(this.px, this.gy + 4 * u, 20 * u * shadow, 5 * u * shadow, 0, 0, 6.283); g.fill();

    g.save();
    if (this.invuln > 0 && Math.floor(this.t * 14) % 2 === 0) g.globalAlpha = 0.45;
    g.translate(this.px, baseY - bob);
    if (this.land > 0) g.scale(1 + 0.12 * this.land, 1 - 0.14 * this.land);
    if (this.stumble > 0) g.rotate(Math.sin(this.t * 40) * 0.06);
    g.lineCap = 'round';

    // רגליים
    g.strokeStyle = '#4c1d95';
    g.lineWidth = 7 * u;
    for (const s of [-1, 1]) {
      const fx = air ? s * 9 * u : s * (5 + sw * 12) * u;
      const fy = air ? -9 * u : -2 * u - Math.max(0, sw * s) * 9 * u;
      g.beginPath(); g.moveTo(s * 6 * u, -18 * u); g.lineTo(fx, fy); g.stroke();
      g.fillStyle = '#fff';
      g.beginPath(); g.ellipse(fx + s * 2 * u, fy, 6 * u, 4 * u, 0, 0, 6.283); g.fill();
    }

    // ראש (חיתוך התמונה)
    const hw = 46 * u;
    const hh = hw * 236 / 270;
    g.save();
    g.translate(0, -38 * u);
    g.rotate(air ? -0.05 : Math.sin(this.phase * 2) * 0.04);
    if (this.avatar) {
      g.drawImage(this.avatar, 38, 0, 270, 236, -hw / 2, -hh, hw, hh);
    } else {
      g.fillStyle = '#fcd5b0';
      g.beginPath(); g.arc(0, -hh / 2, hw / 2.2, 0, 6.283); g.fill();
    }
    g.restore();

    // גוף
    const body = g.createLinearGradient(0, -42 * u, 0, -16 * u);
    body.addColorStop(0, '#8b5cf6');
    body.addColorStop(1, '#6d28d9');
    g.fillStyle = body;
    g.beginPath(); g.roundRect(-13 * u, -42 * u, 26 * u, 26 * u, 8 * u); g.fill();
    g.fillStyle = '#fde047';
    g.beginPath(); g.arc(0, -29 * u, 4.5 * u, 0, 6.283); g.fill();

    // ידיים
    g.strokeStyle = '#f3c3a1';
    g.lineWidth = 5 * u;
    for (const s of [-1, 1]) {
      const hx = s * (air ? 19 : 17) * u;
      const hy = air ? -50 * u : (-27 - sw * s * 8) * u;
      g.beginPath(); g.moveTo(s * 12 * u, -38 * u); g.lineTo(hx, hy); g.stroke();
    }
    g.restore();
  }
}
