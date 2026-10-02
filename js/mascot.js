// ---------- Mascot: Lu the neon fox (code-drawn; sprites mascot/<mood>.png replace it) ----------
// AP.art.mascot(ctx, x, y, r, mood, t): head centred at (x, y), radius r. mood: 'idle' (blinks), 'happy' (^^ eyes, open smile),
// 'oops' (round eyes, small O mouth), 'wow' (star eyes). t = game time for blinking / ear wiggle.
(function () {
  const U = AP.util;
  AP.art.mascot = function (ctx, x, y, r, mood = 'idle', t = 0) {
    if (AP.assets.draw(ctx, 'mascot/' + mood, x, y, r * 2.6, r * 2.6)) return;
    ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const FUR = '#ff8a3d', FUR2 = '#ff4fb8', CREAM = '#fff1e6', OUT = '#5a1a8a';
    const wig = Math.sin(t * 3) * 0.06;
    // ears
    [-1, 1].forEach(sd => { ctx.save(); ctx.rotate(sd * (0.18 + (sd > 0 ? wig : -wig)));
      ctx.beginPath(); ctx.moveTo(sd * r * 0.35, -r * 0.6); ctx.lineTo(sd * r * 0.78, -r * 1.25); ctx.lineTo(sd * r * 0.95, -r * 0.35); ctx.closePath();
      const g = ctx.createLinearGradient(0, -r * 1.25, 0, -r * 0.4); g.addColorStop(0, FUR2); g.addColorStop(1, FUR); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = r * 0.07; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sd * r * 0.5, -r * 0.62); ctx.lineTo(sd * r * 0.76, -r * 1.02); ctx.lineTo(sd * r * 0.84, -r * 0.5); ctx.closePath(); ctx.fillStyle = '#ffd1e8'; ctx.fill(); ctx.restore(); });
    // head: wide rounded shape with cheek tufts
    ctx.shadowColor = U.rgba(FUR2, 0.6); ctx.shadowBlur = r * 0.35;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.82);
    ctx.bezierCurveTo(r * 0.75, -r * 0.82, r * 1.0, -r * 0.3, r * 1.05, r * 0.15); ctx.lineTo(r * 1.18, r * 0.3); ctx.lineTo(r * 0.92, r * 0.36);
    ctx.bezierCurveTo(r * 0.7, r * 0.8, r * 0.3, r * 0.92, 0, r * 0.92); ctx.bezierCurveTo(-r * 0.3, r * 0.92, -r * 0.7, r * 0.8, -r * 0.92, r * 0.36);
    ctx.lineTo(-r * 1.18, r * 0.3); ctx.lineTo(-r * 1.05, r * 0.15); ctx.bezierCurveTo(-r * 1.0, -r * 0.3, -r * 0.75, -r * 0.82, 0, -r * 0.82); ctx.closePath();
    const hg = ctx.createLinearGradient(0, -r, 0, r); hg.addColorStop(0, '#ffb35c'); hg.addColorStop(1, FUR); ctx.fillStyle = hg; ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = OUT; ctx.lineWidth = r * 0.07; ctx.stroke();
    // cream muzzle
    ctx.beginPath(); ctx.moveTo(-r * 0.62, r * 0.25); ctx.quadraticCurveTo(0, -r * 0.05, r * 0.62, r * 0.25); ctx.quadraticCurveTo(r * 0.5, r * 0.86, 0, r * 0.88); ctx.quadraticCurveTo(-r * 0.5, r * 0.86, -r * 0.62, r * 0.25); ctx.closePath();
    ctx.fillStyle = CREAM; ctx.fill();
    // cheeks
    ctx.fillStyle = 'rgba(255,79,184,0.35)'; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.ellipse(sd * r * 0.6, r * 0.32, r * 0.16, r * 0.1, 0, 0, Math.PI * 2); ctx.fill(); });
    // eyes
    const blink = mood === 'idle' && (t % 3.2) > 3.05; const ey = -r * 0.08, ex = r * 0.36;
    ctx.strokeStyle = OUT; ctx.fillStyle = OUT; ctx.lineWidth = r * 0.09;
    [-1, 1].forEach(sd => { const cx = sd * ex;
      if (mood === 'happy' || blink) { ctx.beginPath(); ctx.arc(cx, ey + r * 0.06, r * 0.13, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      else if (mood === 'wow') { ctx.fillStyle = '#ffe066'; U.star(ctx, cx, ey, r * 0.19); ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = r * 0.04; ctx.stroke(); }
      else { const er = mood === 'oops' ? r * 0.15 : r * 0.17; ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(cx, ey, er * 0.85, er, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - er * 0.3, ey - er * 0.35, er * 0.33, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + er * 0.3, ey + er * 0.3, er * 0.15, 0, Math.PI * 2); ctx.fill(); } });
    // nose + mouth
    ctx.fillStyle = OUT; ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.1, r * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = OUT; ctx.lineWidth = r * 0.06;
    if (mood === 'happy' || mood === 'wow') { ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.45); ctx.quadraticCurveTo(0, r * 0.72, r * 0.2, r * 0.45); ctx.closePath(); ctx.fillStyle = '#ff5c8a'; ctx.fill(); ctx.stroke(); }
    else if (mood === 'oops') { ctx.fillStyle = '#ff5c8a'; ctx.beginPath(); ctx.ellipse(0, r * 0.55, r * 0.08, r * 0.1, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(-r * 0.16, r * 0.47); ctx.quadraticCurveTo(-r * 0.08, r * 0.55, 0, r * 0.4); ctx.quadraticCurveTo(r * 0.08, r * 0.55, r * 0.16, r * 0.47); ctx.stroke(); }
    // a little neon bow between the ears
    ctx.fillStyle = '#3fd8ff'; ctx.shadowColor = '#3fd8ff'; ctx.shadowBlur = r * 0.25;
    ctx.beginPath(); ctx.moveTo(r * 0.28, -r * 0.78); ctx.lineTo(r * 0.06, -r * 0.92); ctx.lineTo(r * 0.06, -r * 0.64); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(r * 0.28, -r * 0.78); ctx.lineTo(r * 0.5, -r * 0.92); ctx.lineTo(r * 0.5, -r * 0.64); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.28, -r * 0.78, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
})();
