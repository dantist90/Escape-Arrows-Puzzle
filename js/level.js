// ---------- Level scene: HUD, input, win / fail ----------
// Top bar: back, "Level N" + difficulty, coins. Under it: hearts and the cleared-% bar. The board fills the rest
// (the bottom strip is kept for the booster bar of stage 3). Zoom +/- buttons appear when the board is zoomable.
// Poki: gameplayStart on enter / stop on leave; level/N/start per attempt and exactly one complete|fail.
// Running out of hearts opens the "continue" window: the attempt only fails when the player retries or leaves.
(function () {
  const U = AP.util;
  AP.addStrings({
    en: { level_done: 'Level complete!', next: 'Next', out_of_hearts: 'Out of hearts!', out_hint: 'Keep your progress and try again', cont: 'Continue', retry: 'Retry', lobby: 'Menu', cleared: 'cleared' },
    ru: { level_done: 'Уровень пройден!', next: 'Дальше', out_of_hearts: 'Сердца закончились!', out_hint: 'Сохрани прогресс и продолжай', cont: 'Продолжить', retry: 'Заново', lobby: 'Меню', cleared: 'убрано' },
    es: { level_done: '¡Nivel superado!', next: 'Siguiente', out_of_hearts: '¡Sin corazones!', out_hint: 'Conserva tu progreso y sigue', cont: 'Seguir', retry: 'Reintentar', lobby: 'Menú', cleared: 'listo' },
    de: { level_done: 'Level geschafft!', next: 'Weiter', out_of_hearts: 'Keine Herzen mehr!', out_hint: 'Behalte deinen Fortschritt', cont: 'Weiter', retry: 'Nochmal', lobby: 'Menü', cleared: 'frei' },
    fr: { level_done: 'Niveau réussi !', next: 'Suivant', out_of_hearts: 'Plus de cœurs !', out_hint: 'Garde ta progression et continue', cont: 'Continuer', retry: 'Rejouer', lobby: 'Menu', cleared: 'fait' },
    pt: { level_done: 'Nível concluído!', next: 'Próximo', out_of_hearts: 'Sem corações!', out_hint: 'Mantenha seu progresso', cont: 'Continuar', retry: 'De novo', lobby: 'Menu', cleared: 'feito' },
    tr: { level_done: 'Seviye tamam!', next: 'İleri', out_of_hearts: 'Kalp kalmadı!', out_hint: 'İlerlemeni koru ve devam et', cont: 'Devam', retry: 'Tekrar', lobby: 'Menü', cleared: 'temiz' },
    pl: { level_done: 'Poziom ukończony!', next: 'Dalej', out_of_hearts: 'Brak serc!', out_hint: 'Zachowaj postęp i graj dalej', cont: 'Kontynuuj', retry: 'Jeszcze raz', lobby: 'Menu', cleared: 'gotowe' },
    it: { level_done: 'Livello superato!', next: 'Avanti', out_of_hearts: 'Cuori finiti!', out_hint: 'Mantieni i progressi e continua', cont: 'Continua', retry: 'Riprova', lobby: 'Menu', cleared: 'fatto' },
  });

  // level n (1-based) -> data: baked levels first (levels/levels.js), then generated on the fly with the same generator
  const genCache = {};
  AP.levelData = n => { const L = AP.LEVELS; if (n <= L.length) return L[n - 1]; return genCache[n] || (genCache[n] = AP.gen.level(n)); };

  const S = AP.screens.level = {
    enter(arg) { S.n = (arg && arg.n) || AP.save.level; S.begin(); AP.poki.gameplayStart(); },
    leave() { AP.poki.levelEnd(S.n, false); AP.poki.gameplayStop(); B().cur = null; }, // quitting mid-level = fail (no-op after an outcome)
    begin() {
      S.data = AP.levelData(S.n); S.diff = S.data.diff || 'easy'; B().start(S.data);
      S.hearts = AP.CONFIG.level.hearts; S.maxHearts = S.hearts; S.done = false; S.winT = -1; S.failT = 0; S.heartPop = -1; S.combo = 0; S.comboT = 0; S.touch = null; S.pinch = null; S.tStart = AP.game.t;
      AP.poki.levelStart(S.n, S.diff);
    },
    update(dt) {
      B().update(dt, {
        onHit: () => { if (S.done) return; S.hearts = Math.max(0, S.hearts - 1); S.heartPop = 0; AP.audio.bump(); AP.audio.heartLost(); S.combo = 0;
          if (S.hearts <= 0) S.failT = 0.45; },
      });
      if (S.failT > 0) { S.failT -= dt; if (S.failT <= 0 && !S.done) { AP.game.modal = { type: 'fail' }; AP.poki.gameplayStop(); } }
      if (S.heartPop >= 0) { S.heartPop += dt; if (S.heartPop > 0.6) S.heartPop = -1; }
      S.comboT = Math.max(0, S.comboT - dt); if (!S.comboT) S.combo = 0;
      const st = B().cur;
      if (st && !S.done && st.left === 0) { S.done = true; S.winT = 0; }
      if (S.winT >= 0 && !B().busy()) { S.winT += dt; if (S.winT > 0.35 && !AP.game.modal) S.win(); }
    },
    win() {
      S.winT = -2; AP.poki.levelEnd(S.n, true); AP.poki.gameplayStop(); AP.audio.win();
      const C = AP.CONFIG.level; const stars = C.stars[U.clamp(S.hearts, 1, 3) - 1];
      const rew = { coins: C.coins[S.diff] || C.coins.easy };
      if (S.diff === 'hard' || S.diff === 'superhard') rew.tickets = C.ticketOnHard;
      if (S.n % C.chapter === 0 && S.n === AP.save.level) rew.tickets = (rew.tickets || 0) + C.ticketPerChapter;
      const first = S.n === AP.save.level; if (first) AP.save.level++;
      const best = AP.save.best; const gain = Math.max(0, stars - (best[S.n] || 0)); best[S.n] = Math.max(best[S.n] || 0, stars); rew.stars = gain;
      AP.meta.grant(rew);
      AP.game.modal = { type: 'win', stars, rew, t: 0 };
      AP.emit(60, () => ({ x: U.rand(0, AP.ui.w), y: -20, vx: U.rand(-60, 60), vy: U.rand(80, 260), g: 120, r: U.rand(3, 6) * AP.ui.scale, life: 2.2, maxLife: 2.2, color: U.pick(AP.art.TUBE.concat(['#3fd8ff', '#fff'])), layer: 1 }));
    },
    // ----- input: tap = arrow; drag = pan; pinch / wheel / buttons = zoom -----
    onDown(x, y) { S.touch = { x0: x, y0: y, x, y, drag: false }; },
    onMove(x, y) { const T = S.touch; if (!T || S.pinch) return; const s = AP.ui.scale;
      if (!T.drag && Math.hypot(x - T.x0, y - T.y0) > 10 * s && B().zoomable()) T.drag = true;
      if (T.drag) B().pan(x - T.x, y - T.y); T.x = x; T.y = y; },
    onUp(x, y) { const T = S.touch; S.touch = null; if (!T || T.drag || T.cancel || S.done || !B().cur) return; S.tap(x, y); },
    onPinchStart() { if (S.touch) S.touch.cancel = true; S.pinch = true; },
    onPinch(k, cx, cy) { B().zoomAt(cx, cy, k); },
    onPinchEnd() { S.pinch = null; },
    onWheel(x, y, dy) { B().zoomAt(x, y, Math.exp(-dy * 0.0015)); return true; },
    tap(x, y) {
      if (AP.game.modal) return; const a = B().pick(x, y); if (!a) return;
      const r = B().tapArrow(a.id);
      if (r === 'fly') { S.combo++; S.comboT = 1.2; AP.audio.fly(S.combo); }
      else if (r === 'bump') AP.audio.tick();
    },

    // ----- drawing -----
    rects() {
      const L = AP.ui.layout, s = L.s; const hudH = 44 * s; const st = L.stage;
      return { hud: { x: st.x, y: st.y, w: st.w, h: hudH }, board: { x: st.x + 6 * s, y: st.y + hudH, w: st.w - 12 * s, h: Math.max(40, L.foot.y + L.foot.h * 0.3 - st.y - hudH) } };
    },
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s; AP.art.background(ctx, w, h, AP.game.t);
      const R = S.rects(); if (B().cur) { B().fit(R.board); B().draw(ctx); }
      AP.game.topBar(ctx, { back: () => { AP.audio.click(); AP.game.open('lobby'); }, pills: ['coins'], title: AP.t('level_n', { n: S.n }) });
      S.drawHud(ctx, R.hud, s);
      if (B().cur && B().zoomable()) S.drawZoom(ctx, R.board, s);
    },
    drawHud(ctx, r, s) {
      const st = B().cur; const cy = r.y + r.h / 2;
      // difficulty chip (left), hearts (centre), progress (right)
      const dcol = { easy: AP.art.GREEN, normal: AP.art.CYAN, hard: AP.art.PINK, superhard: AP.art.RED }[S.diff];
      const label = AP.t('diff_' + S.diff); const dw = Math.min(r.w * 0.3, 120 * s), dh = 26 * s, dx = r.x + 12 * s;
      ctx.fillStyle = U.rgba(dcol, 0.25); U.rr(ctx, dx, cy - dh / 2, dw, dh, dh / 2); ctx.fill(); ctx.strokeStyle = dcol; ctx.lineWidth = 1.5 * s; ctx.stroke();
      U.text(ctx, label, dx + dw / 2, cy + 0.5, { size: 13 * s, color: '#fff', weight: 900, maxW: dw - 12 * s });
      const hr = 13 * s, gap = 6 * s, n = S.maxHearts, hx0 = r.x + r.w / 2 - (n * hr * 2 + (n - 1) * gap) / 2 + hr;
      for (let i = 0; i < n; i++) { const full = i < S.hearts; let k = 1;
        if (!full && i === S.hearts && S.heartPop >= 0) k = 1 + Math.sin(Math.min(1, S.heartPop / 0.3) * Math.PI) * 0.5;
        ctx.save(); ctx.translate(hx0 + i * (hr * 2 + gap), cy); ctx.scale(k, k); U.heart(ctx, 0, -hr * 0.85, hr * 2);
        ctx.fillStyle = full ? '#ff4d6d' : 'rgba(255,255,255,0.18)'; if (full) { ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 8 * s; } ctx.fill(); ctx.restore(); }
      if (!st) return; const total = st.arrows.length, pct = Math.round((total - st.left) / total * 100);
      const pw = Math.min(r.w * 0.28, 120 * s), ph = 10 * s, px = r.x + r.w - 12 * s - pw;
      ctx.fillStyle = 'rgba(10,2,40,0.6)'; U.rr(ctx, px, cy - ph / 2, pw, ph, ph / 2); ctx.fill();
      if (pct > 0) { const g = ctx.createLinearGradient(px, 0, px + pw, 0); AP.art.TUBE.forEach((c, i) => g.addColorStop(i / 2, c)); ctx.fillStyle = g; U.rr(ctx, px, cy - ph / 2, Math.max(ph, pw * pct / 100), ph, ph / 2); ctx.fill(); }
      U.text(ctx, pct + '%', px + pw / 2, cy - ph - 4 * s, { size: 11 * s, color: AP.art.INK_DIM, weight: 800 });
    },
    drawZoom(ctx, r, s) {
      const bs = 40 * s, x = r.x + 4 * s, y = r.y + r.h / 2 - bs - 5 * s; const v = B().cur.view;
      const plus = (c, cx, cy, rr) => { c.strokeStyle = '#fff'; c.lineWidth = rr * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - rr, cy); c.lineTo(cx + rr, cy); c.moveTo(cx, cy - rr); c.lineTo(cx, cy + rr); c.stroke(); };
      const minus = (c, cx, cy, rr) => { c.strokeStyle = '#fff'; c.lineWidth = rr * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx - rr, cy); c.lineTo(cx + rr, cy); c.stroke(); };
      const mid = [r.x + r.w / 2, r.y + r.h / 2];
      if (v.c < v.cMax - 0.5) AP.ui.iconButton('zoom_in', x, y, bs, plus, () => { AP.audio.click(); B().zoomAt(mid[0], mid[1], 1.5); });
      if (v.c > v.cFit + 0.5) AP.ui.iconButton('zoom_out', x, y + bs + 10 * s, bs, minus, () => { AP.audio.click(); B().zoomAt(mid[0], mid[1], 1 / 1.5); });
    },
  };
  const B = () => AP.board;

  // ----- win window: stars, reward, Next -----
  AP.modals.win = function (ctx, w, h, m) {
    const s = AP.ui.layout.s; m.t += AP.game.dt || 0.016; const pw = Math.min(w - 32 * s, 380 * s), ph = 330 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, AP.art.PINK);
    U.text(ctx, AP.t('level_done'), w / 2, y + 40 * s, { size: 26 * s, color: '#fff', weight: 900, stroke: AP.art.PINK, strokeW: 6 * s, maxW: pw - 30 * s });
    for (let i = 0; i < 3; i++) { const k = U.clamp((m.t - 0.2 - i * 0.22) / 0.3, 0, 1), on = i < m.stars; const sx = w / 2 + (i - 1) * 70 * s, sy = y + 112 * s - (i === 1 ? 12 * s : 0);
      ctx.save(); ctx.translate(sx, sy); const sc = on ? U.easeBack(k) : 1; ctx.scale(sc || 0.001, sc || 0.001);
      if (on && k > 0) AP.art.currency(ctx, 'stars', 0, 0, 30 * s); else { U.star(ctx, 0, 2 * s, 30 * s * 1.08, 5, 0.5); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill(); }
      ctx.restore(); if (on && k > 0 && k < 1 && !m['snd' + i]) { m['snd' + i] = 1; AP.audio.coin(i); } }
    const rw = Object.keys(m.rew).filter(k => m.rew[k] > 0); const cw = 96 * s, rx0 = w / 2 - (rw.length * cw + (rw.length - 1) * 8 * s) / 2;
    rw.forEach((k, i) => AP.art.pill(ctx, rx0 + i * (cw + 8 * s), y + 170 * s, cw, 34 * s, k, '+' + m.rew[k], s));
    const bw = pw - 48 * s;
    AP.ui.button('win_next', x + 24 * s, y + ph - 116 * s, bw, 58 * s, AP.t('next'), { color: AP.art.GREEN, size: 22 * s, onClick: () => {
      AP.game.modal = null; const n = AP.save.level; AP.game.open('level', { n }, { ad: n >= AP.CONFIG.level.adFromLevel }); } });
    AP.ui.button('win_lobby', x + pw / 2 - 80 * s, y + ph - 50 * s, 160 * s, 38 * s, AP.t('lobby'), { color: AP.art.VIOLET, size: 16 * s, onClick: () => { AP.game.modal = null; AP.game.open('lobby'); } });
  };

  // ----- out of hearts: continue (coins / ad), retry, menu -----
  AP.modals.fail = function (ctx, w, h, m) {
    const s = AP.ui.layout.s; const pw = Math.min(w - 32 * s, 380 * s), ph = 360 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2; const C = AP.CONFIG.level;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, AP.art.RED);
    U.text(ctx, AP.t('out_of_hearts'), w / 2, y + 40 * s, { size: 25 * s, color: '#fff', weight: 900, stroke: AP.art.RED, strokeW: 6 * s, maxW: pw - 30 * s });
    U.heart(ctx, w / 2, y + 66 * s, 58 * s); ctx.fillStyle = 'rgba(255,77,109,0.35)'; ctx.fill();
    U.text(ctx, AP.t('out_hint'), w / 2, y + 140 * s, { size: 14 * s, color: AP.art.INK_DIM, weight: 800, maxW: pw - 30 * s });
    const bw = pw - 48 * s, bx = x + 24 * s; const revive = () => { S.hearts = 1; AP.game.modal = null; AP.audio.sparkle(); AP.poki.gameplayStart(); };
    AP.ui.button('fail_coins', bx, y + 166 * s, bw, 52 * s, AP.t('cont') + '  ' + C.continueCoins, { color: AP.art.YELLOW, size: 19 * s, icon: (c, ix, iy) => AP.art.currency(c, 'coins', ix, iy, 11 * s), iconRight: true,
      onClick: () => { if (AP.meta.spend({ type: 'coins', n: C.continueCoins })) revive(); } });
    if (AP.CONFIG.ads.continueAd) { AP.poki.rewardedVisible('continue');
      AP.ui.button('fail_ad', bx, y + 228 * s, bw, 52 * s, AP.t('cont'), { color: AP.art.PINK, size: 19 * s, icon: (c, ix, iy) => AP.art.currency(c, 'ad', ix, iy, 12 * s), iconRight: true,
        onClick: () => { AP.poki.gameplayStop(); AP.poki.rewardedBreak('continue').then(ok => { if (ok) revive(); else AP.poki.gameplayStart(); }); } }); }
    AP.ui.button('fail_retry', bx, y + ph - 64 * s, bw / 2 - 6 * s, 44 * s, AP.t('retry'), { color: AP.art.VIOLET, size: 16 * s, onClick: () => { AP.game.modal = null; AP.poki.levelEnd(S.n, false); S.begin(); AP.poki.gameplayStart(); } });
    AP.ui.button('fail_lobby', bx + bw / 2 + 6 * s, y + ph - 64 * s, bw / 2 - 6 * s, 44 * s, AP.t('lobby'), { color: '#6f6596', size: 16 * s, onClick: () => { AP.game.modal = null; AP.game.open('lobby'); } });
  };
})();
