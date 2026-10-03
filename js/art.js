// ---------- Procedural art: neon look (glowing gradient tubes on a deep violet night) ----------
// Every function draws in code; a PNG with the matching name in assets/images replaces it (AP.assets.draw) where noted.
const ART = AP.art = {};
(function () {
  const U = AP.util;
  // palette
  ART.BG_TOP = '#2a0b6e'; ART.BG_BOT = '#4a1bb0'; ART.INK = '#ffffff'; ART.INK_DIM = '#c9b8ff';
  ART.PANEL = '#24105e'; ART.PANEL_EDGE = '#8f6bff';
  ART.PINK = '#ff4fb8'; ART.BUY = '#3f7bff'; /* buttons that cost coins: a gold coin on blue reads well */ ART.YELLOW = '#ffc93a'; ART.VIOLET = '#9d5cff'; ART.CYAN = '#3fd8ff'; ART.GREEN = '#46e08a'; ART.RED = '#ff4d6d';
  ART.NUM = '#4a1bb0';
  // the default arrow palette (stage 1 skins swap it): tail -> head
  ART.TUBE = ['#ffb020', '#ff4fb8', '#a24bff'];
  ART.ARROWS = ['#ffb020', '#ff5ccf', '#a64dff', '#5cc8ff', '#4b6bff', '#46e08a']; // solid arrow colours (skins.js sets both)

  ART.candy = c => c; // buttons take a base color as is (kept for the Candle-style widget API)

  // ----- background: violet gradient, two soft glows, a faint dot grid, a few twinkling stars -----
  ART.background = function (ctx, w, h, t = 0) {
    if (AP.assets.draw(ctx, 'hub/bg', w / 2, h / 2, Math.max(w, h * 16 / 9), Math.max(h, w * 9 / 16))) return;
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, ART.BG_TOP); g.addColorStop(1, ART.BG_BOT);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const glow = (x, y, r, col, a) => { const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, U.rgba(col, a)); rg.addColorStop(1, U.rgba(col, 0)); ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
    const m = Math.max(w, h);
    glow(w * 0.15, h * 0.2, m * 0.45, '#ff4fb8', 0.16); glow(w * 0.9, h * 0.75, m * 0.5, '#3fd8ff', 0.12);
    const step = Math.max(18, Math.min(w, h) / 16); ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) { ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill(); }
    for (let i = 0; i < 14; i++) { const sx = ((i * 197) % 1000) / 1000 * w, sy = ((i * 331) % 1000) / 1000 * h, a = 0.25 + 0.25 * Math.sin(t * 1.7 + i * 1.3);
      ART.sparkle(ctx, sx, sy, 3 + (i % 3) * 2, U.rgba('#ffffff', Math.max(0, a))); }
  };

  ART.glow = function (ctx, x, y, r, alpha = 0.5, col = '#ff8ad8') {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, U.rgba(col, alpha)); g.addColorStop(1, U.rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };
  // four-point twinkle
  ART.sparkle = function (ctx, x, y, r, col = '#fff') {
    ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill(); ctx.restore();
  };

  // ----- glossy button body: dark lip under a gradient face, white rim, top highlight -----
  ART.candyBox = function (ctx, x, y, w, h, r, col, o = {}) {
    const lip = o.lip ?? 5, rim = o.rim ?? 2, hl = o.hl ?? 0.4;
    ctx.save();
    ctx.shadowColor = U.rgba(col, 0.55); ctx.shadowBlur = Math.min(24, h * 0.45);
    ctx.fillStyle = U.darken(col, 0.38); U.rr(ctx, x, y + lip, w, h, r); ctx.fill(); ctx.restore();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, U.lighten(col, 0.28)); g.addColorStop(0.55, col); g.addColorStop(1, U.darken(col, 0.12));
    ctx.fillStyle = g; U.rr(ctx, x, y, w, h, r); ctx.fill();
    ctx.strokeStyle = U.rgba('#ffffff', 0.75); ctx.lineWidth = rim; U.rr(ctx, x + rim / 2, y + rim / 2, w - rim, h - rim, Math.max(1, r - rim / 2)); ctx.stroke();
    ctx.fillStyle = U.rgba('#ffffff', hl * 0.6); U.rr(ctx, x + h * 0.22, y + h * 0.1, w - h * 0.44, h * 0.26, h * 0.13); ctx.fill();
  };
  ART.candyDisc = function (ctx, cx, cy, R, col, o = {}) {
    const lip = o.lip ?? R * 0.12;
    ctx.save(); ctx.shadowColor = U.rgba(col, 0.6); ctx.shadowBlur = R * 0.6;
    ctx.fillStyle = U.darken(col, 0.38); ctx.beginPath(); ctx.arc(cx, cy + lip, R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const g = ctx.createLinearGradient(0, cy - R, 0, cy + R); g.addColorStop(0, U.lighten(col, 0.3)); g.addColorStop(1, U.darken(col, 0.1));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1.5, R * 0.08); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(cx, cy - R * 0.45, R * 0.55, R * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  };
  // dark glass panel with a neon edge (popups, bars)
  ART.panel = function (ctx, x, y, w, h, r = 22, edge = ART.PANEL_EDGE, alpha = 0.92) {
    ctx.save(); ctx.shadowColor = U.rgba(edge, 0.6); ctx.shadowBlur = 18;
    ctx.fillStyle = U.rgba(ART.PANEL, alpha); U.rr(ctx, x, y, w, h, r); ctx.fill(); ctx.restore();
    ctx.strokeStyle = U.rgba(edge, 0.9); ctx.lineWidth = 2; U.rr(ctx, x + 1, y + 1, w - 2, h - 2, r); ctx.stroke();
  };
  // rounded pill with an icon and a number (currency bar)
  ART.pill = function (ctx, x, y, w, h, type, value, s) {
    ctx.fillStyle = 'rgba(15,4,45,0.55)'; U.rr(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(190,160,255,0.55)'; ctx.lineWidth = Math.max(1, 1.5 * s); U.rr(ctx, x, y, w, h, h / 2); ctx.stroke();
    ART.currency(ctx, type, x + h / 2, y + h / 2, h * 0.42);
    U.text(ctx, value, x + h + (w - h - h * 0.3) / 2, y + h / 2 + 0.5, { size: h * 0.5, color: '#fff', weight: 900, maxW: w - h * 1.4 });
  };

  // ----- neon tube along a polyline (logo now; the board renderer in stage 1 builds on the same idea) -----
  // pts: [[x,y],...]; cols: gradient from the first point to the last; head: draw an arrow head at the last point
  ART.tube = function (ctx, pts, width, cols = ART.TUBE, head = true) {
    if (pts.length < 2) return; const a = pts[0], b = pts[pts.length - 1];
    const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); cols.forEach((c, i) => g.addColorStop(i / (cols.length - 1), c));
    const path = () => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); };
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = U.rgba(cols[1] || cols[0], 0.9); ctx.shadowBlur = width * 1.6; ctx.strokeStyle = g; ctx.lineWidth = width; path(); ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = width * 0.28; path(); ctx.stroke();
    if (head) { const p = pts[pts.length - 2]; const ang = Math.atan2(b[1] - p[1], b[0] - p[0]); const L = width * 1.9;
      ctx.translate(b[0], b[1]); ctx.rotate(ang); ctx.fillStyle = cols[cols.length - 1]; ctx.shadowColor = U.rgba(cols[cols.length - 1], 0.9); ctx.shadowBlur = width * 1.4;
      ctx.beginPath(); ctx.moveTo(L * 0.9, 0); ctx.lineTo(-L * 0.25, -L * 0.62); ctx.lineTo(-L * 0.05, 0); ctx.lineTo(-L * 0.25, L * 0.62); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  };

  // ----- small icons: currency(type) and icon(name), centred at (x, y), radius r -----
  ART.currency = function (ctx, type, x, y, r) {
    if (AP.assets.draw(ctx, 'ui/cur_' + type, x, y, r * 2.2, r * 2.2)) return;
    ctx.save();
    if (type === 'coins') {
      ctx.fillStyle = '#a8620a'; ctx.beginPath(); ctx.arc(x, y + r * 0.16, r, 0, Math.PI * 2); ctx.fill(); // coin edge
      const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, '#fff3a6'); g.addColorStop(0.55, '#ffc928'); g.addColorStop(1, '#e8960f');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#c47a0c'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.beginPath(); ctx.arc(x, y, r * 0.74, 0, Math.PI * 2); ctx.stroke(); // inner rim
      U.star(ctx, x, y + r * 0.04, r * 0.46, 5, 0.48); ctx.fillStyle = '#d98a0e'; ctx.fill(); U.star(ctx, x, y - r * 0.02, r * 0.44, 5, 0.48); ctx.fillStyle = '#ffe36a'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r * 0.86, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke(); // shine
    } else if (type === 'tickets') {
      ctx.translate(x, y); ctx.rotate(-0.25); const w = r * 2, h = r * 1.3;
      ctx.fillStyle = '#ff4fb8'; U.rr(ctx, -w / 2, -h / 2, w, h, r * 0.25); ctx.fill();
      ctx.fillStyle = ART.PANEL; [-1, 1].forEach(sg => { ctx.beginPath(); ctx.arc(sg * w / 2, 0, r * 0.26, 0, Math.PI * 2); ctx.fill(); });
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.setLineDash([r * 0.18, r * 0.14]); ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.moveTo(w * 0.18, -h * 0.4); ctx.lineTo(w * 0.18, h * 0.4); ctx.stroke(); ctx.setLineDash([]);
      U.star(ctx, -w * 0.12, 0, r * 0.38); ctx.fillStyle = '#fff'; ctx.fill();
    } else if (type === 'stars') {
      ctx.shadowColor = 'rgba(255,201,58,0.8)'; ctx.shadowBlur = r * 0.6; U.star(ctx, x, y + r * 0.08, r * 1.08, 5, 0.5);
      const g = ctx.createLinearGradient(0, y - r, 0, y + r); g.addColorStop(0, '#fff2a0'); g.addColorStop(1, '#ffb400'); ctx.fillStyle = g; ctx.fill();
    } else if (type === 'arrows') {
      ART.tube(ctx, [[x - r * 0.8, y + r * 0.55], [x - r * 0.8, y - r * 0.1], [x + r * 0.35, y - r * 0.1]], r * 0.42, ART.TUBE, true);
    } else if (type === 'ad') {
      ctx.fillStyle = '#ff4fb8'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.15; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - r * 0.3, y - r * 0.45); ctx.lineTo(x + r * 0.5, y); ctx.lineTo(x - r * 0.3, y + r * 0.45); ctx.closePath(); ctx.fill();
    } else if (type === 'hearts') {
      U.heart(ctx, x, y - r * 0.85, r * 2); ctx.fillStyle = '#ff4d6d'; ctx.fill();
    }
    ctx.restore();
  };
  ART.check = function (ctx, x, y, r) {
    ctx.save(); ctx.fillStyle = ART.GREEN; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.22; ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(x - r * 0.42, y); ctx.lineTo(x - r * 0.1, y + r * 0.32); ctx.lineTo(x + r * 0.45, y - r * 0.32); ctx.stroke(); ctx.restore();
  };
  // line icons in white: gear, back, close, lock, play, room, album, skins, tasks, trophy, sound, music
  ART.icon = function (ctx, name, x, y, r, col = '#fff') {
    if (AP.assets.draw(ctx, 'ui/ic_' + name, x, y, r * 2.4, r * 2.4)) return;
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(2, r * 0.22); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const L = (pts, close) => { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(x + p[0] * r, y + p[1] * r) : ctx.moveTo(x + p[0] * r, y + p[1] * r)); if (close) ctx.closePath(); };
    switch (name) {
      case 'gear': { ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr = i % 2 ? r * 0.7 : r * 0.95; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill();
        ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x, y, r * 0.32, 0, Math.PI * 2); ctx.fill(); break; }
      case 'back': L([[0.45, -0.7], [-0.35, 0], [0.45, 0.7]]); ctx.stroke(); break;
      case 'close': L([[-0.6, -0.6], [0.6, 0.6]]); ctx.stroke(); L([[0.6, -0.6], [-0.6, 0.6]]); ctx.stroke(); break;
      case 'lock': U.rr(ctx, x - r * 0.65, y - r * 0.1, r * 1.3, r * 0.95, r * 0.2); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - r * 0.15, r * 0.42, Math.PI, 0); ctx.stroke(); break;
      case 'play': L([[-0.45, -0.7], [0.7, 0], [-0.45, 0.7]], true); ctx.fill(); break;
      case 'room': L([[-0.8, -0.05], [0, -0.8], [0.8, -0.05]]); ctx.stroke(); L([[-0.55, -0.25], [-0.55, 0.75], [0.55, 0.75], [0.55, -0.25]]); ctx.stroke(); U.heart(ctx, x, y - r * 0.08, r * 0.6); ctx.fill(); break;
      case 'album': U.rr(ctx, x - r * 0.7, y - r * 0.8, r * 1.4, r * 1.6, r * 0.18); ctx.stroke(); U.star(ctx, x, y, r * 0.38); ctx.fill(); break;
      case 'skins': ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.stroke();
        [[-0.3, -0.3, '#ff4fb8'], [0.3, -0.3, '#ffc93a'], [0.32, 0.25, '#3fd8ff'], [-0.25, 0.3, '#46e08a']].forEach(([dx, dy, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, r * 0.17, 0, Math.PI * 2); ctx.fill(); }); break;
      case 'tasks': U.rr(ctx, x - r * 0.65, y - r * 0.8, r * 1.3, r * 1.6, r * 0.15); ctx.stroke(); [-0.35, 0.05, 0.45].forEach(dy => { L([[-0.35, dy], [0.35, dy]]); ctx.stroke(); }); break;
      case 'trophy': L([[-0.55, -0.75], [0.55, -0.75], [0.45, -0.05], [0, 0.25], [-0.45, -0.05]], true); ctx.fill(); L([[0, 0.25], [0, 0.6]]); ctx.stroke(); L([[-0.4, 0.75], [0.4, 0.75]]); ctx.stroke();
        L([[-0.55, -0.6], [-0.85, -0.6], [-0.75, -0.2], [-0.45, -0.1]]); ctx.stroke(); L([[0.55, -0.6], [0.85, -0.6], [0.75, -0.2], [0.45, -0.1]]); ctx.stroke(); break;
      case 'sound': L([[-0.75, -0.25], [-0.35, -0.25], [0.1, -0.65], [0.1, 0.65], [-0.35, 0.25], [-0.75, 0.25]], true); ctx.fill(); ctx.beginPath(); ctx.arc(x + r * 0.15, y, r * 0.6, -0.8, 0.8); ctx.stroke(); break;
      case 'music': ctx.beginPath(); ctx.ellipse(x - r * 0.4, y + r * 0.5, r * 0.3, r * 0.22, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + r * 0.5, y + r * 0.35, r * 0.3, r * 0.22, -0.3, 0, Math.PI * 2); ctx.fill();
        L([[-0.12, 0.5], [-0.12, -0.6], [0.78, -0.75], [0.78, 0.35]]); ctx.stroke(); break;
      // boosters
      case 'hint': ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(x, y - r * 0.2, r * 0.62, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(x + r * 0.3, y + r * 0.45); ctx.lineTo(x - r * 0.3, y + r * 0.45); ctx.closePath(); ctx.fill();
        ctx.fillStyle = col; U.rr(ctx, x - r * 0.3, y + r * 0.52, r * 0.6, r * 0.32, r * 0.08); ctx.fill(); ctx.strokeStyle = '#fff8c8'; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.arc(x - r * 0.15, y - r * 0.3, r * 0.25, Math.PI, Math.PI * 1.5); ctx.stroke(); break;
      case 'shield': L([[0, -0.85], [0.72, -0.55], [0.62, 0.2], [0, 0.85], [-0.62, 0.2], [-0.72, -0.55]], true); ctx.fillStyle = '#3fd8ff'; ctx.fill(); ctx.strokeStyle = col; ctx.stroke();
        L([[-0.28, 0], [-0.05, 0.25], [0.32, -0.25]]); ctx.stroke(); break;
      case 'wand': ctx.lineWidth = r * 0.26; L([[-0.7, 0.7], [0.25, -0.25]]); ctx.stroke(); ctx.fillStyle = '#ffe066'; U.star(ctx, x + r * 0.42, y - r * 0.42, r * 0.48); ctx.fill();
        ART.sparkle(ctx, x - r * 0.45, y - r * 0.55, r * 0.25, '#fff'); ART.sparkle(ctx, x + r * 0.75, y + r * 0.25, r * 0.2, '#fff'); break;
      case 'heartplus': U.heart(ctx, x - r * 0.1, y - r * 0.75, r * 1.6); ctx.fillStyle = '#ff4d6d'; ctx.fill(); ctx.lineWidth = r * 0.22;
        L([[0.55, 0.2], [0.55, 0.9]]); ctx.stroke(); L([[0.2, 0.55], [0.9, 0.55]]); ctx.stroke(); break;
      case 'bolt': L([[0.15, -0.9], [-0.55, 0.12], [-0.02, 0.12], [-0.2, 0.9], [0.55, -0.15], [0.02, -0.15]], true); ctx.fillStyle = '#ffe066'; ctx.fill(); break;
      case 'eye': ctx.beginPath(); ctx.ellipse(x, y, r * 0.85, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#3fd8ff'; ctx.beginPath(); ctx.arc(x, y, r * 0.32, 0, Math.PI * 2); ctx.fill();
        ART.sparkle(ctx, x + r * 0.7, y - r * 0.65, r * 0.28, '#fff'); break;
      case 'plus': L([[-0.6, 0], [0.6, 0]]); ctx.stroke(); L([[0, -0.6], [0, 0.6]]); ctx.stroke(); break;
      default: ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };
})();
