// Sdílené prvky reklam Opice: easing, skutečné snímky appky, realistický iPhone, tečkové efekty.
const W = 1080, H = 1920, RATIO = 2532 / 1170;
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), p = (t, a, b) => cl((t - a) / (b - a)), lerp = (a, b, k) => a + (b - a) * k;
const out = x => 1 - Math.pow(1 - x, 4), out2 = x => 1 - Math.pow(1 - x, 2), inn = x => x * x * x;
const io = x => x < .5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
const expo = x => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
const spring = (x, f = 9, d = 6) => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-d * x) * Math.cos(f * x);
const pad = n => String(n).padStart(4, '0');

// Snímky appky (30 fps, skutečná rychlost) ve složce ../work4/f/<dir>/NNNN.jpg.
const N = { path: 35, pathsel: 26, birth: 134, map: 125, lesson: 134, cel: 194, stg: 134, league: 74, season: 74, progress: 74 };
const frameSrc = (dir, f) => `../work4/f/${dir}/${pad(Math.max(1, Math.min(N[dir] ?? 89, Math.floor(f))))}.jpg`;

// Obrazovka appky bez rámečku (plná plocha / detail): u,v = bod obrazovky ve středu `cx,cy`, w = šířka.
function bare(dir, f, { u = .5, v = .5, w = 1080, cx = 540, cy = 960, extra = '' } = {}) {
  const h = w * RATIO;
  return `<div style="position:absolute;left:${cx - u * w}px;top:${cy - v * h}px;width:${w}px;height:${h}px;${extra}"><img src="${frameSrc(dir, f)}" style="width:100%;height:100%;display:block"></div>`;
}

// Realistický iPhone: titanový rám, Dynamic Island, stavový řádek, odlesk skla, stín. `sw` = šířka displeje.
// Pozice = střed (cx, cy), 3D natočení rx/ry/rz ve stupních, `bar` = barva stavového řádku podle obrazovky.
function iphone(dir, f, { cx = 540, cy = 1000, sw = 600, rx = 0, ry = 0, rz = 0, s = 1, bar = '#0B0B0C', ink = '#EDEDEF', glare = .5, inner = '' } = {}) {
  const sb = sw * .118, sh = sw * RATIO + sb, bz = sw * .034, R = sw * .155;
  const pw = sw + 2 * bz, ph = sh + 2 * bz;
  const isl = `<div style="position:absolute;left:${sw / 2 - sw * .155}px;top:${sw * .028}px;width:${sw * .31}px;height:${sw * .088}px;border-radius:999px;background:#000"></div>`;
  const status = `<div style="position:absolute;left:0;top:0;width:${sw}px;height:${sb}px;background:${bar};font:600 ${sw * .043}px Inter;color:${ink}">
    <span style="position:absolute;left:${sw * .1}px;top:${sw * .045}px">9:41</span>
    <span style="position:absolute;right:${sw * .08}px;top:${sw * .05}px;display:flex;gap:${sw * .012}px;align-items:flex-end">
      ${[.35, .5, .68, .85].map(k => `<i style="display:block;width:${sw * .01}px;height:${sw * .032 * k}px;background:${ink};border-radius:1px"></i>`).join('')}
      <i style="display:block;width:${sw * .06}px;height:${sw * .03}px;border:${sw * .004}px solid ${ink};border-radius:${sw * .008}px;margin-left:${sw * .02}px;position:relative;opacity:.9"><b style="position:absolute;inset:${sw * .004}px;width:70%;background:${ink};border-radius:${sw * .003}px"></b></i>
    </span></div>`;
  return `<div style="position:absolute;left:${cx - pw / 2}px;top:${cy - ph / 2}px;width:${pw}px;height:${ph}px;transform-style:preserve-3d;
     transform:rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s});">
    <div style="position:absolute;inset:0;border-radius:${R + bz}px;background:linear-gradient(140deg,#6b6b70 0%,#2a2a2e 18%,#1a1a1d 50%,#3b3b40 82%,#77777c 100%);
      box-shadow:0 ${sw * .12}px ${sw * .28}px rgba(0,0,0,.55),0 ${sw * .03}px ${sw * .06}px rgba(0,0,0,.4),inset 0 0 0 ${sw * .004}px rgba(255,255,255,.18)"></div>
    <div style="position:absolute;left:-${sw * .008}px;top:${ph * .2}px;width:${sw * .012}px;height:${ph * .06}px;border-radius:3px;background:#2c2c30"></div>
    <div style="position:absolute;left:-${sw * .008}px;top:${ph * .29}px;width:${sw * .012}px;height:${ph * .09}px;border-radius:3px;background:#2c2c30"></div>
    <div style="position:absolute;right:-${sw * .008}px;top:${ph * .26}px;width:${sw * .012}px;height:${ph * .13}px;border-radius:3px;background:#2c2c30"></div>
    <div style="position:absolute;left:${bz}px;top:${bz}px;width:${sw}px;height:${sh}px;border-radius:${R}px;overflow:hidden;background:#000">
      ${status}
      <img src="${frameSrc(dir, f)}" style="position:absolute;left:0;top:${sb}px;width:${sw}px;height:${sw * RATIO}px;display:block">
      ${inner}
      ${isl}
      <div style="position:absolute;inset:0;background:linear-gradient(118deg,rgba(255,255,255,${.16 * glare}) 0%,rgba(255,255,255,${.05 * glare}) 30%,transparent 46%)"></div>
    </div></div>`;
}

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }

// Tečkový přechod (mřížka teček roste od středu, za střihem se stáhne).
function dotWipe(ctx, t, cut, col, o = [540, 960], d = .28) {
  let k = 0;
  if (t >= cut - d && t < cut) k = io(p(t, cut - d, cut)); else if (t >= cut && t < cut + d) k = 1 - io(p(t, cut, cut + d)); else return;
  const S = 48, maxd = Math.hypot(1080, 1920) * .62; ctx.fillStyle = col;
  for (let y = S / 2; y < H + S; y += S) for (let x = S / 2; x < W + S; x += S) {
    const dd = Math.hypot(x - o[0], y - o[1]) / maxd, lp = cl(k * 1.7 - dd * .7), r = lp * S * .74;
    if (r > .3) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  }
}
// Tečkový výbuch: dva prstence teček se rozletí a zmizí.
function burst(ctx, t, a, x, y, R, col = '#EDEDEF', n = 28, d = .55, r0 = 6) {
  const k = p(t, a, a + d); if (k <= 0 || k >= 1) return; const e = out(k);
  ctx.fillStyle = col; ctx.globalAlpha = 1 - k;
  for (let ring = 0; ring < 2; ring++) {
    const rr = R * e * (ring ? .62 : 1), m = ring ? Math.round(n * .6) : n;
    for (let i = 0; i < m; i++) { const an = i / m * 6.283 + ring * .2; ctx.beginPath(); ctx.arc(x + Math.cos(an) * rr, y + Math.sin(an) * rr, r0 * (1 - k * .6), 0, 7); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
// Logo „Opice“ z částic: cíle z bitmapy textu v Doto.
const _targets = {};
function logoTargets(text, size, cy, seed = 7) {
  const key = text + size + cy; if (_targets[key]) return _targets[key];
  const c = document.createElement('canvas'); c.width = W; c.height = size * 1.7; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.font = `900 ${size}px Doto`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 540, c.height / 2);
  const d = g.getImageData(0, 0, W, c.height).data, T = [], R = rng(seed), S = Math.max(6, Math.round(size / 33));
  for (let y = 0; y < c.height; y += S) for (let x = 0; x < W; x += S) if (d[(y * W + x) * 4 + 3] > 140) {
    const a = R() * 6.283, rr = 40 + R() * 60;
    T.push({ x, y: y + cy - c.height / 2, sx: 540 + Math.cos(a) * rr, sy: cy + Math.sin(a) * rr, del: R() * .35, sw: (R() - .5) * 2 });
  }
  return (_targets[key] = T);
}
function logoParticles(ctx, t, a, T, col = '#EDEDEF', r = 3.9, dur = .75) {
  ctx.fillStyle = col;
  for (const q of T) {
    const k = out(p(t, a + q.del, a + q.del + dur)); if (k <= 0) continue;
    const sw = Math.sin(k * Math.PI) * 120 * q.sw;
    ctx.globalAlpha = cl(k * 2); ctx.beginPath(); ctx.arc(lerp(q.sx, q.x, k) + sw, lerp(q.sy, q.y, k), r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
// Text, který se objeví rozmazaný a zaostří (po slovech).
function blurWords(t, a, text, { stagger = .07, d = .45, dy = 30 } = {}) {
  return text.split(' ').map((w, i) => {
    const k = out(p(t, a + i * stagger, a + i * stagger + d));
    return `<span style="display:inline-block;opacity:${k};filter:blur(${(1 - k) * 18}px);transform:translateY(${(1 - k) * dy}px)">${w}</span>`;
  }).join(' ');
}
