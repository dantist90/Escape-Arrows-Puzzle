// ---------- Immediate-mode UI + responsive layout ----------
// Widgets are function calls made every frame while drawing; each registers its hit rect (UI.hit) and main.js routes taps.
const UI = AP.ui = {
  hits: [], pressed: null, hover: null, pointer: { x: 0, y: 0, down: false }, scale: 1, layout: null, w: 0, h: 0,
  begin() { UI.floating = false; UI.hits = []; },
  // register a clickable/hold region. opts: {onClick, onDown, onUp, hold}
  hit(id, rect, opts = {}) { UI.hits.push({ id, rect, ...opts }); return UI.pressed === id; },
  find(x, y) { for (let i = UI.hits.length - 1; i >= 0; i--) if (AP.util.inRect(x, y, UI.hits[i].rect)) return UI.hits[i]; return null; },
  isHeld(id) { return UI.pointer.down && UI.pressed === id; },

  // ----- layout: portrait vs landscape -----
  // One scale factor s for everything (fonts, buttons, paddings): the short screen side / 430, clamped. 360x640 phone -> 0.84,
  // 1280x720 PC -> 1.67 (capped at 1.7). Safe areas (notch, home bar) come from CSS env() via #safe in index.html.
  // L = { portrait, s, w, h, safe:{t,r,b,l}, head (top bar), foot (bottom bar), stage (what is left between them) }.
  // barK(): top-bar controls are a bit bigger in landscape (PC / tablet screens have room, small pills read as tiny).
  barK() { const L = UI.layout; return L && !L.portrait ? (L.h >= 560 ? 1.4 : 1.2) : 1.25; },
  // shrink a right-aligned pill group (width = units * s) so it keeps clear of the centre (title / level plate)
  barFit(w, s, units, reserveHalf) { const L = UI.layout; const lim = L && !L.portrait ? w / 2 - reserveHalf - 12 : w - 24; return units * s > lim ? Math.max(s * 0.6, lim / units) : s; },
  readSafe() {
    const el = document.getElementById('safe'); if (!el) return { t: 0, r: 0, b: 0, l: 0 };
    const cs = getComputedStyle(el); const px = v => parseFloat(v) || 0;
    return { t: px(cs.paddingTop), r: px(cs.paddingRight), b: px(cs.paddingBottom), l: px(cs.paddingLeft) };
  },
  computeLayout(w, h) {
    UI.w = w; UI.h = h;
    const portrait = h >= w * 1.02;
    // landscape phones (short height) scale by height; tall portrait phones by width
    const s = AP.util.clamp(Math.min(w, h * (portrait ? 1 : 1.25)) / 430, 0.62, 1.7); UI.scale = s;
    const safe = UI.readSafe(); const bk = portrait ? 1.25 : (h >= 560 ? 1.4 : 1.2); // same as barK(), the layout is not stored yet
    const headH = safe.t + Math.max(56 * s, 36 * s * bk + 16 * s);
    const footH = safe.b + (portrait ? 118 * s : 96 * s);
    const head = { x: safe.l, y: 0, w: w - safe.l - safe.r, h: headH, top: safe.t };
    const foot = { x: safe.l, y: h - footH, w: w - safe.l - safe.r, h: footH - safe.b };
    const stage = { x: safe.l, y: headH, w: w - safe.l - safe.r, h: Math.max(10, h - headH - footH) };
    UI.layout = { portrait, s, w, h, safe, head, foot, stage };
    return UI.layout;
  },

  // ----- widgets -----
  button(id, x, y, w, h, label, opts = {}) {
    const ctx = AP.ctx; const s = UI.scale; const pressed = UI.isHeld(id);
    const col = opts.disabled ? '#6f6596' : AP.art.candy(opts.color || AP.art.PINK); const r = opts.r ? Math.min(opts.r, h * 0.42) : h * 0.36;
    const lip = Math.max(3, Math.min(h * 0.13, 7 * s)); const dy = pressed ? lip * 0.6 : 0;
    ctx.save(); ctx.translate(0, dy);
    AP.art.candyBox(ctx, x, y, w, h, r, col, { lip: lip - dy, rim: Math.max(1.5, Math.min(3 * s, h * 0.06)), hl: opts.disabled ? 0.3 : 0.42 });
    // icon + label are laid out as one centred group; the label shrinks (then ellipsizes) to fit, the icon is never covered
    const size = opts.size || 17 * s; const pad = Math.max(8 * s, h * 0.24); const iw = opts.icon ? Math.min(22 * s, h * 0.7) : 0, ig = opts.icon ? 6 * s : 0;
    const maxW = w - pad * 2 - iw - ig; label = String(label); let f = AP.util.fit(ctx, label, 800, size, maxW); let lines = [f];
    // a long multi-word label that would get small or cut: try two lines (tall enough buttons only)
    if ((f.size < size * 0.82 || f.str !== label) && label.includes(' ') && h >= 36 * s) {
      const sz2 = Math.min(size, (h - 6 * s) / 2.2); const ls = AP.util.wrapLines(ctx, label, maxW, { size: sz2, weight: 800, maxLines: 2 });
      if (ls.length === 2) { const two = ls.map(ln => AP.util.fit(ctx, ln, 800, sz2, maxW, 0.8)); if (two.every((t, i) => t.str === ls[i]) && Math.min(two[0].size, two[1].size) > f.size * 0.9) lines = two; } }
    const tw = Math.max(...lines.map(t => t.w)); const gw = iw + ig + tw; const gx = x + w / 2 - gw / 2; const lh = lines.length > 1 ? Math.max(lines[0].size, lines[1].size) * 1.02 : 0;
    const ir = !!opts.iconRight; if (opts.icon) opts.icon(ctx, ir ? gx + tw + ig + iw / 2 : gx + iw / 2, y + h / 2);
    const dk = AP.util.darken(col, 0.38); ctx.save(); ctx.shadowColor = AP.util.darken(col, 0.5); ctx.shadowOffsetY = Math.max(1, 1.5 * s);
    lines.forEach((t, i) => AP.util.text(ctx, t.str, ir ? gx + tw / 2 : gx + iw + ig + tw / 2, y + h / 2 + (i - (lines.length - 1) / 2) * lh, { size: t.size, color: '#fff', stroke: dk, strokeW: Math.max(3, t.size * 0.22) }));
    ctx.restore();
    UI.lastLabel = { id, l: ir ? gx : gx + iw + ig, r: ir ? gx + tw : gx + gw, iconL: opts.icon ? (ir ? gx + tw + ig : gx) : null, iconR: opts.icon ? (ir ? gx + gw : gx + iw) : null, size: Math.min(...lines.map(t => t.size)), str: lines.map(t => t.str).join(' / ') };
    ctx.restore();
    if (!opts.disabled) UI.hit(id, { x, y, w, h }, { onClick: opts.onClick, onDown: opts.onDown, onUp: opts.onUp });
  },
  // round button. color: '#ffffff' = dark glass disc with a neon ring (top bar); anything else = glossy colored disc
  iconButton(id, x, y, size, drawIcon, onClick, color = '#ffffff') {
    const ctx = AP.ctx; const pressed = UI.isHeld(id); const R = size / 2, cx = x + R, cy = y + R; const lip = Math.max(2, size * 0.08);
    ctx.save(); ctx.translate(0, pressed ? lip * 0.6 : 0);
    if (String(color).toLowerCase() === '#ffffff' || String(color).toLowerCase() === '#fff') {
      ctx.fillStyle = 'rgba(10,2,40,0.45)'; ctx.beginPath(); ctx.arc(cx, cy + lip, R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(52,22,130,0.92)'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(190,160,255,0.75)'; ctx.lineWidth = Math.max(1.5, size * 0.05); ctx.stroke();
    } else AP.art.candyDisc(ctx, cx, cy, R, AP.art.candy(color), { lip: pressed ? lip * 0.4 : lip });
    drawIcon(ctx, cx, cy, size * 0.28); ctx.restore();
    UI.hit(id, { x, y, w: size, h: size }, { onClick });
  },
  // scrolling item grid (album, skins, shop).
  //  portrait (mobile): big cells in 1-2 rows, horizontal scroll (swipe, arrows that hide at the ends, draggable scroll bar)
  //  landscape (PC): 3-4 columns, vertical scroll (wheel, swipe, draggable scroll bar) — the bar only shows when items overflow
  // Returns {size, cols, rows, pages, page, usedH}. State per grid lives in UI.scrolls[prefix] (reset on every step change).
  scrolls: {},
  grid(prefix, rect, items, cellDraw, opts = {}) {
    const U = AP.util; const ctx = AP.ctx; const s = UI.scale; const L = UI.layout; const portrait = L ? L.portrait : true; const horiz = opts.horiz !== undefined ? !!opts.horiz : !!(L && L.strip); const pad = 8 * s; // vertical list everywhere (mobile: 4 per row, ~2.5 rows visible)
    const sc = UI.scrolls[prefix] = UI.scrolls[prefix] || { pos: 0, target: 0 }; const n = items.length;
    let size, cols, rows, barH = 0, barW = 0, content, view; const asp = !horiz && opts.aspect ? opts.aspect : 1; /* vertical grids: cell height = size * aspect (photo tiles 4:5) */
    if (horiz) {
      barH = 20 * s; const availH = rect.h - (opts.reserveBottom || 0) - barH - pad;
      size = L && L.strip ? Math.min((rect.w - pad) / 5 - pad, availH) : U.clamp((rect.w - pad) / 3.6 - pad, 64 * s, 110 * s); // strip: 5 cells; else 3-4 visible, the next one peeks in
      rows = U.clamp(Math.floor((availH + pad) / (size + pad)), 1, 2); if (rows === 1 && availH < size) size = Math.max(52 * s, availH - pad);
      if (rows === 2 && 2 * size + pad > availH) size = (availH - pad) / 2;
      cols = Math.ceil(n / rows); content = cols * (size + pad) + pad; view = rect.w;
    } else {
      const w0 = rect.w - pad; cols = opts.cols || (portrait ? 4 : Math.max(3, Math.min(4, Math.floor(w0 / (104 * s))))); size = Math.min(opts.maxSize || 130 * s, (w0 - 14 * s) / cols - pad);
      if (portrait && !opts.cols) size = Math.min(size, (rect.h - (opts.reserveBottom || 0) - pad) / 2.5 - pad); // two and a half rows fit, the half row fades out
      rows = Math.ceil(n / cols); content = rows * (size * asp + pad) + pad; view = rect.h - (opts.reserveBottom || 0);
      if (content > view) barW = 14 * s;
    }
    const maxPos = Math.max(0, content - view); const over = maxPos > 1;
    // swipe to scroll: starts on a press inside the grid, becomes a scroll once the finger travels along the scroll axis
    const P = UI.pointer; const inR = U.inRect(P.x, P.y, { x: rect.x, y: rect.y, w: rect.w, h: view === rect.w ? rect.h : view });
    if (P.down && !sc.press && !sc.bar && inR && (!UI.pressed || UI.pressed.startsWith(prefix + '_') || sc.ids && sc.ids.has(UI.pressed))) sc.press = { x: P.x, y: P.y, pos: sc.pos, on: false, t0: performance.now(), prevPressed: UI.pressed };
    if (!P.down) { if (sc.press && sc.press.on) sc.target = U.clamp(sc.pos + (sc.vel || 0) * 6, 0, maxPos); sc.press = null; sc.bar = null; }
    if (sc.press && over) { const d = horiz ? P.x - sc.press.x : P.y - sc.press.y, o = horiz ? P.y - sc.press.y : P.x - sc.press.x;
      // drag-items lists (opts.itemDrag): a long press (>220 ms) grabs the item and locks scrolling for this touch;
      // a scroll that leaves the list (finger moves out onto the stage) turns back into carrying the item
      const held = opts.itemDrag && performance.now() - sc.press.t0 > 220;
      if (!sc.press.on && !sc.press.dead && held && Math.abs(d) <= 10 * s) sc.press.dead = true;
      if (!sc.press.on && !sc.press.dead && Math.abs(d) > 10 * s && Math.abs(d) > Math.abs(o) * 1.2) { sc.press.on = true; UI.pressed = prefix + '_scroll'; if (opts.onScrollStart) opts.onScrollStart(); }
      if (sc.press.on && opts.itemDrag && !U.inRect(P.x, P.y, { x: rect.x, y: rect.y, w: rect.w, h: horiz ? rect.h : view })) {
        sc.press.on = false; sc.press.dead = true; sc.pos = sc.target = sc.press.pos; UI.pressed = sc.press.prevPressed; if (opts.onScrollCancel) opts.onScrollCancel(); }
      if (sc.press.on) { const np = U.clamp(sc.press.pos - d, -30 * s, maxPos + 30 * s); sc.vel = np - sc.pos; sc.pos = sc.target = np; } }
    if (!(sc.press && sc.press.on) && !sc.bar) { sc.target = U.clamp(sc.target, 0, maxPos); sc.pos = U.lerp(sc.pos, sc.target, 0.25); if (Math.abs(sc.pos - sc.target) < 0.3) sc.pos = sc.target; }
    sc.rect = { x: rect.x, y: rect.y, w: rect.w, h: horiz ? rect.h : view }; sc.horiz = horiz; sc.max = maxPos; sc.step = (horiz ? size : size * asp) + pad;
    // cells (only the visible ones), clipped to the viewport; their hit rects are clipped too
    const vp = horiz ? { x: rect.x, y: rect.y, w: rect.w, h: rows * (size + pad) + pad } : { x: rect.x, y: rect.y, w: rect.w - barW, h: view };
    const gridW = horiz ? 0 : cols * (size + pad) - pad; const x0 = horiz ? rect.x + pad - sc.pos + (!over ? Math.max(0, (rect.w - content) / 2) : 0) /* fewer cells than fit: centred */ : rect.x + (rect.w - barW - gridW) / 2; const y0 = horiz ? rect.y + pad * 0.5 : rect.y + pad - sc.pos;
    const h0 = UI.hits.length; ctx.save(); ctx.beginPath(); if (horiz) ctx.rect(vp.x, vp.y - 4 * s, vp.w - 3 * s, vp.h + 8 * s); else ctx.rect(vp.x - 4 * s, vp.y, vp.w + 8 * s, vp.h); ctx.clip();
    items.forEach((it, i) => { const c = horiz ? Math.floor(i / rows) : i % cols, r = horiz ? i % rows : Math.floor(i / cols);
      const x = x0 + c * (size + pad), y = y0 + r * (size * asp + pad); if (x + size < vp.x - 2 || x > vp.x + vp.w + 2 || y + size * asp < vp.y - 2 || y > vp.y + vp.h + 2) return; cellDraw(it, x, y, size, i, size * asp); });
    ctx.restore();
    sc.ids = new Set(); for (let k = UI.hits.length - 1; k >= h0; k--) { const H = UI.hits[k]; const r = H.rect; const x1 = Math.max(r.x, vp.x), y1 = Math.max(r.y, vp.y), x2 = Math.min(r.x + r.w, vp.x + vp.w), y2 = Math.min(r.y + r.h, vp.y + vp.h);
      if (x2 - x1 < 8 * s || y2 - y1 < 8 * s) UI.hits.splice(k, 1); else { H.rect = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }; sc.ids.add(H.id); } }
    // soft fade at the scrolling edges so a cut cell reads as "more this way"
    if (over && !UI.floating) { const fade = (x, y, w, h, gx0, gy0, gx1, gy1) => { const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1); g.addColorStop(0, 'rgba(36,16,94,0.95)'); g.addColorStop(1, 'rgba(36,16,94,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); };
      const f = 16 * s; if (horiz) { if (sc.pos > 2) fade(vp.x, vp.y, f, vp.h, vp.x, 0, vp.x + f, 0); if (sc.pos < maxPos - 2) fade(vp.x + vp.w - f, vp.y, f, vp.h, vp.x + vp.w, 0, vp.x + vp.w - f, 0); }
      else { if (sc.pos > 2) fade(vp.x, vp.y, vp.w, f, 0, vp.y, 0, vp.y + f); if (sc.pos < maxPos - 2) fade(vp.x, vp.y + vp.h - f, vp.w, f, 0, vp.y + vp.h, 0, vp.y + vp.h - f); } }
    // arrows (portrait): hidden at the matching end of the list
    if (horiz && over) { const ay = vp.y + vp.h / 2; const arrow = (dir, show) => { if (!show) return; const ax = L && L.strip ? (dir < 0 ? vp.x - 20 * s : vp.x + vp.w + 20 * s) /* landscape strip: beside the row, never over a cell */ : (dir < 0 ? vp.x + 14 * s : vp.x + vp.w - 14 * s); const held = UI.isHeld(prefix + '_arr' + dir);
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(ax, ay + (held ? 1.5 * s : 0), 15 * s, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(242,122,166,0.35)'; ctx.lineWidth = 1.5 * s; ctx.stroke();
        ctx.fillStyle = '#f27aa6'; ctx.beginPath(); ctx.moveTo(ax + dir * 7 * s, ay); ctx.lineTo(ax - dir * 5 * s, ay - 9 * s); ctx.lineTo(ax - dir * 5 * s, ay + 9 * s); ctx.closePath(); ctx.fill();
        UI.hit(prefix + '_arr' + dir, { x: ax - 20 * s, y: ay - 26 * s, w: 40 * s, h: 52 * s }, { onClick: () => { sc.target = U.clamp(sc.target + dir * (size + pad) * 3, 0, maxPos); AP.audio.click(); } }); };
      arrow(-1, sc.target > 1); arrow(1, sc.target < maxPos - 1); }
    // scroll bar with a draggable thumb (tap on the track jumps there)
    if (over) { const vis = view / content; const track = horiz ? { x: rect.x + 14 * s, y: vp.y + vp.h + 4 * s, w: rect.w - 28 * s, h: 10 * s } : { x: rect.x + rect.w - 11 * s, y: rect.y + 6 * s, w: 10 * s, h: view - 12 * s };
      const len = (horiz ? track.w : track.h), tl = Math.max(28 * s, len * vis), room = len - tl; const tp = room * U.clamp(sc.pos / maxPos, 0, 1); const held = UI.isHeld(prefix + '_bar');
      if (held && sc.bar) { sc.pos = sc.target = U.clamp(sc.bar.pos + ((horiz ? P.x : P.y) - sc.bar.p0) / room * maxPos, 0, maxPos); }
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; U.rr(ctx, track.x, track.y, track.w, track.h, 5 * s); ctx.fill(); ctx.strokeStyle = 'rgba(200,160,190,0.4)'; ctx.lineWidth = 1.2 * s; ctx.stroke();
      ctx.fillStyle = held ? '#ee6f9f' : '#f48fb6'; if (horiz) U.rr(ctx, track.x + tp, track.y, tl, track.h, 5 * s); else U.rr(ctx, track.x, track.y + tp, track.w, tl, 5 * s); ctx.fill();
      const hr = horiz ? { x: track.x - 6 * s, y: track.y - 9 * s, w: track.w + 12 * s, h: track.h + 18 * s } : { x: track.x - 9 * s, y: track.y - 4 * s, w: track.w + 13 * s, h: track.h + 8 * s };
      UI.hit(prefix + '_bar', hr, { onDown: () => { const p = horiz ? P.x : P.y; const t0 = (horiz ? track.x : track.y) + tp; if (p < t0 || p > t0 + tl) sc.pos = sc.target = U.clamp((p - (horiz ? track.x : track.y) - tl / 2) / room * maxPos, 0, maxPos); sc.bar = { p0: p, pos: sc.pos }; sc.press = null; } }); }
    const usedH = horiz ? rows * (size + pad) + pad * 0.5 + (over ? barH : 0) : Math.min(view, content);
    return { size, cols, rows, pages: 1, page: 0, usedH };
  },
  // mouse wheel over a scrolling grid
  wheel(x, y, dx, dy) { for (const k in UI.scrolls) { const sc = UI.scrolls[k]; if (sc.rect && AP.util.inRect(x, y, sc.rect) && sc.max > 0) { sc.target = AP.util.clamp(sc.target + (sc.horiz ? (Math.abs(dx) > Math.abs(dy) ? dx : dy) : dy), 0, sc.max); return true; } } return false; },
  // slider: returns new value if dragged
  slider(id, x, y, w, value, min, max, opts = {}) {
    const ctx = AP.ctx; const s = UI.scale; const h = 24 * s;
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; AP.util.rr(ctx, x, y + h / 2 - 5 * s, w, 10 * s, 5 * s); ctx.fill();
    ctx.fillStyle = 'rgba(140,110,170,0.35)'; ctx.fillRect(x + w / 2 - 1, y + h / 2 - 8 * s, 2, 16 * s);
    const t = (value - min) / (max - min); const kx = x + t * w;
    ctx.fillStyle = '#ff8fb8'; ctx.beginPath(); ctx.arc(kx, y + h / 2, 11 * s, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(kx, y + h / 2, 5 * s, 0, Math.PI * 2); ctx.fill();
    if (opts.label) AP.util.text(ctx, opts.label, x + w / 2, y - 8 * s, { size: 11 * s, color: '#6b5a80' });
    UI.hit(id, { x: x - 12 * s, y: y - 6 * s, w: w + 24 * s, h: h + 12 * s }, { drag: true });
    if (UI.isHeld(id)) { const nt = AP.util.clamp((UI.pointer.x - x) / w, 0, 1); return min + nt * (max - min); }
    return value;
  },
  toast(msg) { UI.toastMsg = msg; UI.toastT = 2.2; },
  drawToast(ctx, dt) {
    const sl = UI.toastSlot; UI.toastSlot = null; if (!UI.toastT || UI.toastT <= 0) return; UI.toastT -= dt; const s = UI.scale;
    const a = Math.min(1, UI.toastT * 2); ctx.save(); ctx.globalAlpha = a;
    // inside a purchase window (toastSlot set by the window this frame): plain warning text under the picture, not a button
    if (sl) { AP.util.text(ctx, UI.toastMsg, sl.x, sl.y, { size: sl.size || 18 * s, color: '#ff4d6d', stroke: '#1a0840', strokeW: 4 * s, weight: 900, maxW: sl.w }); ctx.restore(); return; }
    // elsewhere: a flat, soft notice label (no gloss / lip, so it never reads as a button)
    const w = Math.min(UI.w - 40, 320 * s), h = 36 * s, x = UI.w / 2 - w / 2, y = UI.layout.head.h + 10 * s;
    ctx.fillStyle = 'rgba(15,4,45,0.85)'; AP.util.rr(ctx, x, y, w, h, 12 * s); ctx.fill();
    AP.util.text(ctx, UI.toastMsg, UI.w / 2, y + h / 2, { size: 14 * s, color: '#fff', weight: 800, maxW: w - 28 * s }); ctx.restore();
  },
};
