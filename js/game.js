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
    go(id, arg) { G.pillRects = null;
      const old = G.scene(); if (old && old.leave) old.leave();
      G.state = id; G.arg = arg; G.modal = null; AP.poki.shown = {};
      const sc = G.scene(); if (sc && sc.enter) sc.enter(arg);
    },
    open(id, arg, o = {}) { AP.trans.run(() => G.go(id, arg), o); },
    update(dt) { G.t += dt; const sc = G.scene(); if (sc && sc.update) sc.update(dt); },
    draw(ctx, w, h) {
      const sc = G.scene(); if (sc && sc.draw) sc.draw(ctx, w, h); else AP.art.background(ctx, w, h, G.t);
      AP.drawParticles(ctx, 0);
      if (G.modal) { ctx.fillStyle = 'rgba(8,2,30,0.62)'; ctx.fillRect(0, 0, w, h); AP.ui.hit('modal_block', { x: 0, y: 0, w, h });
        // windows where the player spends coins keep the coins pill visible above the dim
        const pr = G.pillRects && G.pillRects.coins; if (pr && ['buy', 'fail', 'start'].includes(G.modal.type)) AP.art.pill(ctx, pr.x, pr.y, pr.w, pr.h, 'coins', AP.meta.get('coins'), pr.s);
        const f = AP.modals[G.modal.type]; if (f) f(ctx, w, h, G.modal); }
      AP.drawParticles(ctx, 1);
      AP.ui.drawToast(ctx, G.dt || 0.016);
    },
    // taps that hit no widget go to the scene (a modal swallows them)
    onDown(x, y) { if (G.modal) return; const sc = G.scene(); if (sc && sc.onDown) sc.onDown(x, y); },
    onMove(x, y) { if (G.modal) return; const sc = G.scene(); if (sc && sc.onMove) sc.onMove(x, y); },
    onUp(x, y) { if (G.modal) return; const sc = G.scene(); if (sc && sc.onUp) sc.onUp(x, y); },

    // ----- bottom bar of a section: a round Back button on the left, the rest of the row for the main button(s) -----
    // returns the rect left for the main button(s) (w = 0 when there is no room); back defaults to the lobby
    footBar(ctx, maxW, back) {
      const L = AP.ui.layout, s = L.s, ft = L.foot; const bh = Math.min(ft.h - 20 * s, 64 * s, L.h * 0.12), by = ft.y + (ft.h - bh) / 2;
      const w = Math.min(ft.w - 36 * s, maxW), x = ft.x + ft.w / 2 - w / 2;
      AP.ui.iconButton('foot_back', x, by, bh, (c, cx, cy, r) => AP.art.icon(c, 'back', cx - r * 0.1, cy, r * 1.2), back || (() => { AP.audio.click(); G.open('lobby'); }), '#7a2cff');
      return { x: x + bh + 12 * s, y: by, w: Math.max(0, w - bh - 12 * s), h: bh };
    },
    // ----- top bar: optional back button (left), currency pills + gear (right) -----
    // o: { back: fn, pills: ['coins','tickets'], gear: true, title: str, reserve: px }; returns the bar rect
    topBar(ctx, o = {}) {
      const L = AP.ui.layout, s = L.s, k = AP.ui.barK(), hd = L.head; const bs = 36 * s * k, y = hd.top + (hd.h - hd.top - bs) / 2; let x0 = hd.x + 10 * s, x1 = hd.x + hd.w - 10 * s;
      if (o.back) { AP.ui.iconButton('bar_back', x0, y, bs, (c, cx, cy, r) => AP.art.icon(c, 'back', cx - r * 0.1, cy, r * 1.1), o.back); x0 += bs + 8 * s; }
      if (o.gear !== false) { x1 -= bs; AP.ui.iconButton('bar_gear', x1, y, bs, (c, cx, cy, r) => AP.art.icon(c, 'gear', cx, cy, r * 1.2), () => { AP.audio.click(); G.modal = { type: 'settings' }; }); x1 -= 8 * s; }
      const pills = o.pills || ['coins', 'tickets', 'stars'];
      let ps = AP.ui.barFit(L.w, s * k, pills.length * 92 + 20, o.title ? 90 * s : 0);
      // o.reserve = half-width kept free in the centre (the hearts in a level): the pills shrink so they never reach it
      if (o.reserve && pills.length) ps = Math.min(ps, Math.max(s * 0.55, (x1 - L.w / 2 - o.reserve - 8 * s) / (pills.length * 90)));
      const pw = 84 * ps, ph = 30 * ps;
      G.pillRects = {};
      for (let i = pills.length - 1; i >= 0; i--) { x1 -= pw; const py = hd.top + (hd.h - hd.top - ph) / 2; AP.art.pill(ctx, x1, py, pw, ph, pills[i], AP.meta.get(pills[i]), ps); G.pillRects[pills[i]] = { x: x1, y: py, w: pw, h: ph, s: ps }; x1 -= 6 * s; }
      if (o.title) U.text(ctx, o.title, (x0 + x1) / 2, hd.top + (hd.h - hd.top) / 2, { size: 20 * s * Math.min(k, 1.2), color: '#fff', weight: 900, maxW: Math.max(40, x1 - x0 - 8 * s), minScale: 0.55 });
      return hd;
    },
  };

  // ----- settings: sound, music, language, version -----
  AP.addStrings({ en: { to_lobby: 'Exit to lobby' }, ru: { to_lobby: 'Выйти в лобби' }, es: { to_lobby: 'Salir al menú' }, de: { to_lobby: 'Zur Lobby' }, fr: { to_lobby: 'Retour au menu' },
    pt: { to_lobby: 'Sair para o menu' }, tr: { to_lobby: 'Lobiye dön' }, pl: { to_lobby: 'Wyjdź do lobby' }, it: { to_lobby: 'Esci alla lobby' } });
  // ----- settings: sound, music, a horizontal scrolling strip of languages, Exit to lobby (in a level), version -----
  AP.modals.settings = function (ctx, w, h, m) {
    // in a level the window also has Exit to lobby (the level has no back button): leaving counts as a fail / ends a tournament level
    const inLevel = G.state === 'level', base = inLevel ? 460 : 390; const s = AP.ui.fitS(base); const pw = Math.min(w - 32 * s, 400 * s), ph = base * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s);
    U.text(ctx, AP.t('settings'), w / 2, y + 34 * s, { size: 24 * s, color: '#fff', weight: 900, maxW: pw - 100 * s });
    AP.ui.iconButton('set_close', x + pw - 46 * s, y + 12 * s, 36 * s, (c, cx, cy, r) => AP.art.icon(c, 'close', cx, cy, r), () => { AP.audio.click(); G.modal = null; });
    const row = (i, label, on, fn) => { const ry = y + 70 * s + i * 58 * s;
      U.text(ctx, label, x + 24 * s, ry + 22 * s, { size: 18 * s, color: '#fff', align: 'left', maxW: pw * 0.5 });
      AP.ui.button('set_' + i, x + pw - 24 * s - 110 * s, ry, 110 * s, 44 * s, on, { color: fn.col || AP.art.VIOLET, size: 16 * s, onClick: fn }); };
    const sw = (k) => { const f = () => { AP.save[k] = !AP.save[k]; AP.audio.applyMute(); AP.persist(); AP.audio.click(); }; f.col = AP.save[k] ? AP.art.GREEN : '#6f6596'; return f; };
    row(0, AP.t('sounds'), AP.save.sound ? 'ON' : 'OFF', sw('sound'));
    row(1, AP.t('music'), AP.save.music ? 'ON' : 'OFF', sw('music'));
    // languages: one chip per language in a horizontal strip (swipe / wheel / arrows / scroll bar from AP.ui.grid)
    const ly = y + 70 * s + 2 * 58 * s; U.text(ctx, AP.t('language'), x + 24 * s, ly + 10 * s, { size: 18 * s, color: '#fff', align: 'left', maxW: pw - 48 * s });
    const strip = { x: x + 14 * s, y: ly + 26 * s, w: pw - 28 * s, h: 96 * s };
    AP.ui.grid('set_lang', strip, AP.LANGS, (l, cx, cy, sz) => { const on = l[0] === AP.lang, held = AP.ui.isHeld('lang_' + l[0]);
      ctx.save(); if (held) ctx.translate(0, 2 * s);
      ctx.fillStyle = on ? AP.art.PINK : 'rgba(10,2,40,0.55)'; U.rr(ctx, cx, cy, sz, sz * 0.7, 14 * s); ctx.fill(); ctx.strokeStyle = on ? '#fff' : 'rgba(190,160,255,0.55)'; ctx.lineWidth = 2 * s; ctx.stroke();
      const fw = sz * 0.5, fh = sz * 0.32; AP.art.flag(ctx, l[0], cx + sz / 2 - fw / 2, cy + sz * 0.08, fw, fh); // flag on top, the native name under it
      U.text(ctx, l[1], cx + sz / 2, cy + sz * 0.5, { size: 12 * s, color: on ? '#fff' : AP.art.INK_DIM, weight: 800, maxW: sz - 10 * s });
      ctx.restore();
      AP.ui.hit('lang_' + l[0], { x: cx, y: cy, w: sz, h: sz * 0.7 }, { onClick: () => { if (AP.lang !== l[0]) { AP.lang = l[0]; AP.persist(); AP.audio.select(); } } }); }, { horiz: true });
    if (inLevel) AP.ui.button('set_exit', x + 24 * s, y + ph - 100 * s, pw - 48 * s, 52 * s, AP.t('to_lobby'), { color: AP.art.PINK, size: 18 * s, icon: (c, ix, iy) => AP.art.icon(c, 'back', ix, iy, 9 * s),
      onClick: () => { G.modal = null; AP.game.open('lobby'); } });
    U.text(ctx, 'v' + AP.VERSION, w / 2, y + ph - 22 * s, { size: 12 * s, color: AP.art.INK_DIM, weight: 700 });
  };
})();
