// ---------- Room: decorate a cozy neon room step by step with stars ----------
// AP.save.room = {k: room index, steps: decor pieces placed in it}. 8 pieces per room (CONFIG.room.stepCost, + costGrowth per room).
// The next piece is always shown as a glowing outline with its price, so an unfinished room calls the player back.
// A finished room gives a chest (CONFIG.room.chest) and opens the next room in another palette.
// Event: room/step-<global step>/unlocked.
(function () {
  const U = AP.util;
  const ITEMS = ['rug', 'bed', 'lamp', 'plant', 'shelf', 'sign', 'lights', 'pouf'];
  // room palettes: wall top, wall bottom, floor, accent 1, accent 2
  const THEMES = [
    ['#3a1a7a', '#5a2aa0', '#2a1050', '#ff4fb8', '#ffc93a'], ['#123a6e', '#1e5aa0', '#0e2448', '#3fd8ff', '#ff8ad8'],
    ['#5a1a4a', '#8a2a6e', '#3a0e30', '#ffc93a', '#46e08a'], ['#1a4a3e', '#2a6e5a', '#0e3028', '#ffe066', '#ff4fb8'],
  ];
  AP.addStrings({
    en: { room_n: 'Room {n}', place: 'Place', room_done: 'Room complete!', room_next: 'Next room', it_rug: 'Rug', it_bed: 'Bed', it_lamp: 'Lamp', it_plant: 'Plant', it_shelf: 'Shelf', it_sign: 'Neon sign', it_lights: 'Fairy lights', it_pouf: 'Pouf', need_stars: 'Win levels to earn stars!' },
    ru: { room_n: 'Комната {n}', place: 'Поставить', room_done: 'Комната готова!', room_next: 'Следующая комната', it_rug: 'Коврик', it_bed: 'Кровать', it_lamp: 'Лампа', it_plant: 'Цветок', it_shelf: 'Полка', it_sign: 'Неоновая вывеска', it_lights: 'Гирлянда', it_pouf: 'Пуфик', need_stars: 'Проходи уровни, чтобы получать звёзды!' },
    es: { room_n: 'Cuarto {n}', place: 'Poner', room_done: '¡Cuarto listo!', room_next: 'Siguiente cuarto', it_rug: 'Alfombra', it_bed: 'Cama', it_lamp: 'Lámpara', it_plant: 'Planta', it_shelf: 'Estante', it_sign: 'Letrero neón', it_lights: 'Lucecitas', it_pouf: 'Puf', need_stars: '¡Supera niveles para ganar estrellas!' },
    de: { room_n: 'Zimmer {n}', place: 'Aufstellen', room_done: 'Zimmer fertig!', room_next: 'Nächstes Zimmer', it_rug: 'Teppich', it_bed: 'Bett', it_lamp: 'Lampe', it_plant: 'Pflanze', it_shelf: 'Regal', it_sign: 'Neonschild', it_lights: 'Lichterkette', it_pouf: 'Pouf', need_stars: 'Schaffe Level, um Sterne zu bekommen!' },
    fr: { room_n: 'Chambre {n}', place: 'Placer', room_done: 'Chambre terminée !', room_next: 'Chambre suivante', it_rug: 'Tapis', it_bed: 'Lit', it_lamp: 'Lampe', it_plant: 'Plante', it_shelf: 'Étagère', it_sign: 'Néon', it_lights: 'Guirlande', it_pouf: 'Pouf', need_stars: 'Réussis des niveaux pour gagner des étoiles !' },
    pt: { room_n: 'Quarto {n}', place: 'Colocar', room_done: 'Quarto pronto!', room_next: 'Próximo quarto', it_rug: 'Tapete', it_bed: 'Cama', it_lamp: 'Luminária', it_plant: 'Planta', it_shelf: 'Prateleira', it_sign: 'Letreiro neon', it_lights: 'Pisca-pisca', it_pouf: 'Pufe', need_stars: 'Passe níveis para ganhar estrelas!' },
    tr: { room_n: 'Oda {n}', place: 'Yerleştir', room_done: 'Oda tamam!', room_next: 'Sonraki oda', it_rug: 'Halı', it_bed: 'Yatak', it_lamp: 'Lamba', it_plant: 'Bitki', it_shelf: 'Raf', it_sign: 'Neon tabela', it_lights: 'Işık zinciri', it_pouf: 'Puf', need_stars: 'Yıldız için seviye geç!' },
    pl: { room_n: 'Pokój {n}', place: 'Postaw', room_done: 'Pokój gotowy!', room_next: 'Następny pokój', it_rug: 'Dywan', it_bed: 'Łóżko', it_lamp: 'Lampa', it_plant: 'Roślina', it_shelf: 'Półka', it_sign: 'Neon', it_lights: 'Lampki', it_pouf: 'Pufa', need_stars: 'Przechodź poziomy, by zdobywać gwiazdki!' },
    it: { room_n: 'Stanza {n}', place: 'Metti', room_done: 'Stanza finita!', room_next: 'Stanza successiva', it_rug: 'Tappeto', it_bed: 'Letto', it_lamp: 'Lampada', it_plant: 'Pianta', it_shelf: 'Mensola', it_sign: 'Insegna neon', it_lights: 'Lucine', it_pouf: 'Pouf', need_stars: 'Supera livelli per avere stelle!' },
  });

  const R = AP.room = {
    ITEMS,
    st() { const r = AP.save.room || (AP.save.room = {}); r.k = r.k || 0; r.steps = r.steps || 0; return r; },
    cost(step) { const c = AP.CONFIG.room; return c.stepCost[step] + R.st().k * c.costGrowth; },
    done() { return R.st().steps >= ITEMS.length; },
    canBuy() { return !R.done() && AP.meta.get('stars') >= R.cost(R.st().steps); },
    buy() {
      const r = R.st(); if (R.done()) return; const c = R.cost(r.steps);
      if (!AP.meta.spend({ type: 'stars', n: c })) { AP.ui.toast(AP.t('need_stars')); return; }
      r.steps++; R.pop = { i: r.steps - 1, t: 0 }; AP.poki.measure('room', 'step-' + (r.k * ITEMS.length + r.steps), 'unlocked'); AP.persist(); AP.audio.sparkle();
      if (R.done()) { AP.meta.grant(AP.CONFIG.room.chest); AP.game.modal = { type: 'reward', rews: [AP.CONFIG.room.chest], title: AP.t('room_done') }; }
    },
    next() { const r = R.st(); if (!R.done()) return; r.k++; r.steps = 0; AP.persist(); AP.audio.whoosh(); },
    // draws room k with `steps` pieces into the box; ghost = index of the piece shown as an outline (or -1)
    draw(ctx, x, y, w, h, k, steps, ghost, t) {
      const th = THEMES[k % THEMES.length], fy = y + h * 0.7, s = Math.min(w, h) / 400;
      ctx.save(); U.rr(ctx, x, y, w, h, 20 * AP.ui.scale); ctx.clip();
      let g = ctx.createLinearGradient(0, y, 0, fy); g.addColorStop(0, th[0]); g.addColorStop(1, th[1]); ctx.fillStyle = g; ctx.fillRect(x, y, w, fy - y);
      g = ctx.createLinearGradient(0, fy, 0, y + h); g.addColorStop(0, th[2]); g.addColorStop(1, U.darken(th[2], 0.3)); ctx.fillStyle = g; ctx.fillRect(x, fy, w, y + h - fy);
      ctx.strokeStyle = U.rgba(th[3], 0.5); ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x + w, fy); ctx.stroke();
      // window with a night sky and a moon (always there)
      const wx = x + w * 0.62, wy = y + h * 0.12, ww = w * 0.26, wh = h * 0.3;
      ctx.fillStyle = '#0a0630'; U.rr(ctx, wx, wy, ww, wh, 10 * s); ctx.fill(); ctx.strokeStyle = U.lighten(th[1], 0.3); ctx.lineWidth = 5 * s; ctx.stroke();
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(wx + ww * 0.7, wy + wh * 0.32, ww * 0.12, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 5; i++) AP.art.sparkle(ctx, wx + ww * (0.15 + i * 0.15), wy + wh * (0.3 + (i % 2) * 0.35), 3 * s, '#fff');
      ctx.strokeStyle = U.lighten(th[1], 0.3); ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke();
      for (let i = 0; i < ITEMS.length; i++) {
        const has = i < steps, gh = i === ghost; if (!has && !gh) continue;
        let k2 = 1; if (R.pop && R.pop.i === i) k2 = U.easeBack(U.clamp(R.pop.t / 0.45, 0, 1));
        ctx.save(); ctx.globalAlpha = gh ? 0.35 + 0.15 * Math.sin(t * 4) : 1; R.item(ctx, ITEMS[i], x, y, w, h, fy, s, th, t, k2, gh); ctx.restore();
      }
      ctx.restore();
    },
    // one decor piece, drawn in room coordinates; ghost = white outline only
    item(ctx, id, x, y, w, h, fy, s, th, t, k, ghost) {
      const fill = c => { if (ghost) { ctx.strokeStyle = '#fff'; ctx.setLineDash([6 * s, 5 * s]); ctx.lineWidth = 3 * s; ctx.stroke(); ctx.setLineDash([]); } else { ctx.fillStyle = c; ctx.fill(); } };
      const P = (px, py) => [x + w * px, y + h * py]; const A = th[3], B2 = th[4];
      const scaleAt = (cx, cy) => { ctx.translate(cx, cy); ctx.scale(k || 0.001, k || 0.001); ctx.translate(-cx, -cy); };
      switch (id) {
        case 'rug': { const [cx] = P(0.5, 0); scaleAt(cx, fy + h * 0.15); ctx.beginPath(); ctx.ellipse(cx, fy + h * 0.17, w * 0.32, h * 0.08, 0, 0, Math.PI * 2); fill(U.rgba(A, 0.55));
          if (!ghost) { ctx.strokeStyle = U.rgba(B2, 0.8); ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.ellipse(cx, fy + h * 0.17, w * 0.24, h * 0.05, 0, 0, Math.PI * 2); ctx.stroke(); } break; }
        case 'bed': { const bx = x + w * 0.05, bw = w * 0.42, by = fy - h * 0.16; scaleAt(bx + bw / 2, fy);
          U.rr(ctx, bx, by, bw, h * 0.18, 10 * s); fill('#f4e9ff'); U.rr(ctx, bx, by - h * 0.1, w * 0.05, h * 0.28, 6 * s); fill(U.darken(A, 0.2));
          U.rr(ctx, bx + w * 0.07, by - h * 0.045, w * 0.1, h * 0.06, 10 * s); fill('#ffffff'); U.rr(ctx, bx + w * 0.18, by + h * 0.02, bw - w * 0.2, h * 0.12, 8 * s); fill(A); break; }
        case 'lamp': { const lx = x + w * 0.9; scaleAt(lx, fy); if (!ghost) AP.art.glow(ctx, lx, fy - h * 0.42, w * 0.16, 0.45, B2);
          U.rr(ctx, lx - 2 * s, fy - h * 0.38, 4 * s, h * 0.38, 2 * s); fill('#e0d4ff'); ctx.beginPath(); ctx.moveTo(lx - w * 0.05, fy - h * 0.38); ctx.lineTo(lx + w * 0.05, fy - h * 0.38); ctx.lineTo(lx + w * 0.03, fy - h * 0.48); ctx.lineTo(lx - w * 0.03, fy - h * 0.48); ctx.closePath(); fill(B2); break; }
        case 'plant': { const px = x + w * 0.56; scaleAt(px, fy); U.rr(ctx, px - w * 0.04, fy - h * 0.1, w * 0.08, h * 0.1, 6 * s); fill(B2);
          for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(px + i * w * 0.018, fy - h * 0.16 - Math.abs(i) * -h * 0.01, w * 0.018, h * 0.08, i * 0.35 + Math.sin(t * 2 + i) * 0.05, 0, Math.PI * 2); fill('#46e08a'); } break; }
        case 'shelf': { const sx = x + w * 0.08, sy = y + h * 0.3; scaleAt(sx + w * 0.15, sy); U.rr(ctx, sx, sy, w * 0.3, h * 0.025, 4 * s); fill('#e0d4ff');
          ['#ff4fb8', '#3fd8ff', '#ffc93a', '#46e08a', '#9d5cff'].forEach((c, i) => { U.rr(ctx, sx + w * (0.02 + i * 0.05), sy - h * (0.07 + (i % 2) * 0.02), w * 0.035, h * (0.07 + (i % 2) * 0.02), 3 * s); fill(c); }); break; }
        case 'sign': { const cx = x + w * 0.36, cy = y + h * 0.16; scaleAt(cx, cy); ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
          U.heart(ctx, cx, cy - h * 0.06, w * 0.12); if (ghost) fill(); else { ctx.shadowColor = A; ctx.shadowBlur = 18 * s; ctx.strokeStyle = A; ctx.stroke(); ctx.shadowBlur = 0; } break; }
        case 'lights': { scaleAt(x + w / 2, y + h * 0.05); ctx.strokeStyle = ghost ? '#fff' : 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, y + h * 0.04); ctx.quadraticCurveTo(x + w / 2, y + h * 0.14, x + w, y + h * 0.04); ctx.stroke();
          for (let i = 1; i < 12; i++) { const u = i / 12, lx = x + w * u, ly = y + h * 0.04 + Math.sin(u * Math.PI) * h * 0.05; ctx.beginPath(); ctx.arc(lx, ly + 4 * s, 4 * s, 0, Math.PI * 2);
            if (ghost) fill(); else { const c = [A, B2, '#3fd8ff'][i % 3], on = 0.6 + 0.4 * Math.sin(t * 3 + i); ctx.fillStyle = U.rgba(c, on); ctx.shadowColor = c; ctx.shadowBlur = 10 * s; ctx.fill(); ctx.shadowBlur = 0; } } break; }
        case 'pouf': { const px = x + w * 0.74; scaleAt(px, fy + h * 0.1); ctx.beginPath(); ctx.ellipse(px, fy + h * 0.06, w * 0.08, h * 0.06, 0, 0, Math.PI * 2); fill(B2);
          if (!ghost) { ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(px, fy + h * 0.035, w * 0.055, h * 0.02, 0, 0, Math.PI * 2); ctx.fill(); } break; }
      }
    },
  };

  // ----- the Room screen -----
  AP.screens.room = {
    enter() { AP.poki.gameplayStop(); },
    update(dt) { if (R.pop) { R.pop.t += dt; if (R.pop.t > 1) R.pop = null; } },
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s, r = R.st(); AP.art.background(ctx, w, h, AP.game.t);
      AP.game.topBar(ctx, { back: () => { AP.audio.click(); AP.game.open('lobby'); }, pills: ['stars'], title: AP.t('room_n', { n: r.k + 1 }) });
      const st = L.stage, asp = L.portrait ? 0.8 : 1.15; // a taller room on phones, a wider one on PC
      const bw = Math.min(st.w - 24 * s, (L.foot.y - st.y - 50 * s) * asp, 640 * s), bh = bw / asp, bx = st.x + st.w / 2 - bw / 2, by = st.y + 34 * s;
      // progress: n of 8 pieces
      for (let i = 0; i < ITEMS.length; i++) { const dx = w / 2 + (i - 3.5) * 22 * s; ctx.fillStyle = i < r.steps ? AP.art.YELLOW : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(dx, st.y + 16 * s, 6 * s, 0, Math.PI * 2); ctx.fill(); }
      AP.art.panel(ctx, bx - 4 * s, by - 4 * s, bw + 8 * s, bh + 8 * s, 22 * s, AP.art.PINK);
      R.draw(ctx, bx, by, bw, bh, r.k, r.steps, R.done() ? -1 : r.steps, AP.game.t);
      const ft = L.foot, bh2 = Math.min(ft.h - 20 * s, 64 * s, h * 0.12), by2 = ft.y + (ft.h - bh2) / 2, w2 = Math.min(ft.w - 36 * s, 460 * s), bx2 = ft.x + ft.w / 2 - w2 / 2;
      if (R.done()) AP.ui.button('room_next', bx2, by2, w2, bh2, AP.t('room_next'), { color: AP.art.GREEN, size: Math.min(21 * s, bh2 * 0.36), onClick: () => R.next() });
      else { const c = R.cost(r.steps); AP.ui.button('room_buy', bx2, by2, w2, bh2, AP.t('place') + ': ' + AP.t('it_' + ITEMS[r.steps]) + '  ' + c, { color: R.canBuy() ? AP.art.PINK : '#6f6596', size: Math.min(19 * s, bh2 * 0.34),
        icon: (cc, ix, iy) => AP.art.currency(cc, 'stars', ix, iy, 11 * s), iconRight: true, onClick: () => R.buy() }); }
    },
  };
})();
