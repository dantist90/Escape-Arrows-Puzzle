// ---------- Lobby ----------
// Top: currency bar + Roadmap strip (arrows earned in tournaments, js/roadmap.js). Sides: Room, Album (left), Skins, Tasks (right) — stage 6.
// Bottom: two big buttons — "Level N" (Levels mode) and "Tournament" (locked until AP.CONFIG.tournament.unlockLevel).
(function () {
  const U = AP.util;
  const SIDE = [['room', 'room'], ['album', 'album'], ['skins', 'skins'], ['tasks', 'tasks']];
  const unlocked = lvl => AP.CONFIG.debug.unlockAll || AP.save.level >= lvl;

  AP.screens.lobby = {
    enter() { AP.poki.gameplayStop(); this.seen = {};
      // the tournament just opened: a free ticket (once); the coach tip points at the button
      if (AP.tour.open() && !AP.save.seen.tour_gift) { AP.save.seen.tour_gift = 1; AP.meta.add('tickets', AP.CONFIG.tournament.freeTicketOnUnlock); } },
    // button/<id>/visible once per lobby visit, button/<id>/interact on tap
    vis(id) { if (this.seen[id]) return; this.seen[id] = 1; AP.poki.measure('button', id, 'visible'); },
    tap(id) { AP.poki.measure('button', id, 'interact'); AP.audio.click(); },
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s, t = AP.game.t; AP.art.background(ctx, w, h, t);
      AP.game.topBar(ctx, { pills: ['coins', 'tickets', 'stars'] });
      // ----- Roadmap strip under the bar -----
      const st = L.stage, rmH = 58 * s, rmW = Math.min(st.w - 24 * s, 560 * s), rx = st.x + st.w / 2 - rmW / 2, ry = st.y + 6 * s;
      AP.roadmap.strip(ctx, rx, ry, rmW, rmH, s, t, () => { this.tap('roadmap'); AP.game.modal = { type: 'roadmap' }; }); this.vis('roadmap');
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
      const ft = L.foot, bh = Math.min(ft.h - 20 * s, 72 * s, h * 0.12), by = ft.y + (ft.h - bh) / 2, maxW = Math.min(ft.w - 36 * s, 620 * s), bw = (maxW - 12 * s) / 2, bx = ft.x + ft.w / 2 - maxW / 2;
      AP.ui.button('play', bx, by, bw, bh, AP.t('level_n', { n: AP.save.level }), { color: AP.art.PINK, size: Math.min(22 * s, bh * 0.36), icon: (c, x, y) => AP.art.icon(c, 'play', x, y, 10 * s),
        onClick: () => { this.tap('play'); AP.playLevel(AP.save.level); } });
      this.vis('play');
      const tl = AP.CONFIG.tournament.unlockLevel, open = unlocked(tl);
      AP.ui.button('tour', bx + bw + 12 * s, by, bw, bh, AP.t('tournament'), { color: open ? AP.art.YELLOW : '#6f6596', size: Math.min(20 * s, bh * 0.33),
        icon: (c, x, y) => AP.art.icon(c, open ? 'trophy' : 'lock', x, y, 10 * s),
        onClick: () => { this.tap('tournament'); if (open) AP.game.open('tour'); else { AP.audio.bump(); AP.ui.toast(AP.t('unlock_at', { n: tl })); } } });
      if (open && AP.tour.run()) { const bx2 = bx + bw * 2 + 12 * s - 8 * s, by2 = by + 8 * s; ctx.fillStyle = AP.art.PINK; ctx.beginPath(); ctx.arc(bx2, by2, 10 * s, 0, Math.PI * 2); ctx.fill(); U.text(ctx, '!', bx2, by2 + 0.5, { size: 13 * s, color: '#fff', weight: 900 }); }
      this.vis('tournament');
    },
  };
})();
