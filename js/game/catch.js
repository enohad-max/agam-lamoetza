import { CONFIG, GOOD, BAD, TIER_WEIGHTS } from './config.js';
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

// משחק התפיסה: אין Game Over, רק זמן שנגמר. ui = { hud, banner, end }
export class CatchGame {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.running = false;
    this.paused = false;
    this.keys = { left: false, right: false };
    this.avatar = null;
    this.px = null;
    this.target = null;

    const move = (e) => { this.target = e.clientX - this.canvas.getBoundingClientRect().left; };
    canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture?.(e.pointerId); move(e); });
    canvas.addEventListener('pointermove', move);

    window.addEventListener('keydown', (e) => this.key(e, true));
    window.addEventListener('keyup', (e) => this.key(e, false));
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => {
      if (!this.running) return;
      this.paused = document.hidden;
      this.last = performance.now();
    });
  }

  setAvatar(img) { this.avatar = img; }

  key(e, down) {
    if (!this.running) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') this.keys.left = down;
    else if (k === 'arrowright' || k === 'd') this.keys.right = down;
    else return;
    e.preventDefault();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = r.width;
    this.H = r.height;
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.bw = Math.min(112, this.W * 0.27);
    this.bh = this.bw * 0.95;
    if (this.px == null) this.px = this.W / 2;
    this.px = Math.min(Math.max(this.px, this.bw / 2), this.W - this.bw / 2);
  }

  start() {
    this.resize();
    this.items = [];
    this.floats = [];
    this.t = 0;
    this.score = 0;
    this.ideas = 0;
    this.bulbs = 0;
    this.gold = 0;
    this.nextSpawn = 0.4;
    this.wobble = 0;
    this.rainUntil = -1;
    this.rainAt = CONFIG.rain.windows.map(([a, b]) => rand(a, b));
    this.px = this.W / 2;
    this.target = this.W / 2;
    this.running = true;
    this.paused = false;
    this.last = performance.now();
    this.pushHud(true);
    this.raf = requestAnimationFrame((ts) => this.loop(ts));
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.keys.left = this.keys.right = false;
  }

  pushHud(force) {
    const time = Math.max(0, Math.ceil(CONFIG.durationSec - this.t));
    const sig = `${this.score}|${time}|${this.ideas}`;
    if (!force && sig === this.hudSig) return;
    this.hudSig = sig;
    this.ui.hud({ score: this.score, time, ideas: this.ideas });
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

  update(dt) {
    this.t += dt;
    const progress = Math.min(1, this.t / CONFIG.durationSec);

    // תנועת הסל: מקלדת או גרירה
    if (this.keys.left || this.keys.right) {
      this.target = (this.target ?? this.px) + (this.keys.right ? 1 : 0) * 560 * dt - (this.keys.left ? 1 : 0) * 560 * dt;
    }
    this.target = Math.min(Math.max(this.target ?? this.px, this.bw / 2), this.W - this.bw / 2);
    this.px += (this.target - this.px) * Math.min(1, dt * 18);

    // גשם של רעיונות
    for (let i = 0; i < this.rainAt.length; i++) {
      if (this.rainAt[i] != null && this.t >= this.rainAt[i]) {
        this.rainAt[i] = null;
        this.rainUntil = this.t + CONFIG.rain.durationSec;
        this.ui.banner('גשם של רעיונות! 🌈');
        play('win');
      }
    }
    const raining = this.t < this.rainUntil;

    this.nextSpawn -= dt;
    if (this.nextSpawn <= 0) {
      this.spawn(raining, progress);
      this.nextSpawn = raining ? CONFIG.spawn.rainEvery : lerp(CONFIG.spawn.startEvery, CONFIG.spawn.endEvery, progress);
    }

    const basketTop = this.H - this.bh - 8;
    for (const it of this.items) {
      it.y += it.vy * dt;
      it.rot += it.vr * dt;
      if (!it.done && it.y + it.size * 0.3 >= basketTop && it.y < this.H - 6 &&
          Math.abs(it.x - this.px) <= this.bw * 0.5 + it.size * 0.15) {
        it.done = true;
        this.collect(it);
      }
    }
    this.items = this.items.filter((it) => !it.done && it.y < this.H + it.size);

    for (const f of this.floats) { f.y -= 46 * dt; f.life -= dt; }
    this.floats = this.floats.filter((f) => f.life > 0);
    this.wobble = Math.max(0, this.wobble - dt);
    this.pushHud(false);
  }

  spawn(raining, progress) {
    const size = rand(38, 48);
    let def;
    if (raining) def = GOOD_BY_ID[pick(CONFIG.rain.pool)];
    else if (Math.random() < CONFIG.badChance) def = { ...pick(BAD), bad: true };
    else {
      const tier = weighted(TIER_WEIGHTS);
      def = pick(GOOD.filter((g) => g.tier === tier));
    }
    this.items.push({
      def,
      size,
      x: rand(size / 2 + 4, this.W - size / 2 - 4),
      y: -size,
      vy: lerp(CONFIG.speed.start, CONFIG.speed.end, progress) * rand(0.9, 1.15),
      rot: rand(0, 6.28),
      vr: rand(-1.2, 1.2),
    });
  }

  collect(it) {
    const { def } = it;
    const at = { x: it.x, y: this.H - this.bh - 16 };
    if (def.bad) {
      this.score = Math.max(0, this.score - CONFIG.badPenalty);
      this.wobble = 0.4;
      this.floats.push({ ...at, text: `-${CONFIG.badPenalty}`, color: '#64748b', life: 0.9 });
      play('oops');
      return;
    }
    const points = def.tier === 'gold' ? CONFIG.goldPoints : def.points;
    this.score += points;
    this.ideas += 1;
    if (def.id === 'bulb') this.bulbs += 1;
    if (def.tier === 'gold') this.gold += 1;
    this.floats.push({ ...at, text: `+${points}`, color: def.tier === 'gold' ? '#f59e0b' : '#0d9488', life: 0.9 });
    play(points >= 3 ? 'win-s' : 'catch');
  }

  draw() {
    const g = this.ctx;
    g.clearRect(0, 0, this.W, this.H);
    for (const it of this.items) this.drawItem(g, it);
    this.drawBasket(g);
    g.font = `800 22px Rubik, system-ui, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const f of this.floats) {
      g.globalAlpha = Math.min(1, f.life * 1.6);
      g.fillStyle = f.color;
      g.fillText(f.text, f.x, f.y);
    }
    g.globalAlpha = 1;
  }

  drawItem(g, it) {
    const { def, size } = it;
    g.save();
    g.translate(it.x, it.y);
    g.rotate(Math.sin(it.rot) * 0.35);
    if (def.draw === 'paper') this.drawPaper(g, size);
    else if (def.draw === 'ink') this.drawInk(g, size);
    else {
      if (def.tier === 'gold') {
        g.shadowColor = 'rgba(250,204,21,.9)';
        g.shadowBlur = 18;
      }
      g.font = `${size}px ${EMOJI_FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(def.emoji, 0, 0);
    }
    g.restore();
  }

  drawPaper(g, s) {
    g.fillStyle = '#f1f5f9';
    g.strokeStyle = '#94a3b8';
    g.lineWidth = 2;
    g.beginPath();
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = s * (i % 2 ? 0.34 : 0.46);
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(-s * 0.15, -s * 0.1); g.lineTo(s * 0.1, s * 0.05); g.lineTo(-s * 0.05, s * 0.2);
    g.stroke();
  }

  drawInk(g, s) {
    g.fillStyle = '#1e3a8a';
    g.beginPath(); g.arc(0, 0, s * 0.34, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(s * 0.3, -s * 0.12, s * 0.12, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(-s * 0.28, s * 0.2, s * 0.1, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)';
    g.beginPath(); g.arc(-s * 0.1, -s * 0.1, s * 0.07, 0, Math.PI * 2); g.fill();
  }

  drawBasket(g) {
    const { bw, bh } = this;
    const shake = this.wobble > 0 ? Math.sin(this.wobble * 60) * 4 : 0;
    const x = this.px + shake;
    const top = this.H - bh - 8;

    if (this.avatar) {
      g.drawImage(this.avatar, x - bw / 2, top, bw, bh);
      return;
    }
    // סל
    const by = top + bh * 0.5;
    g.fillStyle = '#14b8a6';
    g.beginPath();
    g.moveTo(x - bw / 2, by); g.lineTo(x + bw / 2, by);
    g.lineTo(x + bw * 0.38, top + bh); g.lineTo(x - bw * 0.38, top + bh);
    g.closePath(); g.fill();
    g.fillStyle = '#facc15';
    g.beginPath(); g.roundRect(x - bw / 2 - 3, by - 5, bw + 6, 10, 5); g.fill();
    // ראש
    const hy = top + bh * 0.28;
    const hr = bw * 0.24;
    g.fillStyle = '#5b3a29';
    g.beginPath(); g.arc(x, hy + 2, hr + 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fcd5b0';
    g.beginPath(); g.arc(x, hy + 4, hr, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#5b3a29';
    g.beginPath(); g.arc(x, hy, hr + 1, Math.PI, 0); g.fill();
    g.fillStyle = '#2e1065';
    g.beginPath(); g.arc(x - hr * 0.4, hy + 5, 2.2, 0, Math.PI * 2); g.arc(x + hr * 0.4, hy + 5, 2.2, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2e1065'; g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.arc(x, hy + 9, hr * 0.35, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
    g.fillStyle = '#ec4899';
    g.beginPath(); g.arc(x + hr * 0.8, hy - hr * 0.7, 5, 0, Math.PI * 2); g.fill();
  }
}
