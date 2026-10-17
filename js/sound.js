// צלילים עדינים עם WebAudio (נדרש מגע משתמש ב-iOS, לכן יוצרים את ההקשר בזמן לחיצה)
let ctx = null;
let muted = false;
try { muted = localStorage.getItem('muted') === '1'; } catch {}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = value;
  try { localStorage.setItem('muted', value ? '1' : '0'); } catch {}
}

function tone(freq, start, dur) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.05);
}

export function play(kind = 'tap') {
  if (muted) return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    if (kind === 'tap') tone(660, 0, 0.1);
    else [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.2));
  } catch {}
}
