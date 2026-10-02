// ---------- Level scene (STAGE 0 PLACEHOLDER) ----------
// Stage 1 replaces this file with the real board: arrows, taps, flying, bumping, hearts, zoom/pan.
// What it already does right (keep it when rewriting): Poki gameplayStart on enter, gameplayStop on leave,
// level/<N>/start on enter and exactly one level/<N>/complete|fail per attempt, back to the lobby behind the transition.
(function () {
  const U = AP.util;
  AP.screens.level = {
    enter(arg) { this.n = (arg && arg.n) || AP.save.level; this.done = false; AP.poki.levelStart(this.n, 'easy'); AP.poki.gameplayStart(); },
    leave() { AP.poki.levelEnd(this.n, false); AP.poki.gameplayStop(); }, // quitting mid-level counts as a fail (no-op after an outcome)
    finish(ok) {
      if (this.done) return; this.done = true; AP.poki.levelEnd(this.n, ok);
      if (ok) { AP.audio.win(); if (this.n === AP.save.level) AP.save.level++; AP.meta.grant({ coins: AP.CONFIG.level.coins.easy }); }
      else AP.audio.lose();
      AP.game.open('lobby');
    },
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s, st = L.stage; AP.art.background(ctx, w, h, AP.game.t);
      AP.game.topBar(ctx, { back: () => { AP.audio.click(); AP.game.open('lobby'); }, pills: ['coins'], title: AP.t('level_n', { n: this.n }) });
      // demo tubes, so the neon look can be judged before stage 1
      const c = Math.min(st.w, st.h) / 8, ox = st.x + st.w / 2, oy = st.y + st.h / 2;
      AP.art.tube(ctx, [[ox - 2 * c, oy + 2 * c], [ox - 2 * c, oy - c], [ox - c, oy - c], [ox - c, oy - 2.5 * c]], c * 0.32);
      AP.art.tube(ctx, [[ox + 2 * c, oy - 2 * c], [ox, oy - 2 * c], [ox, oy + c], [ox + 2.5 * c, oy + c]], c * 0.32, ['#3fd8ff', '#9d5cff', '#ff4fb8']);
      AP.art.tube(ctx, [[ox - c, oy + 2.4 * c], [ox + 1.5 * c, oy + 2.4 * c], [ox + 1.5 * c, oy + 1.8 * c]], c * 0.32, ['#46e08a', '#ffc93a', '#ff4fb8']);
      const ft = L.foot, bh = Math.min(ft.h - 20 * s, 60 * s), bw = Math.min((ft.w - 48 * s) / 2, 220 * s), by = ft.y + (ft.h - bh) / 2;
      AP.ui.button('stub_win', w / 2 - bw - 6 * s, by, bw, bh, 'WIN (stub)', { color: AP.art.GREEN, onClick: () => this.finish(true) });
      AP.ui.button('stub_fail', w / 2 + 6 * s, by, bw, bh, 'FAIL (stub)', { color: AP.art.RED, onClick: () => this.finish(false) });
      U.text(ctx, 'Stage 0 placeholder — the board comes in stage 1', w / 2, st.y + 16 * s, { size: 12 * s, color: AP.art.INK_DIM, weight: 700, maxW: st.w - 20 * s });
    },
  };
})();
