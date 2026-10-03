// ---------- Lobby ----------
// Top: currency bar (+ Roadmap strip when CONFIG.features.roadmap). Sides: Room (left, when features.room), Skins, Tasks (right).
// Bottom: Album + "Level N" on the right; the Tournament button joins them when features.tournament is on.
(function () {
  const U = AP.util;
  const F = () => AP.CONFIG.features;
  const unlocked = lvl => AP.CONFIG.debug.unlockAll || AP.save.level >= lvl;

  AP.screens.lobby = {
    enter() { AP.poki.gameplayStop(); this.seen = {};
      // the tournament just opened: a free ticket (once); the coach tip points at the button
      if (F().tournament && AP.tour.open() && !AP.save.seen.tour_gift) { AP.save.seen.tour_gift = 1; AP.meta.add('tickets', AP.CONFIG.tournament.freeTicketOnUnlock); } },
    // button/<id>/visible once per lobby visit, button/<id>/interact on tap
    vis(id) { if (this.seen[id]) return; this.seen[id] = 1; AP.poki.measure('button', id, 'visible'); },
    tap(id) { AP.poki.measure('button', id, 'interact'); AP.audio.click(); },
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s, t = AP.game.t, f = F(); AP.art.background(ctx, w, h, t);
      AP.game.topBar(ctx, { pills: ['coins'].concat(f.tickets ? ['tickets'] : [], f.stars ? ['stars'] : []) });
      const st = L.stage; let top = st.y;
      // ----- Roadmap strip under the bar -----
      if (f.roadmap) { const rmH = 58 * s, rmW = Math.min(st.w - 24 * s, 560 * s), rx = st.x + st.w / 2 - rmW / 2, ry = st.y + 6 * s;
        AP.roadmap.strip(ctx, rx, ry, rmW, rmH, s, t, () => { this.tap('roadmap'); AP.game.modal = { type: 'roadmap' }; }); this.vis('roadmap'); top = ry + rmH; }
      // ----- centre: level badge -----
      const sideW = 64 * s, cy = (top + L.foot.y) / 2;
      const badgeR = Math.min(st.h * 0.3, (st.w - sideW * 2 - 40 * s) / 2, 110 * s);
      AP.art.glow(ctx, w / 2, cy, badgeR * 1.8, 0.35, AP.art.PINK);
      AP.art.candyDisc(ctx, w / 2, cy, badgeR, '#7a2cff', { lip: badgeR * 0.08 });
      U.text(ctx, AP.t('level'), w / 2, cy - badgeR * 0.32, { size: badgeR * 0.22, color: '#fff', weight: 800, maxW: badgeR * 1.5 });
      U.text(ctx, AP.save.level, w / 2, cy + badgeR * 0.14, { size: badgeR * 0.62, color: '#fff', weight: 900, stroke: AP.art.PINK, strokeW: badgeR * 0.06, maxW: badgeR * 1.6 });
      // ----- side icons: left column (Room), right column (Skins, Tasks) -----
      const ib = 54 * s, gap = 16 * s; const cols = [f.room ? [['room', '#ff4fb8']] : [], [['skins', '#ffc93a'], ['tasks', '#46e08a']]];
      cols.forEach((list, side) => { const colH = list.length * (ib + 22 * s) + (list.length - 1) * gap;
        list.forEach(([id, col], i) => { const x = side === 0 ? st.x + 12 * s : st.x + st.w - 12 * s - ib, y = cy - colH / 2 + i * (ib + gap + 22 * s);
          AP.ui.iconButton('side_' + id, x, y, ib, (c, cx, cy2, r) => AP.art.icon(c, id, cx, cy2, r * 1.3), () => { this.tap(id); if (id === 'tasks') AP.game.modal = { type: 'tasks' }; else AP.game.open(id); }, col);
          // a dot when something is waiting there: a decor piece is affordable, a task reward can be claimed
          if ((id === 'room' && AP.room.canBuy()) || (id === 'tasks' && AP.tasks.claimable())) { const dx = x + ib - 4 * s, dy = y + 4 * s; ctx.fillStyle = AP.art.RED; ctx.beginPath(); ctx.arc(dx, dy, 8 * s, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * s; ctx.stroke(); }
          U.text(ctx, AP.t(id), x + ib / 2, y + ib + 10 * s, { size: 12 * s, color: '#fff', weight: 800, maxW: ib + 14 * s });
          this.vis(id); }); });
      // ----- bottom row: Album, Level N (right), Tournament in the middle when it is on -----
      const ft = L.foot, bh = Math.min(ft.h - 20 * s, 72 * s, h * 0.12), by = ft.y + (ft.h - bh) / 2, maxW = Math.min(ft.w - 36 * s, f.tournament ? 760 * s : 560 * s), bx = ft.x + ft.w / 2 - maxW / 2;
      const aw = Math.min(maxW * (f.tournament ? 0.28 : 0.38), 200 * s), gapB = 12 * s, tw = f.tournament ? (maxW - aw - gapB * 2) / 2 : 0, pw = maxW - aw - gapB - (f.tournament ? tw + gapB : 0);
      AP.ui.button('side_album', bx, by, aw, bh, AP.t('album'), { color: '#3fb8ff', size: Math.min(19 * s, bh * 0.32), icon: (c, x, y) => AP.art.icon(c, 'album', x, y, 10 * s),
        onClick: () => { this.tap('album'); AP.game.open('album'); } });
      this.vis('album');
      if (f.tournament) { const tl = AP.CONFIG.tournament.unlockLevel, open = unlocked(tl), tx = bx + aw + gapB;
        AP.ui.button('tour', tx, by, tw, bh, AP.t('tournament'), { color: open ? AP.art.YELLOW : '#6f6596', size: Math.min(20 * s, bh * 0.33), icon: (c, x, y) => AP.art.icon(c, open ? 'trophy' : 'lock', x, y, 10 * s),
          onClick: () => { this.tap('tournament'); if (open) AP.game.open('tour'); else { AP.audio.bump(); AP.ui.toast(AP.t('unlock_at', { n: tl })); } } });
        if (open && AP.tour.run()) { const bx2 = tx + tw - 8 * s, by2 = by + 8 * s; ctx.fillStyle = AP.art.PINK; ctx.beginPath(); ctx.arc(bx2, by2, 10 * s, 0, Math.PI * 2); ctx.fill(); U.text(ctx, '!', bx2, by2 + 0.5, { size: 13 * s, color: '#fff', weight: 900 }); }
        this.vis('tournament'); }
      AP.ui.button('play', bx + maxW - pw, by, pw, bh, AP.t('level_n', { n: AP.save.level }), { color: AP.art.PINK, size: Math.min(22 * s, bh * 0.36), icon: (c, x, y) => AP.art.icon(c, 'play', x, y, 10 * s),
        onClick: () => { this.tap('play'); AP.playLevel(AP.save.level); } });
      this.vis('play');
    },
  };
})();
