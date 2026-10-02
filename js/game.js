// ---------- Scene manager, top bar, settings window ----------
// A scene registers itself as AP.screens.<id> = { enter(arg), leave(), update(dt), draw(ctx, w, h), onDown(x, y), onMove(x, y), onUp(x, y) }.
// AP.game.go(id, arg) switches instantly; AP.game.open(id, arg, {ad}) switches behind the transition (and an interstitial if ad).
// One modal at a time: AP.game.modal = { type, ... }; modal drawers register in AP.modals[type](ctx, w, h, modal).
(function () {
  const U = AP.util;
  AP.modals = {};
  const G = AP.game = {
    t: 0, state: null, arg: null, modal: null,
    scene() { return AP.screens[G.state] || null; },
    go(id, arg) {
      const old = G.scene(); if (old && old.leave) old.leave();
      G.state = id; G.arg = arg; G.modal = null; AP.poki.shown = {};
      const sc = G.scene(); if (sc && sc.enter) sc.enter(arg);
    },
    open(id, arg, o = {}) { AP.trans.run(() => G.go(id, arg), o); },
    update(dt) { G.t += dt; const sc = G.scene(); if (sc && sc.update) sc.update(dt); },
    draw(ctx, w, h) {
      const sc = G.scene(); if (sc && sc.draw) sc.draw(ctx, w, h); else AP.art.background(ctx, w, h, G.t);
      AP.drawParticles(ctx, 0);
      if (G.modal) { ctx.fillStyle = 'rgba(8,2,30,0.62)'; ctx.fillRect(0, 0, w, h); AP.ui.hit('modal_block', { x: 0, y: 0, w, h }); const f = AP.modals[G.modal.type]; if (f) f(ctx, w, h, G.modal); }
      AP.drawParticles(ctx, 1);
      AP.ui.drawToast(ctx, G.dt || 0.016);
    },
    // taps that hit no widget go to the scene (a modal swallows them)
    onDown(x, y) { if (G.modal) return; const sc = G.scene(); if (sc && sc.onDown) sc.onDown(x, y); },
    onMove(x, y) { if (G.modal) return; const sc = G.scene(); if (sc && sc.onMove) sc.onMove(x, y); },
    onUp(x, y) { if (G.modal) return; const sc = G.scene(); if (sc && sc.onUp) sc.onUp(x, y); },

    // ----- top bar: optional back button (left), currency pills + gear (right) -----
    // o: { back: fn, pills: ['coins','tickets'], gear: true, title: str }; returns the bar rect
    topBar(ctx, o = {}) {
      const L = AP.ui.layout, s = L.s, k = AP.ui.barK(), hd = L.head; const bs = 36 * s * k, y = hd.top + (hd.h - hd.top - bs) / 2; let x0 = hd.x + 10 * s, x1 = hd.x + hd.w - 10 * s;
      if (o.back) { AP.ui.iconButton('bar_back', x0, y, bs, (c, cx, cy, r) => AP.art.icon(c, 'back', cx - r * 0.1, cy, r * 1.1), o.back); x0 += bs + 8 * s; }
      if (o.gear !== false) { x1 -= bs; AP.ui.iconButton('bar_gear', x1, y, bs, (c, cx, cy, r) => AP.art.icon(c, 'gear', cx, cy, r * 1.2), () => { AP.audio.click(); G.modal = { type: 'settings' }; }); x1 -= 8 * s; }
      const pills = o.pills || ['coins', 'tickets', 'stars'];
      const ps = AP.ui.barFit(L.w, s * k, pills.length * 92 + 20, o.title ? 90 * s : 0); const pw = 84 * ps, ph = 30 * ps;
      for (let i = pills.length - 1; i >= 0; i--) { x1 -= pw; AP.art.pill(ctx, x1, hd.top + (hd.h - hd.top - ph) / 2, pw, ph, pills[i], AP.meta.get(pills[i]), ps); x1 -= 6 * s; }
      if (o.title) U.text(ctx, o.title, (x0 + x1) / 2, hd.top + (hd.h - hd.top) / 2, { size: 20 * s * Math.min(k, 1.2), color: '#fff', weight: 900, maxW: Math.max(40, x1 - x0 - 8 * s) });
      return hd;
    },
  };

  // ----- settings: sound, music, language, version -----
  AP.modals.settings = function (ctx, w, h, m) {
    const s = AP.ui.fitS(330); const pw = Math.min(w - 32 * s, 380 * s), ph = 330 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s);
    U.text(ctx, AP.t('settings'), w / 2, y + 34 * s, { size: 24 * s, color: '#fff', weight: 900, maxW: pw - 100 * s });
    AP.ui.iconButton('set_close', x + pw - 46 * s, y + 12 * s, 36 * s, (c, cx, cy, r) => AP.art.icon(c, 'close', cx, cy, r), () => { AP.audio.click(); G.modal = null; });
    const row = (i, label, on, fn) => { const ry = y + 76 * s + i * 58 * s;
      U.text(ctx, label, x + 24 * s, ry + 22 * s, { size: 18 * s, color: '#fff', align: 'left', maxW: pw * 0.5 });
      AP.ui.button('set_' + i, x + pw - 24 * s - 110 * s, ry, 110 * s, 44 * s, on, { color: fn.col || AP.art.VIOLET, size: 16 * s, onClick: fn }); };
    const sw = (k) => { const f = () => { AP.save[k] = !AP.save[k]; AP.audio.applyMute(); AP.persist(); AP.audio.click(); }; f.col = AP.save[k] ? AP.art.GREEN : '#6f6596'; return f; };
    row(0, AP.t('sounds'), AP.save.sound ? 'ON' : 'OFF', sw('sound'));
    row(1, AP.t('music'), AP.save.music ? 'ON' : 'OFF', sw('music'));
    const li = AP.LANGS.findIndex(l => l[0] === AP.lang);
    row(2, AP.t('language'), AP.LANGS[li][1], () => { AP.lang = AP.LANGS[(li + 1) % AP.LANGS.length][0]; AP.persist(); AP.audio.click(); });
    U.text(ctx, 'v' + AP.VERSION, w / 2, y + ph - 22 * s, { size: 12 * s, color: AP.art.INK_DIM, weight: 700 });
  };
})();
