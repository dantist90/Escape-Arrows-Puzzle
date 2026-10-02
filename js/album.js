// ---------- Album: every beaten level as a thumbnail with its stars; tap to replay ----------
// Replays never move AP.save.level; a better result adds the missing stars (level.js win()). Replays use their own
// funnel (replay/<N>/start|complete|fail, see EVENTS.md) so the level funnel stays first attempts + retries only.
(function () {
  const U = AP.util;
  AP.addStrings({
    en: { album_empty: 'Beaten levels will appear here.', album_hint: 'Replay any level to collect all 3 stars!' },
    ru: { album_empty: 'Здесь появятся пройденные уровни.', album_hint: 'Переиграй любой уровень, чтобы собрать все 3 звезды!' },
    es: { album_empty: 'Aquí aparecerán los niveles superados.', album_hint: '¡Rejuega cualquier nivel para conseguir 3 estrellas!' },
    de: { album_empty: 'Geschaffte Level erscheinen hier.', album_hint: 'Spiel jedes Level nochmal für alle 3 Sterne!' },
    fr: { album_empty: 'Les niveaux réussis apparaîtront ici.', album_hint: 'Rejoue un niveau pour obtenir les 3 étoiles !' },
    pt: { album_empty: 'Os níveis vencidos aparecem aqui.', album_hint: 'Jogue de novo para pegar as 3 estrelas!' },
    tr: { album_empty: 'Geçtiğin seviyeler burada görünür.', album_hint: '3 yıldız için istediğin seviyeyi tekrar oyna!' },
    pl: { album_empty: 'Tu pojawią się ukończone poziomy.', album_hint: 'Zagraj ponownie, by zdobyć 3 gwiazdki!' },
    it: { album_empty: 'Qui compariranno i livelli superati.', album_hint: 'Rigioca un livello per avere 3 stelle!' },
  });
  const thumbs = {}; let thumbSkin = null;
  // small cached picture of a level: its arrows as tubes in the current palette
  function thumb(n) {
    if (thumbSkin !== AP.save.skin) { for (const k in thumbs) delete thumbs[k]; thumbSkin = AP.save.skin; }
    if (thumbs[n]) return thumbs[n]; const lv = AP.levelData(n); if (!lv) return null;
    const S = 160, cv = document.createElement('canvas'); cv.width = S; cv.height = S; const c = cv.getContext('2d');
    const m = AP.board.build(lv), cell = Math.min((S - 16) / m.w, (S - 16) / m.h), ox = (S - m.w * cell) / 2, oy = (S - m.h * cell) / 2;
    m.arrows.forEach(a => { const col = AP.board.colorAt(a.cells[a.cells.length - 1][1] / Math.max(1, m.h - 1));
      c.strokeStyle = col; c.lineWidth = Math.max(1.5, cell * 0.32); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      a.cells.forEach((p, i) => { const X = ox + (p[0] + 0.5) * cell, Y = oy + (p[1] + 0.5) * cell; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); });
    return (thumbs[n] = cv);
  }
  AP.screens.album = {
    enter() { AP.poki.gameplayStop(); },
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s; AP.art.background(ctx, w, h, AP.game.t);
      AP.game.topBar(ctx, { back: () => { AP.audio.click(); AP.game.open('lobby'); }, pills: ['stars'], title: AP.t('album') });
      const st = L.stage, beaten = AP.save.level - 1;
      if (beaten <= 0) { U.text(ctx, AP.t('album_empty'), w / 2, st.y + st.h * 0.4, { size: 17 * s, color: AP.art.INK_DIM, weight: 800, maxW: st.w - 40 * s }); return; }
      U.text(ctx, AP.t('album_hint'), w / 2, st.y + 16 * s, { size: 13 * s, color: AP.art.INK_DIM, weight: 800, maxW: st.w - 30 * s });
      const ids = []; for (let n = beaten; n >= 1; n--) ids.push(n); // newest first
      const rect = { x: st.x + 10 * s, y: st.y + 34 * s, w: st.w - 20 * s, h: L.h - L.safe.b - (st.y + 40 * s) };
      AP.ui.grid('album', rect, ids, (n, x, y, sz, i, hh) => {
        const stars = AP.save.best[n] || 0, pressed = AP.ui.isHeld('alb_' + n);
        ctx.save(); if (pressed) ctx.translate(0, 2 * s);
        AP.art.panel(ctx, x, y, sz, hh, 14 * s, stars >= 3 ? AP.art.YELLOW : '#6b4fd0', 0.85);
        const tb = thumb(n); if (tb) ctx.drawImage(tb, x + 6 * s, y + 6 * s, sz - 12 * s, sz - 12 * s);
        U.text(ctx, n, x + 16 * s, y + 16 * s, { size: 13 * s, color: '#fff', weight: 900, stroke: '#2a0b6e', strokeW: 3 * s });
        for (let k = 0; k < 3; k++) { const sx = x + sz / 2 + (k - 1) * 22 * s, sy = y + hh - 16 * s; if (k < stars) AP.art.currency(ctx, 'stars', sx, sy, 9 * s); else { U.star(ctx, sx, sy + 1 * s, 9.5 * s, 5, 0.5); ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fill(); } }
        ctx.restore();
        AP.ui.hit('alb_' + n, { x, y, w: sz, h: hh }, { onClick: () => { AP.audio.click(); AP.playLevel(n); } });
      }, { cols: L.portrait ? 3 : 6, aspect: 1.2, maxSize: 150 * s });
    },
  };
})();
