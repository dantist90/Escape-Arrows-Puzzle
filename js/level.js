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
    // arg: {n, pre} for the Levels mode, {tour: true, k} for tournament level k (0-based) of the current run
    enter(arg) { S.tour = !!(arg && arg.tour); S.k = arg && arg.k || 0; S.n = S.tour ? AP.save.level : (arg && arg.n) || AP.save.level; S.replay = !S.tour && S.n < AP.save.level; S.pre = (arg && arg.pre) || {}; S.begin(); AP.poki.gameplayStart();
      if (S.tour) return; const g = AP.boosters.gifts(S.n); if (g.length) { S.newB = g; AP.ui.toast(AP.t('new_booster') + ' ' + g.map(id => AP.t('b_' + id)).join(', ')); } },
    leave() { S.flyCoins.forEach(f => AP.meta.add('coins', f.n)); S.flyCoins = []; if (S.tour) { if (!S.done) S.tourEnd(false); } else S.endFunnel(false); AP.poki.gameplayStop(); B().cur = null; }, // quitting mid-level = fail (no-op after an outcome)
    begin() {
      S.data = S.tour ? AP.tour.levelData(AP.tour.run().n, S.k) : AP.levelData(S.n); S.diff = S.data.diff || 'easy'; B().start(S.data);
      S.hearts = AP.CONFIG.level.hearts; S.maxHearts = S.hearts; S.done = false; S.winT = -1; S.failT = 0; S.heartPop = -1; S.combo = 0; S.comboT = 0; S.touch = null; S.pinch = null; S.tStart = AP.game.t;
      S.shield = false; S.wand = false; S.hintId = -1; S.hintT = 0; S.fire = false; S.flyCoins = S.flyCoins || []; S.fx = [];
      // pickups: seeded by the level, so a retry shows the same items (tournament levels use their own seed)
      AP.pickups.place(B().cur, S.tour ? AP.save.level : S.n, S.tour ? 5000 + AP.tour.run().n * 7 + S.k : S.n);
      // pre-level boosters apply to the first attempt only (they were paid in the start window)
      const P = S.pre || {}; if (P.heart) { S.hearts++; S.maxHearts++; } S.warm = P.warmup ? 3 : 0; S.warmT = 0.6; S.glowT = P.glow ? 10 : 0; S.pre = {};
      if (S.tour) AP.poki.measure('tournament', 'level-' + (S.k + 1), 'start'); else if (S.replay) { S.replayOpen = true; AP.poki.measure('replay', S.n, 'start'); } else AP.poki.levelStart(S.n, S.diff);
    },
    // one outcome per attempt: level/<N>/... for first attempts, replay/<N>/... for Album replays
    endFunnel(ok) { if (S.replay) { if (S.replayOpen) { S.replayOpen = false; AP.poki.measure('replay', S.n, ok ? 'complete' : 'fail'); } } else AP.poki.levelEnd(S.n, ok); },
    // tournament level over (cleared, given up or left): points, the AI players move, the breakdown window
    tourEnd(ok) {
      S.done = true; const c = AP.CONFIG.tournament, st = B().cur; const cleared = st ? st.arrows.length - st.left : 0;
      const parts = [cleared * c.arrowPoint, ok ? S.hearts * c.heartPoints : 0, ok ? Math.max(0, Math.round(c.timeBonus - (AP.game.t - S.tStart) * c.timePenalty)) : 0];
      const points = parts[0] + parts[1] + parts[2]; AP.tasks.bump('arrows', cleared); AP.tour.levelDone(points, ok); return { type: 'tourLevel', points, parts, ok };
    },
    update(dt) {
      // Poki: gameplay runs only while the board is playable (no window open, level not over)
      if (AP.game.modal || S.done) AP.poki.gameplayStop(); else if (!AP.trans.active) AP.poki.gameplayStart();
      B().update(dt, {
        onCell: (a, c) => { const it = AP.pickups.at(B().cur, c[0], c[1]); if (it) S.collect(it); },
        onHit: () => { if (S.done) return; if (S.shield) { S.shield = false; AP.audio.bump(); AP.audio.sparkle(); return; } S.hearts = Math.max(0, S.hearts - 1); S.heartPop = 0; AP.audio.bump(); AP.audio.heartLost(); S.combo = 0;
          if (S.hearts <= 0) S.failT = 0.45; },
      });
      if (S.failT > 0) { S.failT -= dt; if (S.failT <= 0 && !S.done) { AP.game.modal = { type: 'fail' }; AP.poki.gameplayStop(); } }
      // warm-up: free arrows fly away by themselves; glow: free arrows shine; hint: the shown arrow pulses
      if (S.warm > 0 && !AP.game.modal) { S.warmT -= dt; if (S.warmT <= 0) { const f = B().freeIds(); if (f.length) { B().tapArrow(U.pick(f)); AP.audio.fly(3 - S.warm); } S.warm--; S.warmT = 0.3; } }
      if (S.glowT > 0) { S.glowT -= dt; B().freeIds().forEach(id => { B().cur.arrows[id].glow = Math.max(B().cur.arrows[id].glow, 0.55); }); }
      if (S.hintId >= 0) { const a = B().cur && B().cur.arrows[S.hintId]; S.hintT -= dt; if (!a || a.state !== 'idle' || S.hintT <= 0) S.hintId = -1; else a.glow = 0.6 + 0.4 * Math.sin(AP.game.t * 8); }
      if (S.heartPop >= 0) { S.heartPop += dt; if (S.heartPop > 0.6) S.heartPop = -1; }
      S.comboT = Math.max(0, S.comboT - dt); if (!S.comboT) S.combo = 0;
      const st = B().cur;
      if (st && !S.done && st.left === 0) { S.done = true; S.winT = 0; }
      if (S.winT >= 0 && !B().busy()) { S.winT += dt; if (S.winT > 0.35 && !AP.game.modal) S.win(); }
    },
    win() {
      if (S.tour) { S.winT = -2; AP.poki.gameplayStop(); AP.audio.win(); AP.game.modal = S.tourEnd(true); return; }
      S.winT = -2; S.endFunnel(true); AP.poki.gameplayStop(); AP.audio.win();
      AP.tasks.bump('win'); AP.tasks.bump('arrows', B().cur ? B().cur.arrows.length : 0); if (S.hearts >= 3) AP.tasks.bump('stars3');
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
    // ----- pickups: a flying head crossed an item -----
    collect(it) {
      it.got = true; const st = B().cur, P = AP.board.toScreen([it.x, it.y]), c = AP.CONFIG.pickups; AP.poki.measure('pickup', it.kind, 'collect');
      if (it.kind === 'coin') { S.flyCoins.push({ x0: P[0], y0: P[1], t: 0, n: c.coinValue }); AP.audio.coin(); return; }
      AP.audio.sparkle(); S.fx.push({ kind: it.kind, x: P[0], y: P[1], t: 0, row: it.y });
      if (it.kind === 'key') { st.locked[it.lock] = false; const la = st.arrows[it.lock]; if (la) { la.glow = 1; const lp = AP.board.screenOf(it.lock); S.fx.push({ kind: 'key', x: lp[0], y: lp[1], t: 0 }); } return; }
      if (it.kind === 'heart') { S.hearts++; S.maxHearts = Math.max(S.maxHearts, S.hearts); S.heartPop = -1; }
      else if (it.kind === 'fire') S.fire = true;
      else if (it.kind === 'bomb' || it.kind === 'lightning') {
        const hitCell = it.kind === 'bomb' ? (q => Math.max(Math.abs(q[0] - it.x), Math.abs(q[1] - it.y)) <= c.bombRadius) : (q => q[1] === it.y);
        st.arrows.forEach(a => { if (a.state === 'idle' && st.alive[a.id] && a.cells.some(hitCell)) B().removeArrow(a.id); });
        st.shake = 1; AP.audio.bump();
        AP.emit(26, i => { const ang = i / 26 * Math.PI * 2, sp = U.rand(120, 260) * AP.ui.scale; return { x: P[0], y: P[1], vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, drag: 3, r: U.rand(2, 5) * AP.ui.scale, life: 0.6, maxLife: 0.6, color: it.kind === 'bomb' ? U.pick(['#ffd36a', '#ff6a2a', '#fff']) : U.pick(['#ffe14a', '#fff']), layer: 0 }; });
      }
    },
    // coins fly along an arc into the coins pill, then count (+25 floats by the pill)
    drawPickupFx(ctx, s) {
      const dt = AP.game.dt || 0.016, pr = AP.game.pillRects && AP.game.pillRects.coins, tx = pr ? pr.x + pr.h / 2 : AP.ui.w - 60, ty = pr ? pr.y + pr.h / 2 : 30;
      S.flyCoins = S.flyCoins.filter(f => { f.t += dt / 0.75; const k = U.easeIn(Math.min(1, f.t)), mx = (f.x0 + tx) / 2, my = Math.min(f.y0, ty) - 80 * s;
        const x = (1 - k) * (1 - k) * f.x0 + 2 * (1 - k) * k * mx + k * k * tx, y = (1 - k) * (1 - k) * f.y0 + 2 * (1 - k) * k * my + k * k * ty;
        if (f.t >= 1) { AP.meta.add('coins', f.n); S.fx.push({ kind: 'plus', x: tx + 30 * s, y: ty + 26 * s, t: 0, n: f.n }); AP.audio.coin(2); return false; }
        AP.art.currency(ctx, 'coins', x, y, 13 * s * (1 + 0.3 * Math.sin(k * Math.PI))); return true; });
      S.fx = S.fx.filter(f => { f.t += dt; const a = Math.max(0, 1 - f.t / 0.9);
        if (f.kind === 'plus') U.text(ctx, '+' + f.n, f.x, f.y - f.t * 30 * s, { size: 18 * s, color: AP.art.YELLOW, weight: 900, stroke: '#3a1670', strokeW: 4 * s });
        else if (f.kind === 'lightning' && B().cur && B().cur.view) { const v = B().cur.view, yy = v.oy + (f.row + 0.5) * v.c; ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = v.c * 0.5 * a; ctx.beginPath(); ctx.moveTo(v.ox, yy); ctx.lineTo(v.ox + B().cur.m.w * v.c, yy); ctx.stroke(); ctx.restore(); }
        else { ctx.save(); ctx.globalAlpha = a; AP.pickups.icon(ctx, f.kind, f.x, f.y - f.t * 40 * s, 16 * s * (1 + f.t)); ctx.restore(); }
        return f.t < 0.9; });
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
      if (S.wand) { if (AP.boosters.use('wand') && B().removeArrow(a.id)) { S.wand = false; AP.audio.sparkle(); } return; }
      const r = B().tapArrow(a.id, S.fire); if (S.fire && B().cur.arrows[a.id].fire) { S.fire = false; AP.audio.whoosh(); }
      if (r === 'locked') { AP.audio.tick(); AP.ui.toast(AP.t('need_key')); return; } // no heart lost: it just wobbles
      if (r === 'fly') { S.combo++; S.comboT = 1.2; AP.audio.fly(S.combo); }
      else if (r === 'bump') AP.audio.tick();
    },

    // ----- drawing -----
    rects() {
      const L = AP.ui.layout, s = L.s, st = L.stage, hd = L.head; const hud = { x: hd.x, y: hd.top, w: hd.w, h: hd.h - hd.top };
      // a big board gets room on the left for the zoom slider (it needs zoom when cells would be small)
      const d = S.data || { w: 1, h: 1 }, roomy = (bw, bh) => Math.min((bw - 28 * s) / d.w, (bh - 28 * s) / d.h) < 46 * s;
      if (L.portrait) { const bh = Math.max(40, L.foot.y - st.y - 4 * s), zl = roomy(st.w - 12 * s, bh) ? 44 * s : 0;
        return { hud, board: { x: st.x + 6 * s + zl, y: st.y + 4 * s, w: st.w - 12 * s - zl, h: bh }, foot: L.foot }; }
      // landscape: boosters in a column on the right, the zoom slider on the left, the board takes the whole height
      const col = 84 * s, bottom = L.h - L.safe.b - 8 * s, bh = Math.max(40, bottom - st.y - 4 * s);
      return { hud, board: { x: st.x + 56 * s, y: st.y + 4 * s, w: st.w - 56 * s - col, h: bh }, side: { x: st.x + st.w - col, y: st.y + 4 * s, w: col, h: bh } };
    },
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s; AP.art.background(ctx, w, h, AP.game.t);
      const R = S.rects(); if (B().cur) { B().fit(R.board); B().draw(ctx); }
      // a clean top: coins + gear (Exit to lobby is inside it) and the hearts in the centre — no level number, % or difficulty
      AP.game.topBar(ctx, { pills: ['coins'], reserve: (S.maxHearts * 37 + 30) * s / 2 });
      S.drawHud(ctx, R.hud, s);
      if (B().cur && B().zoomable()) S.drawZoom(ctx, R.board, s);
      S.drawBoosters(ctx, R.foot || R.side, s, !R.foot);
      S.drawPickupFx(ctx, s);
      if (S.wand) { const ty = R.board.y + 14 * s; ctx.fillStyle = 'rgba(15,4,45,0.85)'; U.rr(ctx, w / 2 - 120 * s, ty, 240 * s, 32 * s, 16 * s); ctx.fill(); U.text(ctx, AP.t('pick_arrow'), w / 2, ty + 16 * s, { size: 14 * s, color: '#fff', weight: 800, maxW: 224 * s }); }
    },
    // booster bar: hint, shield, wand (each opens the buy window when empty)
    drawBoosters(ctx, r, s, vertical) {
      const BO = AP.boosters; if (!BO.IN.some(id => BO.open(id, S.n))) return; // FTUE levels: no bar of locks yet
      const size = vertical ? Math.min(r.w - 16 * s, 64 * s, (r.h - 40 * s) / 3.6) : Math.min(r.h - 16 * s, 64 * s);
      const gap = vertical ? Math.min(24 * s, (r.h - size * 3) / 4) : Math.min(28 * s, (r.w - size * 3) / 4);
      const pos = i => vertical ? [r.x + (r.w - size) / 2, r.y + r.h / 2 - (size * 3 + gap * 2) / 2 + i * (size + gap)] : [r.x + r.w / 2 - (size * 3 + gap * 2) / 2 + i * (size + gap), r.y + (r.h - size) / 2];
      const act = { hint: () => { const f = B().freeIds(); if (!f.length || S.hintId >= 0) return; if (BO.use('hint')) { S.hintId = f[0]; S.hintT = 4; AP.audio.sparkle(); } },
        shield: () => { if (S.shield) return; if (BO.use('shield')) { S.shield = true; AP.audio.sparkle(); } },
        wand: () => { S.wand = !S.wand; AP.audio.click(); } };
      BO.IN.forEach((id, i) => BO.button(ctx, id, pos(i)[0], pos(i)[1], size, () => {
        if (S.done || B().busy() && id !== 'shield') return; if (id === 'wand' && S.wand) return act.wand();
        if (BO.count(id) <= 0) { AP.audio.click(); AP.game.modal = { type: 'buy', id }; return; } act[id](); }, { lvl: S.n, active: (id === 'shield' && S.shield) || (id === 'wand' && S.wand) }));
    },
    drawHud(ctx, r, s) {
      const cy = r.y + r.h / 2, hr = 15 * s, gap = 7 * s, n = S.maxHearts, hx0 = r.x + r.w / 2 - (n * hr * 2 + (n - 1) * gap) / 2 + hr;
      const tw = n * hr * 2 + (n - 1) * gap; AP.ui.hit('hud_hearts', { x: r.x + r.w / 2 - tw / 2 - 4 * s, y: cy - hr * 1.2, w: tw + 8 * s, h: hr * 2.4 }); // coach target
      for (let i = 0; i < n; i++) { const full = i < S.hearts; let k = 1;
        if (!full && i === S.hearts && S.heartPop >= 0) k = 1 + Math.sin(Math.min(1, S.heartPop / 0.3) * Math.PI) * 0.5;
        ctx.save(); ctx.translate(hx0 + i * (hr * 2 + gap), cy); ctx.scale(k, k); U.heart(ctx, 0, -hr * 0.85, hr * 2);
        ctx.fillStyle = full ? '#ff4d6d' : 'rgba(255,255,255,0.18)'; if (full) { ctx.shadowColor = '#ff4d6d'; ctx.shadowBlur = 8 * s; } ctx.fill(); ctx.restore(); }
      if (S.fire) AP.pickups.icon(ctx, 'fire', r.x + r.w / 2 - (n * hr * 2 + (n - 1) * gap) / 2 - hr * 1.2, cy, hr * 0.8, AP.game.t);
      if (S.shield) AP.art.icon(ctx, 'shield', hx0 + n * (hr * 2 + gap) - hr * 0.2, cy, hr * 0.9);
    },
    drawZoom(ctx, r, s) {
      const v = B().cur.view, x = r.x - 26 * s, th = Math.min(r.h * 0.55, 260 * s), y0 = r.y + r.h / 2 - th / 2, mid = [r.x + r.w / 2, r.y + r.h / 2];
      const span = Math.log(v.cMax / v.cFit) || 1, kOf = c => U.clamp(Math.log(c / v.cFit) / span, 0, 1), cOf = k => v.cFit * Math.exp(k * span);
      const id = 'zoom_slider', held = AP.ui.isHeld(id);
      if (held) { const k = U.clamp((y0 + th - AP.ui.pointer.y) / th, 0, 1); B().zoomAt(mid[0], mid[1], cOf(k) / v.c); }
      const k = kOf(v.c), ky = y0 + th - k * th;
      ctx.fillStyle = 'rgba(10,2,40,0.6)'; U.rr(ctx, x - 5 * s, y0, 10 * s, th, 5 * s); ctx.fill();
      ctx.fillStyle = U.rgba(AP.art.PINK, 0.85); U.rr(ctx, x - 5 * s, ky, 10 * s, y0 + th - ky, 5 * s); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, ky, (held ? 13 : 11) * s, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = AP.art.PINK; ctx.lineWidth = 3 * s; ctx.stroke();
      const sign = (cy, plus) => { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 7 * s, cy); ctx.lineTo(x + 7 * s, cy); if (plus) { ctx.moveTo(x, cy - 7 * s); ctx.lineTo(x, cy + 7 * s); } ctx.stroke(); };
      sign(y0 - 20 * s, true); sign(y0 + th + 20 * s, false);
      // the whole column is the slider (drag) ; taps on + / - step the zoom
      AP.ui.hit(id, { x: x - 22 * s, y: y0 - 6 * s, w: 44 * s, h: th + 12 * s });
      AP.ui.hit('zoom_in', { x: x - 20 * s, y: y0 - 40 * s, w: 40 * s, h: 34 * s }, { onClick: () => { AP.audio.click(); B().zoomAt(mid[0], mid[1], 1.5); } });
      AP.ui.hit('zoom_out', { x: x - 20 * s, y: y0 + th + 6 * s, w: 40 * s, h: 34 * s }, { onClick: () => { AP.audio.click(); B().zoomAt(mid[0], mid[1], 1 / 1.5); } });
    },
  };
  const B = () => AP.board;

  // ----- win window: stars, reward, Next -----
  AP.modals.win = function (ctx, w, h, m) {
    const s = AP.ui.fitS(380); m.t += AP.game.dt || 0.016; const pw = Math.min(w - 32 * s, 380 * s), ph = 380 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, AP.art.PINK); AP.art.mascot(ctx, w / 2, y - 14 * s, 28 * s, 'happy', AP.game.t);
    U.text(ctx, AP.t('level_done'), w / 2, y + 40 * s, { size: 26 * s, color: '#fff', weight: 900, stroke: AP.art.PINK, strokeW: 6 * s, maxW: pw - 30 * s });
    for (let i = 0; i < 3; i++) { const k = U.clamp((m.t - 0.2 - i * 0.22) / 0.3, 0, 1), on = i < m.stars; const sx = w / 2 + (i - 1) * 70 * s, sy = y + 112 * s - (i === 1 ? 12 * s : 0);
      ctx.save(); ctx.translate(sx, sy); const sc = on ? U.easeBack(k) : 1; ctx.scale(sc || 0.001, sc || 0.001);
      if (on && k > 0) AP.art.currency(ctx, 'stars', 0, 0, 30 * s); else { U.star(ctx, 0, 2 * s, 30 * s * 1.08, 5, 0.5); ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fill(); }
      ctx.restore(); if (on && k > 0 && k < 1 && !m['snd' + i]) { m['snd' + i] = 1; AP.audio.coin(i); } }
    const rw = Object.keys(m.rew).filter(k => m.rew[k] > 0); const cw = 96 * s, rx0 = w / 2 - (rw.length * cw + (rw.length - 1) * 8 * s) / 2;
    rw.forEach((k, i) => AP.art.pill(ctx, rx0 + i * (cw + 8 * s), y + 170 * s, cw, 34 * s, k, '+' + m.rew[k], s));
    const bw = pw - 48 * s;
    // x2 coins for a rewarded ad (once)
    if (!m.doubled && m.rew.coins) { AP.poki.rewardedVisible('double');
      AP.ui.button('win_double', x + pw / 2 - 70 * s, y + 210 * s, 140 * s, 36 * s, 'x2', { color: AP.art.PINK, size: 17 * s, icon: (c, ix, iy) => AP.art.currency(c, 'ad', ix, iy, 10 * s), iconRight: true,
        onClick: () => AP.poki.rewardedBreak('double').then(ok => { if (ok && !m.doubled) { m.doubled = true; AP.meta.grant({ coins: m.rew.coins }); m.rew.coins *= 2; } }) }); }
    AP.ui.button('win_next', x + 24 * s, y + ph - 116 * s, bw, 58 * s, AP.t('next'), { color: AP.art.GREEN, size: 22 * s, onClick: () => AP.playLevel(AP.save.level) });
    AP.ui.button('win_lobby', x + pw / 2 - 80 * s, y + ph - 50 * s, 160 * s, 38 * s, AP.t('lobby'), { color: AP.art.VIOLET, size: 16 * s, onClick: () => { AP.game.modal = null; AP.game.open('lobby'); } });
  };

  // ----- out of hearts: continue (coins / ad), retry, menu -----
  AP.modals.fail = function (ctx, w, h, m) {
    const s = AP.ui.fitS(360); const pw = Math.min(w - 32 * s, 380 * s), ph = 360 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2; const C = AP.CONFIG.level;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, AP.art.RED); AP.art.mascot(ctx, w / 2, y - 14 * s, 28 * s, 'oops', AP.game.t);
    U.text(ctx, AP.t('out_of_hearts'), w / 2, y + 40 * s, { size: 25 * s, color: '#fff', weight: 900, stroke: AP.art.RED, strokeW: 6 * s, maxW: pw - 30 * s });
    U.heart(ctx, w / 2, y + 66 * s, 58 * s); ctx.fillStyle = 'rgba(255,77,109,0.35)'; ctx.fill();
    U.text(ctx, AP.t('out_hint'), w / 2, y + 140 * s, { size: 14 * s, color: AP.art.INK_DIM, weight: 800, maxW: pw - 30 * s });
    const bw = pw - 48 * s, bx = x + 24 * s; const revive = () => { S.hearts = 1; AP.game.modal = null; AP.audio.sparkle(); AP.poki.gameplayStart(); };
    AP.ui.button('fail_coins', bx, y + 166 * s, bw, 52 * s, AP.t('cont') + '  ' + C.continueCoins, { color: AP.art.BUY, size: 19 * s, icon: (c, ix, iy) => AP.art.currency(c, 'coins', ix, iy, 11 * s), iconRight: true,
      onClick: () => { if (AP.meta.spend({ type: 'coins', n: C.continueCoins })) revive(); } });
    if (AP.CONFIG.ads.continueAd) { AP.poki.rewardedVisible('continue');
      AP.ui.button('fail_ad', bx, y + 228 * s, bw, 52 * s, AP.t('cont'), { color: AP.art.PINK, size: 19 * s, icon: (c, ix, iy) => AP.art.currency(c, 'ad', ix, iy, 12 * s), iconRight: true,
        onClick: () => { AP.poki.gameplayStop(); AP.poki.rewardedBreak('continue').then(ok => { if (ok) revive(); else AP.poki.gameplayStart(); }); } }); }
    if (S.tour) { AP.ui.button('fail_finish', bx, y + ph - 64 * s, bw, 44 * s, AP.t('give_up'), { color: AP.art.VIOLET, size: 16 * s, onClick: () => { AP.game.modal = S.tourEnd(false); } }); return; }
    AP.ui.button('fail_retry', bx, y + ph - 64 * s, bw / 2 - 6 * s, 44 * s, AP.t('retry'), { color: AP.art.VIOLET, size: 16 * s, onClick: () => { AP.game.modal = null; S.endFunnel(false); S.begin(); AP.poki.gameplayStart(); } });
    AP.ui.button('fail_lobby', bx + bw / 2 + 6 * s, y + ph - 64 * s, bw / 2 - 6 * s, 44 * s, AP.t('lobby'), { color: '#6f6596', size: 16 * s, onClick: () => { AP.game.modal = null; AP.game.open('lobby'); } });
  };
})();
