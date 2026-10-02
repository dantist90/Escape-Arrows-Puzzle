// ---------- Scene transition and start loader ----------
// AP.trans.run(fn, {ad, need, after}): a violet iris closes over the screen, fn() switches the scene underneath, an optional
// Poki interstitial plays while it is closed (gameplay stopped first, Poki rule), then the iris opens on the new scene.
// AP.boot: the canvas loader (logo, Loading..., progress bar) shown at start for at least MIN seconds.
(function () {
  const U = AP.util;

  AP.trans = {
    active: false, t: 0, phase: 'idle', act: null, ad: false, adDone: true, MIN: 1.1, CLOSE: 0.38, OPEN: 0.42,
    run(action, o = {}) { const T = AP.trans; if (T.active) { action(); if (o.after) o.after(); return; }
      Object.assign(T, { active: true, t: 0, phase: 'close', act: action, ad: !!o.ad, adDone: !o.ad, after: o.after || null, need: o.need || [], loaded: !(o.need && o.need.length), shown: 0 });
      if (o.need && o.need.length) AP.assets.need(o.need).then(() => { T.loaded = true; });
      AP.audio.whoosh(); },
    update(dt) {
      const T = AP.trans; if (!T.active) return; T.t += dt;
      if (T.phase === 'close' && T.t >= T.CLOSE) { T.phase = 'hold';
        if (T.ad) { AP.poki.gameplayStop(); AP.poki.commercialBreak().then(() => { T.adDone = true; }); }
        try { T.act && T.act(); } catch (e) { console.error(e); } T.act = null; }
      if (T.phase === 'hold' && T.adDone && T.loaded && T.t >= T.MIN - T.OPEN) { T.phase = 'open'; T.open = T.t;
        if (T.after) { const f = T.after; T.after = null; try { f(); } catch (e) { console.error(e); } } }
      if (T.phase === 'open' && T.t - T.open >= T.OPEN) { T.active = false; T.phase = 'idle'; }
    },
    draw(ctx, w, h) {
      const T = AP.trans; if (!T.active) return; const s = AP.ui.scale; const R = Math.hypot(w, h) / 2 + 4;
      const k = T.phase === 'close' ? U.easeIn(U.clamp(T.t / T.CLOSE, 0, 1)) : T.phase === 'hold' ? 1 : 1 - U.easeOut(U.clamp((T.t - T.open) / T.OPEN, 0, 1));
      ctx.save();
      // closing: a growing violet disc; opening: a growing hole in a violet sheet (even-odd fill)
      ctx.beginPath();
      if (T.phase === 'open') { ctx.rect(0, 0, w, h); ctx.arc(w / 2, h / 2, R * (1 - k), 0, Math.PI * 2, true); }
      else ctx.arc(w / 2, h / 2, R * k, 0, Math.PI * 2);
      ctx.clip('evenodd');
      AP.art.background(ctx, w, h, AP.game.t);
      // the neon rim of the iris
      const rr = T.phase === 'open' ? R * (1 - k) : R * k;
      if (rr > 2 && rr < R) { ctx.strokeStyle = U.rgba(AP.art.PINK, 0.9); ctx.lineWidth = 6 * s; ctx.shadowColor = AP.art.PINK; ctx.shadowBlur = 18 * s; ctx.beginPath(); ctx.arc(w / 2, h / 2, rr, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
      const a = T.phase === 'hold' ? 1 : U.clamp(k * 1.6 - 0.6, 0, 1);
      if (a > 0) { ctx.globalAlpha = a; const u = Math.min(1.4, s);
        AP.boot.logo(ctx, w / 2, h / 2 - 30 * u, Math.min(u * 0.7, w / 640), AP.game.t);
        const pr = T.phase === 'open' ? 1 : Math.min(U.clamp(T.t / (T.MIN - T.OPEN), 0, 1), T.need.length ? AP.assets.progress(T.need) : 1); T.shown = Math.max(T.shown, pr);
        AP.boot.bar(ctx, w / 2, h / 2 + 70 * u, Math.min(w * 0.6, 260 * u), 14 * u, T.shown); }
      ctx.restore();
    },
  };

  AP.boot = {
    active: true, t: 0, MIN: 1.6, ok: false, onDone: null, shown: 0, fade: 0,
    start(ready, onDone) { const B = AP.boot; B.onDone = onDone; ready.then(() => { B.ok = true; }); if (AP.QA.fast) B.MIN = 0; },
    progress() { const B = AP.boot; return Math.min(B.MIN ? U.clamp(B.t / B.MIN, 0, 1) : 1, B.ok ? 1 : Math.min(0.97, AP.assets.progress(['boot', 'first']))); },
    update(dt) { const B = AP.boot; B.t += dt; B.shown = Math.max(B.shown, B.progress());
      if (B.fade > 0) { B.fade += dt; if (B.fade > 0.35) B.active = false; return; }
      if (B.ok && B.t >= B.MIN && B.shown >= 1) { B.fade = 0.001; try { B.onDone && B.onDone(); } catch (e) { console.error(e); } } },
    loadingText(ctx, cx, y, s, t) { const base = AP.t('loading'), dots = '.'.repeat(1 + Math.floor(t * 2.5) % 3);
      ctx.save(); ctx.font = `900 ${20 * s}px ${AP.FONT}`; const x0 = cx - ctx.measureText(base + '...').width / 2;
      U.text(ctx, base + dots, x0, y, { size: 20 * s, color: '#fff', weight: 900, align: 'left' }); ctx.restore(); },
    // neon progress bar
    bar(ctx, cx, y, w, h, k) { const x = cx - w / 2;
      ctx.save(); ctx.fillStyle = 'rgba(10,2,40,0.6)'; U.rr(ctx, x - 3, y - h / 2 - 3, w + 6, h + 6, (h + 6) / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(190,160,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      if (k > 0) { const fw = Math.max(h, w * U.clamp(k, 0, 1)); const g = ctx.createLinearGradient(x, 0, x + w, 0); AP.art.TUBE.forEach((c, i) => g.addColorStop(i / 2, c));
        ctx.shadowColor = AP.art.PINK; ctx.shadowBlur = h; ctx.fillStyle = g; U.rr(ctx, x, y - h / 2, fw, h, h / 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.4)'; U.rr(ctx, x + h * 0.4, y - h / 2 + h * 0.15, Math.max(0, fw - h * 0.8), h * 0.25, h * 0.12); ctx.fill(); }
      ctx.restore(); },
    // code-drawn logo: "ESCAPE" over a big neon "ARROWS", a tube arrow swooping underneath; sprite ui/logo replaces it
    logo(ctx, cx, cy, k, t) { if (AP.assets.draw(ctx, 'ui/logo', cx, cy, 600 * k, 320 * k)) return;
      ctx.save(); ctx.lineJoin = 'round';
      U.text(ctx, 'ESCAPE', cx, cy - 62 * k, { size: 46 * k, color: '#ffffff', weight: 900, stroke: '#7a2cff', strokeW: 10 * k });
      const fs = 104 * k; ctx.font = `900 ${fs}px ${AP.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const y = cy + 18 * k + Math.sin(t * 2) * 2 * k;
      ctx.shadowColor = AP.art.PINK; ctx.shadowBlur = 28 * k; ctx.strokeStyle = '#ff4fb8'; ctx.lineWidth = 14 * k; ctx.strokeText('ARROWS', cx, y);
      ctx.shadowBlur = 0; const g = ctx.createLinearGradient(0, y - fs / 2, 0, y + fs / 2); g.addColorStop(0, '#fff6c8'); g.addColorStop(0.5, '#ffd24a'); g.addColorStop(1, '#ff9a1e'); ctx.fillStyle = g; ctx.fillText('ARROWS', cx, y);
      const w = ctx.measureText('ARROWS').width;
      AP.art.tube(ctx, [[cx - w * 0.55, y + 50 * k], [cx - w * 0.55, y + 74 * k], [cx + w * 0.3, y + 74 * k], [cx + w * 0.3, y + 62 * k], [cx + w * 0.58, y + 62 * k]], 11 * k);
      [[-w / 2 - 20 * k, y - 48 * k, 14], [w / 2 + 18 * k, y - 40 * k, 18], [w / 2 - 6 * k, y + 40 * k, 10]].forEach(([dx, yy, r], i) => AP.art.sparkle(ctx, cx + dx, yy, r * k * (0.75 + 0.25 * Math.sin(t * 4 + i * 2)), i === 1 ? '#fff6a8' : '#fff'));
      ctx.restore(); },
    draw(ctx, w, h) { const B = AP.boot, t = B.t;
      const a = B.fade > 0 ? 1 - U.clamp(B.fade / 0.35, 0, 1) : 1; ctx.save(); ctx.globalAlpha = a;
      if (!AP.assets.draw(ctx, 'boot/bg', w / 2, h / 2, Math.max(w, h * 16 / 9), Math.max(h, w * 9 / 16))) AP.art.background(ctx, w, h, t);
      const P = h > w, k = Math.min(w / (P ? 520 : 900), h / 720, 1.5), s = Math.min(k * 1.25, 1.8);
      B.logo(ctx, w / 2, h * (P ? 0.36 : 0.38), P ? Math.min(k * 1.1, w / 520) : k, t);
      B.loadingText(ctx, w / 2, h * (P ? 0.74 : 0.75), s, t);
      B.bar(ctx, w / 2, h * (P ? 0.8 : 0.82), Math.min(w * 0.7, 420 * k), 18 * k, B.shown);
      ctx.restore(); },
  };
})();
