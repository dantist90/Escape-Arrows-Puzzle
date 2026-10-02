// ---------- Roadmap: rewards for arrows earned in tournaments ----------
// AP.save.arrows = total arrows ever earned (never spent); AP.save.roadmap = milestones already claimed.
// Milestones come from CONFIG.roadmap.steps, then repeat every `repeatEvery` arrows. Reaching one grants it at once
// (AP.roadmap.check, called after a tournament) with a reward window and roadmap/milestone-<k>/unlocked.
(function () {
  const U = AP.util;
  AP.addStrings({
    en: { rm_title: 'Roadmap', rm_hint: 'Win arrows in tournaments to unlock rewards!', rm_claimed: 'Reward unlocked!', reward_title: 'Reward!', collect: 'Collect' },
    ru: { rm_title: 'Путь наград', rm_hint: 'Выигрывай стрелочки в турнирах и открывай награды!', rm_claimed: 'Награда открыта!', reward_title: 'Награда!', collect: 'Забрать' },
    es: { rm_title: 'Ruta', rm_hint: '¡Gana flechas en torneos para abrir premios!', rm_claimed: '¡Premio desbloqueado!', reward_title: '¡Premio!', collect: 'Recoger' },
    de: { rm_title: 'Belohnungsweg', rm_hint: 'Gewinne Pfeile in Turnieren für Belohnungen!', rm_claimed: 'Belohnung frei!', reward_title: 'Belohnung!', collect: 'Einsammeln' },
    fr: { rm_title: 'Parcours', rm_hint: 'Gagne des flèches en tournoi pour débloquer des cadeaux !', rm_claimed: 'Cadeau débloqué !', reward_title: 'Cadeau !', collect: 'Récupérer' },
    pt: { rm_title: 'Trilha', rm_hint: 'Ganhe setas nos torneios para abrir prêmios!', rm_claimed: 'Prêmio liberado!', reward_title: 'Prêmio!', collect: 'Pegar' },
    tr: { rm_title: 'Ödül yolu', rm_hint: 'Turnuvalarda ok kazan, ödülleri aç!', rm_claimed: 'Ödül açıldı!', reward_title: 'Ödül!', collect: 'Al' },
    pl: { rm_title: 'Ścieżka', rm_hint: 'Zdobywaj strzałki w turniejach i odblokuj nagrody!', rm_claimed: 'Nagroda odblokowana!', reward_title: 'Nagroda!', collect: 'Odbierz' },
    it: { rm_title: 'Percorso', rm_hint: 'Vinci frecce nei tornei per sbloccare premi!', rm_claimed: 'Premio sbloccato!', reward_title: 'Premio!', collect: 'Ritira' },
  });
  const RM = AP.roadmap = {
    // milestone k (0-based): {at, reward}
    step(k) { const C = AP.CONFIG.roadmap, S = C.steps; if (k < S.length) return S[k];
      return { at: S[S.length - 1].at + (k - S.length + 1) * C.repeatEvery, reward: C.repeatReward }; },
    next() { return RM.step(AP.save.roadmap || 0); },
    // claims every reached milestone; returns the rewards granted (for the reward window)
    check() {
      const got = []; while (AP.meta.get('arrows') >= RM.next().at) { const k = AP.save.roadmap || 0; const st = RM.step(k);
        AP.save.roadmap = k + 1; AP.meta.grant(st.reward); AP.poki.measure('roadmap', 'milestone-' + (k + 1), 'unlocked'); got.push(st.reward); }
      if (got.length) { AP.persist(); AP.game.modal = { type: 'reward', rews: got, title: AP.t('rm_claimed') }; }
      return got;
    },
    // reward object -> [[icon kind, amount, booster id?]]
    items(rew) { const out = []; for (const k of ['coins', 'tickets', 'stars', 'arrows']) if (rew[k]) out.push([k, rew[k]]);
      if (rew.boosters) for (const id in rew.boosters) out.push(['booster', rew.boosters[id], id]); return out; },
    drawItem(ctx, it, x, y, r) { if (it[0] === 'booster') { AP.art.candyDisc(ctx, x, y, r, AP.boosters.COL[it[2]], { lip: r * 0.1 }); AP.art.icon(ctx, AP.boosters.ICON[it[2]], x, y, r * 0.6); }
      else AP.art.currency(ctx, it[0], x, y, r * 0.8); },
  };

  // ----- the strip in the lobby: arrows, the next 4 milestones on a track -----
  RM.strip = function (ctx, x, y, w, h, s, t, onTap) {
    AP.art.panel(ctx, x, y, w, h, h / 2.4);
    AP.art.currency(ctx, 'arrows', x + h * 0.55, y + h / 2, h * 0.3);
    U.text(ctx, AP.t('rm_title'), x + h * 1.05, y + h * 0.3, { size: 12 * s, color: AP.art.INK_DIM, weight: 800, align: 'left', maxW: Math.min(w * 0.3, 90 * s) });
    U.text(ctx, AP.meta.get('arrows'), x + h * 1.05, y + h * 0.66, { size: 18 * s, color: '#fff', weight: 900, align: 'left' });
    const tx = x + h * 1.05 + 70 * s, tw = x + w - h * 0.6 - tx, ty = y + h / 2; if (tw < 60 * s) return;
    const k0 = AP.save.roadmap || 0, prevAt = k0 ? RM.step(k0 - 1).at : 0, steps = [0, 1, 2, 3].map(i => RM.step(k0 + i));
    const span = steps[3].at - prevAt, have = AP.meta.get('arrows'), px = a => tx + tw * U.clamp((a - prevAt) / span, 0, 1);
    ctx.fillStyle = 'rgba(10,2,40,0.6)'; U.rr(ctx, tx, ty - 5 * s, tw, 10 * s, 5 * s); ctx.fill();
    if (have > prevAt) { const g = ctx.createLinearGradient(tx, 0, tx + tw, 0); AP.art.TUBE.forEach((c, i) => g.addColorStop(i / 2, c)); ctx.fillStyle = g; U.rr(ctx, tx, ty - 5 * s, Math.max(10 * s, px(have) - tx), 10 * s, 5 * s); ctx.fill(); }
    steps.forEach((st, i) => { const gx = px(st.at), bob = i === 0 ? Math.sin(t * 3) * 2 * s : 0, it = RM.items(st.reward)[0];
      AP.art.candyDisc(ctx, gx, ty + bob, 15 * s, i === 0 ? '#7a2cff' : '#4a2fa0', { lip: 2 * s }); if (it) RM.drawItem(ctx, it, gx, ty + bob, 10 * s);
      U.text(ctx, st.at, gx, ty + 24 * s, { size: 10 * s, color: AP.art.INK_DIM, weight: 800 }); });
    AP.ui.hit('roadmap', { x, y, w, h }, { onClick: onTap });
  };

  // ----- roadmap window: the next milestones as a list -----
  AP.modals.roadmap = function (ctx, w, h, m) {
    const s = AP.ui.fitS(470); const pw = Math.min(w - 32 * s, 400 * s), ph = 470 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, AP.art.YELLOW);
    U.text(ctx, AP.t('rm_title'), w / 2, y + 34 * s, { size: 24 * s, color: '#fff', weight: 900, maxW: pw - 100 * s });
    AP.ui.iconButton('rm_close', x + pw - 46 * s, y + 12 * s, 36 * s, (c, cx, cy, r) => AP.art.icon(c, 'close', cx, cy, r), () => { AP.audio.click(); AP.game.modal = null; });
    U.wrap(ctx, AP.t('rm_hint'), w / 2, y + 66 * s, pw - 40 * s, 17 * s, { size: 13 * s, color: AP.art.INK_DIM, weight: 800, maxLines: 2 });
    const k0 = AP.save.roadmap || 0, have = AP.meta.get('arrows'), rowH = 54 * s;
    for (let i = 0; i < 6; i++) { const st = RM.step(k0 + i), ry = y + 104 * s + i * (rowH + 4 * s), rx = x + 16 * s, rw = pw - 32 * s;
      ctx.fillStyle = i === 0 ? 'rgba(122,44,255,0.45)' : 'rgba(10,2,40,0.45)'; U.rr(ctx, rx, ry, rw, rowH, 14 * s); ctx.fill();
      AP.art.currency(ctx, 'arrows', rx + 24 * s, ry + rowH / 2, 11 * s);
      U.text(ctx, st.at, rx + 44 * s, ry + rowH / 2, { size: 17 * s, color: '#fff', weight: 900, align: 'left' });
      RM.items(st.reward).forEach((it, j) => { const ix = rx + rw - 30 * s - j * 64 * s; RM.drawItem(ctx, it, ix - 18 * s, ry + rowH / 2, 15 * s);
        U.text(ctx, 'x' + it[1], ix + 8 * s, ry + rowH / 2, { size: 14 * s, color: '#fff', weight: 900 }); });
      if (i === 0) { const k = U.clamp(have / st.at, 0, 1); ctx.fillStyle = 'rgba(255,255,255,0.15)'; U.rr(ctx, rx + 90 * s, ry + rowH - 12 * s, rw * 0.35, 6 * s, 3 * s); ctx.fill();
        ctx.fillStyle = AP.art.YELLOW; U.rr(ctx, rx + 90 * s, ry + rowH - 12 * s, Math.max(6 * s, rw * 0.35 * k), 6 * s, 3 * s); ctx.fill(); } }
  };

  // ----- generic reward window: one or more reward objects -----
  AP.modals.reward = function (ctx, w, h, m) {
    const s = AP.ui.fitS(320); m.t = (m.t || 0) + (AP.game.dt || 0.016); const pw = Math.min(w - 32 * s, 360 * s), ph = 320 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, AP.art.YELLOW); AP.art.mascot(ctx, w / 2, y - 14 * s, 28 * s, 'wow', AP.game.t);
    U.text(ctx, m.title || AP.t('reward_title'), w / 2, y + 42 * s, { size: 24 * s, color: '#fff', weight: 900, stroke: AP.art.PINK, strokeW: 5 * s, maxW: pw - 30 * s });
    const items = [].concat(...m.rews.map(RM.items)); const n = items.length, cw = Math.min(84 * s, (pw - 30 * s) / Math.max(1, n));
    items.forEach((it, i) => { const cx = w / 2 + (i - (n - 1) / 2) * cw, cy = y + 130 * s, k = U.easeBack(U.clamp((m.t - i * 0.12) / 0.35, 0, 1));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(k || 0.001, k || 0.001); AP.art.glow(ctx, 0, 0, 40 * s, 0.35, AP.art.YELLOW); RM.drawItem(ctx, it, 0, 0, 24 * s); ctx.restore();
      U.text(ctx, '+' + it[1], cx, cy + 44 * s, { size: 18 * s, color: '#fff', weight: 900 }); });
    AP.ui.button('rew_ok', x + 24 * s, y + ph - 76 * s, pw - 48 * s, 56 * s, AP.t('collect'), { color: AP.art.GREEN, size: 21 * s, onClick: () => { AP.audio.coin(); AP.game.modal = m.next || null; } });
  };
})();
