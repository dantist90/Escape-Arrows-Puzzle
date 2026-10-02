// ---------- Lobby ----------
// Top: currency bar + Roadmap strip (arrows earned in tournaments; stage 5). Sides: Room, Album (left), Skins, Tasks (right) — stage 6.
// Bottom: two big buttons — "Level N" (Levels mode) and "Tournament" (locked until AP.CONFIG.tournament.unlockLevel).
(function () {
  const U = AP.util;
  const SIDE = [['room', 'room'], ['album', 'album'], ['skins', 'skins'], ['tasks', 'tasks']];
  const unlocked = lvl => AP.CONFIG.debug.unlockAll || AP.save.level >= lvl;

  AP.screens.lobby = {
    enter() { AP.poki.gameplayStop(); this.seen = {}; },
    // button/<id>/visible once per lobby visit, button/<id>/interact on tap
    vis(id) { if (this.seen[id]) return; this.seen[id] = 1; AP.poki.measure('button', id, 'visible'); },
    tap(id) { AP.poki.measure('button', id, 'interact'); AP.audio.click(); },
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s, t = AP.game.t; AP.art.background(ctx, w, h, t);
      AP.game.topBar(ctx, { pills: ['coins', 'tickets', 'stars'] });
      // ----- Roadmap strip under the bar -----
      const st = L.stage, rmH = 58 * s, rmW = Math.min(st.w - 24 * s, 560 * s), rx = st.x + st.w / 2 - rmW / 2, ry = st.y + 6 * s;
      this.roadmap(ctx, rx, ry, rmW, rmH, s, t);
      // ----- centre: level badge -----
      const sideW = 64 * s, cy = (ry + rmH + L.foot.y) / 2;
      const badgeR = Math.min(st.h * 0.3, (st.w - sideW * 2 - 40 * s) / 2, 110 * s);
      AP.art.glow(ctx, w / 2, cy, badgeR * 1.8, 0.35, AP.art.PINK);
      AP.art.candyDisc(ctx, w / 2, cy, badgeR, '#7a2cff', { lip: badgeR * 0.08 });
      U.text(ctx, AP.t('level'), w / 2, cy - badgeR * 0.32, { size: badgeR * 0.22, color: '#fff', weight: 800, maxW: badgeR * 1.5 });
      U.text(ctx, AP.save.level, w / 2, cy + badgeR * 0.14, { size: badgeR * 0.62, color: '#fff', weight: 900, stroke: AP.art.PINK, strokeW: badgeR * 0.06, maxW: badgeR * 1.6 });
      // ----- side icons -----
      const ib = 54 * s, gap = 16 * s, colH = ib * 2 + gap + 22 * s;
      SIDE.forEach(([id, ic], i) => {
        const left = i < 2, x = left ? st.x + 12 * s : st.x + st.w - 12 * s - ib, y = cy - colH / 2 + (i % 2) * (ib + gap + 11 * s);
        AP.ui.iconButton('side_' + id, x, y, ib, (c, cx, cy2, r) => AP.art.icon(c, ic, cx, cy2, r * 1.3), () => { this.tap(id); AP.ui.toast(AP.t('soon')); }, ['#ff4fb8', '#3fd8ff', '#ffc93a', '#46e08a'][i]);
        U.text(ctx, AP.t(id), x + ib / 2, y + ib + 10 * s, { size: 12 * s, color: '#fff', weight: 800, maxW: ib + 14 * s });
        this.vis(id);
      });
      // ----- bottom buttons -----
      const ft = L.foot, bh = Math.min(ft.h - 20 * s, 72 * s), by = ft.y + (ft.h - bh) / 2, maxW = Math.min(ft.w - 36 * s, 620 * s), bw = (maxW - 12 * s) / 2, bx = ft.x + ft.w / 2 - maxW / 2;
      AP.ui.button('play', bx, by, bw, bh, AP.t('level_n', { n: AP.save.level }), { color: AP.art.PINK, size: 22 * s, icon: (c, x, y) => AP.art.icon(c, 'play', x, y, 10 * s),
        onClick: () => { this.tap('play'); AP.game.open('level', { n: AP.save.level }, { ad: AP.save.level >= AP.CONFIG.level.adFromLevel }); } });
      this.vis('play');
      const tl = AP.CONFIG.tournament.unlockLevel, open = unlocked(tl);
      AP.ui.button('tour', bx + bw + 12 * s, by, bw, bh, AP.t('tournament'), { color: open ? AP.art.YELLOW : '#6f6596', size: 20 * s,
        icon: (c, x, y) => AP.art.icon(c, open ? 'trophy' : 'lock', x, y, 10 * s),
        onClick: () => { this.tap('tournament'); AP.ui.toast(open ? AP.t('soon') : AP.t('unlock_at', { n: tl })); } });
      this.vis('tournament');
    },
    // Roadmap: arrows counter, a track with milestone gifts (placeholder values until stage 5)
    roadmap(ctx, x, y, w, h, s, t) {
      AP.art.panel(ctx, x, y, w, h, h / 2.4);
      AP.art.currency(ctx, 'arrows', x + h * 0.55, y + h / 2, h * 0.3);
      U.text(ctx, AP.t('roadmap'), x + h * 1.05, y + h * 0.3, { size: 12 * s, color: AP.art.INK_DIM, weight: 800, align: 'left', maxW: w * 0.3 });
      U.text(ctx, AP.meta.get('arrows'), x + h * 1.05, y + h * 0.66, { size: 18 * s, color: '#fff', weight: 900, align: 'left' });
      const tx = x + h * 1.05 + 70 * s, tw = x + w - h * 0.5 - tx, ty = y + h / 2; if (tw < 40 * s) return;
      ctx.fillStyle = 'rgba(10,2,40,0.6)'; U.rr(ctx, tx, ty - 5 * s, tw, 10 * s, 5 * s); ctx.fill();
      const goal = 100, k = U.clamp(AP.meta.get('arrows') / goal, 0, 1);
      if (k > 0) { const g = ctx.createLinearGradient(tx, 0, tx + tw, 0); AP.art.TUBE.forEach((c, i) => g.addColorStop(i / 2, c)); ctx.fillStyle = g; U.rr(ctx, tx, ty - 5 * s, Math.max(10 * s, tw * k), 10 * s, 5 * s); ctx.fill(); }
      [0.25, 0.5, 0.75, 1].forEach((p, i) => { const gx = tx + tw * p - (p === 1 ? 10 * s : 0), bob = Math.sin(t * 3 + i) * 1.5 * s;
        AP.art.candyDisc(ctx, gx, ty + bob, 13 * s, k >= p ? AP.art.GREEN : '#5a3bb0', { lip: 2 * s }); AP.art.sparkle(ctx, gx, ty + bob, 6 * s, '#fff'); });
      AP.ui.hit('roadmap', { x, y, w, h }, { onClick: () => { this.tap('roadmap'); AP.ui.toast(AP.t('soon')); } });
      this.vis('roadmap');
    },
  };
})();
