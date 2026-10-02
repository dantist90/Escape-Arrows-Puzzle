// ---------- Board: arrows model, motion, rendering, view (zoom / pan) ----------
// An arrow is a snake of grid cells, tail -> head; it points where its last step points.
// It is FREE when the straight ray from its head to the board edge crosses no occupied cell (its own cells count too).
// Tap a free arrow: it slides along its own body and out along the ray (snake motion) and is removed at once
// (other arrows may already go). Tap a blocked one: it slides up to the blocker, bumps, slides back, and the
// player loses a heart. Removing an arrow never blocks another, so a level is solvable iff greedily removing free
// arrows clears it (AP.board.solve).
(function () {
  const U = AP.util;
  const DIRS = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };

  // 'x,y:MOVES' -> [[x,y], ...] tail -> head
  function parseArrow(str) {
    const [xy, mv = ''] = str.split(':'); const [x0, y0] = xy.split(',').map(Number); const cells = [[x0, y0]];
    for (const ch of mv) { const d = DIRS[ch]; if (!d) continue; const p = cells[cells.length - 1]; cells.push([p[0] + d[0], p[1] + d[1]]); }
    return cells;
  }

  const B = AP.board = {
    parseArrow,
    // ----- pure model (also used by the solver and the QA rig) -----
    // level {w, h, a:[...]} -> {w, h, arrows:[{id, cells, dir}]}
    build(level) {
      const arrows = level.a.map((s, id) => { const cells = parseArrow(s); const n = cells.length;
        const h = cells[n - 1], p = cells[n - 2] || [h[0], h[1] + 1]; return { id, cells, dir: [h[0] - p[0], h[1] - p[1]] }; });
      return { w: level.w, h: level.h, arrows };
    },
    occupancy(m, alive) { const occ = new Int32Array(m.w * m.h).fill(-1); m.arrows.forEach(a => { if (alive[a.id]) a.cells.forEach(c => { occ[c[1] * m.w + c[0]] = a.id; }); }); return occ; },
    // ray from the head: {free, dist (empty cells before the blocker or the edge), blocker id, edge (cells to leave the board)}
    ray(m, occ, a) {
      const h = a.cells[a.cells.length - 1]; let x = h[0] + a.dir[0], y = h[1] + a.dir[1], d = 0;
      while (x >= 0 && y >= 0 && x < m.w && y < m.h) { const o = occ[y * m.w + x]; if (o >= 0) return { free: false, dist: d, blocker: o, edge: 0 }; d++; x += a.dir[0]; y += a.dir[1]; }
      return { free: true, dist: d, blocker: -1, edge: d + 1 };
    },
    // greedy solver: removal order, or null if the level is stuck
    solve(level) {
      const m = B.build(level); const alive = m.arrows.map(() => true); const order = []; let left = m.arrows.length;
      while (left) { const occ = B.occupancy(m, alive); const f = m.arrows.find(a => alive[a.id] && B.ray(m, occ, a).free);
        if (!f) return null; alive[f.id] = false; order.push(f.id); left--; }
      return order;
    },
    // sanity of a level: cells inside, no overlaps, length >= 2
    validate(level) {
      const m = B.build(level); const seen = new Set(); const errs = [];
      m.arrows.forEach(a => { if (a.cells.length < 2) errs.push('arrow ' + a.id + ' too short');
        a.cells.forEach(c => { const k = c[0] + ',' + c[1]; if (c[0] < 0 || c[1] < 0 || c[0] >= m.w || c[1] >= m.h) errs.push('arrow ' + a.id + ' outside at ' + k); if (seen.has(k)) errs.push('overlap at ' + k); seen.add(k); }); });
      return errs;
    },

    // ----- live board -----
    // B.cur = { m, alive[], occ, arrows: [{...model, state, p, path, t, flash, col0, col1}], view, moving }
    cur: null,
    start(level) {
      const m = B.build(level);
      const st = { m, alive: m.arrows.map(() => true), left: m.arrows.length, view: null, shake: 0, sparkT: 0 };
      st.arrows = m.arrows.map(a => ({ ...a, state: 'idle', p: 0, t: 0, flash: 0, glow: 0, alpha: 1 }));
      st.arrows.forEach(a => { const ty = a.cells[0][1] / Math.max(1, m.h - 1), hy = a.cells[a.cells.length - 1][1] / Math.max(1, m.h - 1); a.col0 = B.colorAt(ty * 0.85); a.col1 = B.colorAt(Math.min(1, hy * 0.85 + 0.15)); });
      st.occ = B.occupancy(m, st.alive);
      B.cur = st; return st;
    },
    // board-wide color ramp (top -> bottom) from the current skin
    colorAt(t) { const C = AP.art.TUBE; const k = U.clamp(t, 0, 1) * (C.length - 1); const i = Math.min(C.length - 2, Math.floor(k)); return U.mix(C[i], C[i + 1], k - i); },
    freeIds() { const st = B.cur; if (!st) return []; return st.arrows.filter(a => a.state === 'idle' && st.alive[a.id] && B.ray(st.m, st.occ, a).free).map(a => a.id); },
    busy() { const st = B.cur; return !!st && st.arrows.some(a => a.state === 'fly' || a.state === 'bump'); },

    // path the arrow travels: its own cells then the ray cells (far enough to leave the screen)
    makePath(a, extra) { const path = a.cells.map(c => [c[0], c[1]]); const h = a.cells[a.cells.length - 1];
      for (let i = 1; i <= extra; i++) path.push([h[0] + a.dir[0] * i, h[1] + a.dir[1] * i]); return path; },
    pointAt(path, s) { s = U.clamp(s, 0, path.length - 1); const i = Math.min(path.length - 2, Math.floor(s)), f = s - i; const a = path[i], b = path[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; },
    // grid-space polyline of the arrow body at offset p along its path
    bodyPts(a) { const n = a.cells.length; if (a.state === 'idle' || !a.path) return a.cells; const s0 = a.p, s1 = a.p + n - 1; const pts = [B.pointAt(a.path, s0)];
      for (let i = Math.floor(s0) + 1; i < s1; i++) pts.push(a.path[i]); pts.push(B.pointAt(a.path, s1)); return pts; },

    // ----- actions: returns 'fly' | 'bump' | null -----
    tapArrow(id) {
      const st = B.cur; const a = st && st.arrows[id]; if (!a || a.state !== 'idle' || !st.alive[id]) return null;
      const r = B.ray(st.m, st.occ, a);
      if (r.free) {
        st.alive[id] = false; st.left--; st.occ = B.occupancy(st.m, st.alive);
        const v = st.view; const off = v ? Math.ceil(Math.hypot(v.sw, v.sh) / v.c) + 2 : 40;
        a.path = B.makePath(a, r.edge + a.cells.length + off); a.state = 'fly'; a.t = 0; a.p = 0; a.v = 9; a.out = r.edge + a.cells.length - 1; a.end = a.path.length - a.cells.length;
        return 'fly';
      }
      a.path = B.makePath(a, r.dist + 2); a.state = 'bump'; a.t = 0; a.p = 0; a.reach = r.dist + 0.32; a.blocker = r.blocker; a.hit = false;
      return 'bump';
    },
    // per-frame motion; calls onHit(a) at the bump peak, onGone(a) when a flying arrow leaves the screen
    update(dt, ev = {}) {
      const st = B.cur; if (!st) return; st.shake = Math.max(0, st.shake - dt * 3);
      for (const a of st.arrows) {
        a.flash = Math.max(0, a.flash - dt * 1.6); a.glow = Math.max(0, a.glow - dt);
        if (a.state === 'fly') { a.t += dt; a.v += dt * 70; a.p += a.v * dt;
          if (st.view && Math.random() < 0.9) { const hp = B.pointAt(a.path, a.p + a.cells.length - 1); B.trail(st, hp, a.col1); }
          if (a.p >= a.end) { a.state = 'gone'; if (ev.onGone) ev.onGone(a); } }
        else if (a.state === 'bump') { a.t += dt; const go = 0.1 + 0.035 * a.reach, back = 0.22;
          if (a.t < go) a.p = a.reach * U.easeIn(a.t / go);
          else { if (!a.hit) { a.hit = true; a.flash = 1; const b = st.arrows[a.blocker]; if (b) b.flash = 1; st.shake = 1; if (ev.onHit) ev.onHit(a); }
            const k = U.clamp((a.t - go) / back, 0, 1); a.p = a.reach * (1 - U.easeOut(k)); if (k >= 1) { a.state = 'idle'; a.p = 0; a.path = null; } } }
      }
    },
    trail(st, gp, col) { const v = st.view; const x = v.ox + (gp[0] + 0.5) * v.c, y = v.oy + (gp[1] + 0.5) * v.c;
      AP.emit(1, () => ({ x: x + U.rand(-3, 3), y: y + U.rand(-3, 3), vx: U.rand(-20, 20), vy: U.rand(-20, 20), r: U.rand(1.5, 3.5) * AP.ui.scale, life: 0.45, maxLife: 0.45, color: U.lighten(col, 0.4), layer: 0 })); },

    // ----- view: c = px per cell, (ox, oy) = screen of grid corner; zoom between fit and max -----
    fit(rect) {
      const st = B.cur; const m = st.m; const s = AP.ui.scale; const pad = 14 * s;
      const cFit = Math.max(4, Math.min((rect.w - pad * 2) / m.w, (rect.h - pad * 2) / m.h, 88 * s));
      const cMax = Math.max(cFit, Math.min(52 * s, cFit * 4));
      const v = st.view;
      if (v && v.rect && v.rect.w === rect.w && v.rect.h === rect.h && v.rect.x === rect.x && v.rect.y === rect.y) return v;
      const keepZoom = v ? U.clamp(v.c / v.cFit, 1, cMax / cFit) : 1;
      st.view = { rect, cFit, cMax, c: cFit * keepZoom, ox: 0, oy: 0, sw: rect.w, sh: rect.h };
      B.center(); return st.view;
    },
    center() { const st = B.cur, v = st.view; v.ox = v.rect.x + v.rect.w / 2 - st.m.w * v.c / 2; v.oy = v.rect.y + v.rect.h / 2 - st.m.h * v.c / 2; },
    zoomable() { const v = B.cur && B.cur.view; return !!v && v.cMax > v.cFit * 1.15; },
    // zoom by factor k around screen point (x, y)
    zoomAt(x, y, k) { const st = B.cur, v = st.view; if (!v) return; const nc = U.clamp(v.c * k, v.cFit, v.cMax); const gx = (x - v.ox) / v.c, gy = (y - v.oy) / v.c;
      v.c = nc; v.ox = x - gx * nc; v.oy = y - gy * nc; B.clampPan(); },
    pan(dx, dy) { const v = B.cur.view; v.ox += dx; v.oy += dy; B.clampPan(); },
    // the board may not leave the stage: when smaller than the stage it stays centred on that axis
    clampPan() { const st = B.cur, v = st.view, bw = st.m.w * v.c, bh = st.m.h * v.c, R = v.rect;
      v.ox = bw <= R.w ? R.x + R.w / 2 - bw / 2 : U.clamp(v.ox, R.x + R.w - bw - 20, R.x + 20);
      v.oy = bh <= R.h ? R.y + R.h / 2 - bh / 2 : U.clamp(v.oy, R.y + R.h - bh - 20, R.y + 20); },
    toGrid(x, y) { const v = B.cur.view; return [(x - v.ox) / v.c - 0.5, (y - v.oy) / v.c - 0.5]; },
    toScreen(g) { const v = B.cur.view; return [v.ox + (g[0] + 0.5) * v.c, v.oy + (g[1] + 0.5) * v.c]; },
    // nearest idle arrow to a screen point within a forgiving radius
    pick(x, y) {
      const st = B.cur, v = st.view; const [gx, gy] = B.toGrid(x, y); const lim = Math.max(0.62, 16 * AP.ui.scale / v.c); let best = null, bd = lim;
      for (const a of st.arrows) { if (a.state !== 'idle' || !st.alive[a.id]) continue; const c = a.cells;
        for (let i = 0; i < c.length - 1; i++) { const d = segDist(gx, gy, c[i], c[i + 1]); if (d < bd) { bd = d; best = a; } } }
      return best;
    },
    // screen centre of an arrow (for the QA rig and hints): its middle cell
    screenOf(id) { const a = B.cur.arrows[id]; return B.toScreen(a.cells[Math.floor(a.cells.length / 2)]); },

    // ----- drawing -----
    draw(ctx) {
      const st = B.cur; if (!st || !st.view) return; const v = st.view, R = v.rect; const s = AP.ui.scale;
      ctx.save(); if (st.shake > 0) ctx.translate(Math.sin(AP.game.t * 70) * st.shake * 5 * s, 0);
      // dot grid (only the visible part)
      const x0 = Math.max(0, Math.floor((R.x - v.ox) / v.c) - 1), x1 = Math.min(st.m.w, Math.ceil((R.x + R.w - v.ox) / v.c) + 1);
      const y0 = Math.max(0, Math.floor((R.y - v.oy) / v.c) - 1), y1 = Math.min(st.m.h, Math.ceil((R.y + R.h - v.oy) / v.c) + 1);
      ctx.fillStyle = 'rgba(200,180,255,0.22)'; const dr = U.clamp(v.c * 0.05, 1, 3);
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { ctx.beginPath(); ctx.arc(v.ox + (x + 0.5) * v.c, v.oy + (y + 0.5) * v.c, dr, 0, Math.PI * 2); ctx.fill(); }
      // idle arrows under moving ones
      for (const a of st.arrows) if (a.state === 'idle' && st.alive[a.id]) B.drawArrow(ctx, a, v);
      for (const a of st.arrows) if (a.state === 'bump') B.drawArrow(ctx, a, v);
      for (const a of st.arrows) if (a.state === 'fly') B.drawArrow(ctx, a, v);
      ctx.restore();
    },
    drawArrow(ctx, a, v) {
      const g = B.bodyPts(a); const pts = g.map(p => [v.ox + (p[0] + 0.5) * v.c, v.oy + (p[1] + 0.5) * v.c]); if (pts.length < 2) return;
      const W = Math.max(2.2, v.c * 0.3); const red = a.flash > 0 ? Math.min(1, a.flash * 1.4) : 0;
      const c0 = red ? U.mix(a.col0, '#ff2d55', red) : a.col0, c1 = red ? U.mix(a.col1, '#ff2d55', red) : a.col1;
      const A = pts[0], Z = pts[pts.length - 1]; const grad = ctx.createLinearGradient(A[0], A[1], Z[0], Z[1]); grad.addColorStop(0, c0); grad.addColorStop(1, c1);
      const line = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); };
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      // glow without shadowBlur (cheap for hundreds of arrows): a wide faint stroke under the tube
      ctx.globalAlpha = 0.15 + a.glow * 0.4; ctx.strokeStyle = grad; ctx.lineWidth = W * (2.0 + a.glow * 1.5); line(); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = W; line(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = W * 0.3; line(); ctx.stroke();
      // head: direction of the last body segment
      const P = pts[pts.length - 2]; const ang = Math.atan2(Z[1] - P[1], Z[0] - P[0]); const L = Math.max(5, v.c * 0.42);
      ctx.translate(Z[0], Z[1]); ctx.rotate(ang); ctx.fillStyle = c1;
      ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(L * 0.2, 0, L * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.moveTo(L * 0.85, 0); ctx.lineTo(-L * 0.35, -L * 0.62); ctx.lineTo(-L * 0.12, 0); ctx.lineTo(-L * 0.35, L * 0.62); ctx.closePath(); ctx.fill();
      ctx.restore();
    },
  };
  function segDist(px, py, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1]; const L = dx * dx + dy * dy; const t = L ? U.clamp(((px - a[0]) * dx + (py - a[1]) * dy) / L, 0, 1) : 0;
    return Math.hypot(px - (a[0] + dx * t), py - (a[1] + dy * t)); }
})();
