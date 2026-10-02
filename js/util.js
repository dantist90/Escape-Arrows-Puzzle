// ---------- Small helpers shared by every module ----------
window.AP = window.AP || {};
AP.screens = {}; // scenes register here: AP.screens.lobby = { enter, update, draw, onDown, onMove, onUp } (see js/game.js)
// One embedded font (Liberation Sans Bold subset, Latin + Cyrillic + Turkish/Polish) so text looks identical on every device.
AP.FONT = '"ArrowsFont", sans-serif'; // embedded assets/fonts/game.woff, no system font

const U = AP.util = {
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  inRect: (px, py, r) => px >= r.x && py >= r.y && px <= r.x + r.w && py <= r.y + r.h,
  easeOut: t => 1 - Math.pow(1 - t, 3),
  easeIn: t => t * t * t,
  easeInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  easeBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  elastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,

  // --- color ---
  hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; },
  rgbToHex: (r, g, b) => '#' + [r, g, b].map(v => Math.round(U.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''),
  mix(h1, h2, t) { const a = U.hexToRgb(h1), b = U.hexToRgb(h2); return U.rgbToHex(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t)); },
  lighten: (hex, t) => U.mix(hex, '#ffffff', t),
  darken: (hex, t) => U.mix(hex, '#000000', t),
  rgba(hex, a) { const c = U.hexToRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; },
  hsl(hex) {
    let [r, g, b] = U.hexToRgb(hex).map(v => v / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h, s, l };
  },

  // --- canvas ---
  rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  },
  // opt.maxW: shrink the font down to opt.minScale (default 0.65) of opt.size, then truncate with '…' so the text fits.
  // Returns what was drawn: {w, size, str} (callers / tests can use it for layout).
  text(ctx, str, x, y, opt = {}) {
    ctx.save(); str = String(str); const weight = opt.weight || 800; let size = opt.size || 16;
    if (opt.maxW > 0) { const f = U.fit(ctx, str, weight, size, opt.maxW, opt.minScale); str = f.str; size = f.size; }
    ctx.font = `${weight} ${size}px ${AP.FONT}`;
    ctx.textAlign = opt.align || 'center'; ctx.textBaseline = opt.base || 'middle';
    if (opt.stroke) { ctx.lineWidth = opt.strokeW || 4; ctx.strokeStyle = opt.stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = opt.color || '#5b3d6e'; ctx.fillText(str, x, y);
    const w = ctx.measureText(str).width; ctx.restore();
    return { w, size, str };
  },
  // font size (>= size*minScale) at which str fits maxW; may still be wider than maxW at the minimum size
  fitSize(ctx, str, weight, size, maxW, minScale = 0.65) {
    ctx.save(); ctx.font = `${weight || 800} ${size}px ${AP.FONT}`; const tw = ctx.measureText(String(str)).width; ctx.restore();
    return tw <= maxW || tw <= 0 ? size : Math.max(size * minScale, size * maxW / tw * 0.995);
  },
  // shrink, then ellipsize: returns {str, size, w} that fits maxW
  fit(ctx, str, weight, size, maxW, minScale = 0.65) {
    str = String(str); const origMin = size * minScale; size = U.fitSize(ctx, str, weight, size, maxW, minScale);
    ctx.save(); ctx.font = `${weight || 800} ${size}px ${AP.FONT}`; let w = ctx.measureText(str).width;
    // text width is not exactly linear in font size (hinting): nudge down a few times before giving up
    for (let k = 0; k < 4 && w > maxW && w <= maxW * 1.08; k++) { const ns = size * maxW / w * 0.99; if (ns < origMin) break; size = ns; ctx.font = `${weight || 800} ${size}px ${AP.FONT}`; w = ctx.measureText(str).width; }
    if (w > maxW) { let t = str; while (t.length > 1 && ctx.measureText(t.trimEnd() + '…').width > maxW) t = t.slice(0, -1); str = t.trimEnd() + '…'; w = ctx.measureText(str).width; }
    ctx.restore(); return { str, size, w };
  },
  // word-wrap text; returns line count. opt.maxLines: last line is ellipsized; opt.dry: measure only (no drawing)
  wrapLines(ctx, str, maxW, opt = {}) {
    ctx.save(); ctx.font = `${opt.weight || 800} ${opt.size || 14}px ${AP.FONT}`;
    const words = String(str).split(' '); let lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    if (opt.maxLines && lines.length > opt.maxLines) { lines = lines.slice(0, opt.maxLines - 1).concat([lines.slice(opt.maxLines - 1).join(' ')]); }
    ctx.restore(); return lines;
  },
  wrap(ctx, str, x, y, maxW, lineH, opt = {}) {
    const lines = U.wrapLines(ctx, str, maxW, opt);
    if (!opt.dry) lines.forEach((l, i) => U.text(ctx, l, x, y + i * lineH, { ...opt, maxW, minScale: opt.maxLines ? 1 : (opt.minScale || 0.65) }));
    return lines.length;
  },
  heart(ctx, x, y, s) {
    ctx.beginPath(); ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x, y - s * 0.1, x - s * 0.55, y - s * 0.3, x - s * 0.5, y + s * 0.05);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.35, x, y + s * 0.55, x, y + s * 0.7);
    ctx.bezierCurveTo(x, y + s * 0.55, x + s * 0.5, y + s * 0.35, x + s * 0.5, y + s * 0.05);
    ctx.bezierCurveTo(x + s * 0.55, y - s * 0.3, x, y - s * 0.1, x, y + s * 0.35); ctx.closePath();
  },
  star(ctx, x, y, r, n = 5, inner = 0.45) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n; const rr = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath();
  },
  poly(ctx, pts) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); }
};

// ---------- Tiny tween system ----------
AP.tweens = [];
AP.tween = function (obj, to, dur, opt = {}) {
  const from = {}; for (const k in to) from[k] = obj[k];
  const tw = { obj, from, to, dur, t: 0, ease: opt.ease || U.easeOut, delay: opt.delay || 0, done: opt.done, dead: false };
  AP.tweens.push(tw); return tw;
};
AP.updateTweens = function (dt) {
  for (const tw of AP.tweens) {
    if (tw.delay > 0) { tw.delay -= dt; continue; }
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    const e = tw.ease(tw.t);
    for (const k in tw.to) tw.obj[k] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
    if (tw.t >= 1) { tw.dead = true; if (tw.done) tw.done(); }
  }
  AP.tweens = AP.tweens.filter(t => !t.dead);
};

// ---------- Particles ----------
AP.particles = [];
AP.emit = function (n, fn) { for (let i = 0; i < n; i++) AP.particles.push(fn(i)); };
AP.updateParticles = function (dt) {
  for (const p of AP.particles) {
    p.life -= dt; p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.drag) { p.vx *= (1 - p.drag * dt); p.vy *= (1 - p.drag * dt); }
    if (p.rot !== undefined) p.rot += (p.vr || 0) * dt;
    if (p.onUpdate) p.onUpdate(p, dt);
  }
  AP.particles = AP.particles.filter(p => p.life > 0);
};
AP.drawParticles = function (ctx, layer) {
  for (const p of AP.particles) {
    if ((p.layer || 0) !== layer) continue;
    const a = p.fade === false ? 1 : U.clamp(p.life / p.maxLife, 0, 1);
    ctx.save(); ctx.globalAlpha = a * (p.alpha ?? 1); ctx.translate(p.x, p.y); if (p.rot) ctx.rotate(p.rot);
    if (p.draw) p.draw(ctx, p); else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
};
