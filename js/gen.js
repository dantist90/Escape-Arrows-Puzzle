// ---------- Level generator (seeded; runs in the game for endless levels and in Node for baking) ----------
// Solvable by construction. Arrows are placed one by one; a new arrow's RAY (head -> board edge) must not touch any
// arrow placed before it. Then the reverse placement order clears the board: when an arrow's turn comes, everything
// placed before it is still there but off its ray, and everything placed after it is already gone.
// Its body may cross older rays freely — that is what makes arrows block each other.
// Difficulty comes from size, arrow length, bends and the chain depth (layers of "free now" removals).
(function () {
  const DIRS = [[0, -1, 'U'], [0, 1, 'D'], [-1, 0, 'L'], [1, 0, 'R']];
  const MOVE = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };

  // mulberry32: tiny deterministic RNG
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // silhouettes: (u, v) in [-1, 1], v down -> inside?
  const SHAPES = {
    rect: () => true,
    circle: (u, v) => u * u + v * v <= 1.0,
    diamond: (u, v) => Math.abs(u) + Math.abs(v) <= 1.05,
    heart: (u, v) => { const x = u * 1.22, y = -v * 1.25 + 0.28; const a = x * x + y * y - 1; return a * a * a - x * x * y * y * y <= 0; },
    star: (u, v) => { const r = Math.hypot(u, v), t = Math.atan2(v, u) + Math.PI / 2; const k = Math.cos(5 * t / 2); return r <= 0.5 + 0.5 * Math.pow(Math.abs(k), 1.4) + 0.02; },
    flower: (u, v) => { const r = Math.hypot(u, v), t = Math.atan2(v, u); return r <= 0.62 + 0.38 * Math.abs(Math.cos(2.5 * t)); },
    cat: (u, v) => { const head = u * u / 0.9 + (v - 0.2) * (v - 0.2) / 0.64 <= 1; const ear = (cx) => v < -0.3 && v > -1 && Math.abs(u - cx) <= (v + 1) * 0.45; return head || ear(-0.55) || ear(0.55); },
    crown: (u, v) => { if (v > 0.15 && v <= 0.95) return Math.abs(u) <= 0.95; if (v > 0.95) return false; const spikes = [-0.8, 0, 0.8]; return spikes.some(cx => Math.abs(u - cx) <= (v + 1) * 0.28); },
    butterfly: (u, v) => { const au = Math.abs(u); const top = (au - 0.5) * (au - 0.5) / 0.25 + (v + 0.35) * (v + 0.35) / 0.42 <= 1; const bot = (au - 0.42) * (au - 0.42) / 0.17 + (v - 0.5) * (v - 0.5) / 0.2 <= 1; return top || bot || (au < 0.12 && v > -0.7 && v < 0.8); },
  };

  function maskOf(w, h, shape) {
    const f = SHAPES[shape] || SHAPES.rect; const m = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const u = (x + 0.5) / w * 2 - 1, v = (y + 0.5) / h * 2 - 1; m[y * w + x] = f(u, v) ? 1 : 0; }
    return m;
  }

  // p: {w, h, shape, minLen, maxLen, turn (0..1 chance to bend at each step)}
  function make(p, seed) {
    const R = rng(seed); const { w, h } = p; const mask = maskOf(w, h, p.shape); const occ = new Int16Array(w * h).fill(-1); const placed = [];
    const inB = (x, y) => x >= 0 && y >= 0 && x < w && y < h; const free = (x, y) => inB(x, y) && mask[y * w + x] && occ[y * w + x] < 0;
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const rayClear = (x, y, d) => { x += d[0]; y += d[1]; while (inB(x, y)) { if (occ[y * w + x] >= 0) return false; x += d[0]; y += d[1]; } return true; };
    const onRay = (hx, hy, d, x, y) => d[0] ? (y === hy && (x - hx) * d[0] > 0) : (x === hx && (y - hy) * d[1] > 0);
    // heads are tried from the centre outwards (with noise): inner arrows go first with long rays across the still empty
    // board, outer arrows come later and lie across those rays — that is what makes chains deep and the fill dense
    const cx = (w - 1) / 2, cy = (h - 1) / 2, rad = Math.hypot(cx, cy) || 1; const key = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) key[i] = Math.hypot(i % w - cx, Math.floor(i / w) - cy) / rad + R() * (p.noise ?? 0.3);
    let progress = true;
    while (progress) {
      progress = false; const cells = []; for (let i = 0; i < w * h; i++) if (mask[i] && occ[i] < 0) cells.push(i);
      cells.sort((a, b) => key[a] - key[b]);
      for (const ci of cells) {
        if (occ[ci] >= 0) continue; const hx = ci % w, hy = Math.floor(ci / w);
        for (const d of shuffle(DIRS.slice())) {
          const px = hx - d[0], py = hy - d[1]; if (!free(px, py) || !rayClear(hx, hy, d)) continue;
          // grow the body backwards from the head: a random walk through free cells, never onto its own ray
          const body = [[hx, hy], [px, py]]; const used = new Set([ci, py * w + px]); let back = [-d[0], -d[1]];
          const L = p.minLen + Math.floor(R() * (p.maxLen - p.minLen + 1));
          while (body.length < L) { const c = body[body.length - 1];
            const opts = DIRS.filter(q => !(q[0] === -back[0] && q[1] === -back[1])).map(q => [q[0], q[1]]);
            opts.sort((a, b) => ((a[0] === back[0] && a[1] === back[1]) ? -1 : 0) - ((b[0] === back[0] && b[1] === back[1]) ? -1 : 0));
            const order = R() < p.turn ? shuffle(opts) : opts; let moved = false;
            for (const q of order) { const nx = c[0] + q[0], ny = c[1] + q[1]; if (!free(nx, ny) || used.has(ny * w + nx) || onRay(hx, hy, d, nx, ny)) continue;
              body.push([nx, ny]); used.add(ny * w + nx); back = q; moved = true; break; }
            if (!moved) break; }
          if (body.length < 2) continue;
          const id = placed.length; body.forEach(c => { occ[c[1] * w + c[0]] = id; }); placed.push(body.reverse()); progress = true; break;
        }
      }
    }
    // encode tail -> head as 'x,y:MOVES'
    const a = placed.map(cells => { let s = cells[0][0] + ',' + cells[0][1] + ':'; for (let i = 1; i < cells.length; i++) { const dx = cells[i][0] - cells[i - 1][0], dy = cells[i][1] - cells[i - 1][1]; s += dx > 0 ? 'R' : dx < 0 ? 'L' : dy > 0 ? 'D' : 'U'; } return s; });
    const lv = { w, h, a }; if (p.shape && p.shape !== 'rect') lv.shape = p.shape;
    let inMask = 0, filled = 0; for (let i = 0; i < w * h; i++) if (mask[i]) { inMask++; if (occ[i] >= 0) filled++; }
    lv.fill = Math.round(filled / Math.max(1, inMask) * 100) / 100;
    return lv;
  }

  // chain depth: rounds of "remove every free arrow at once"; also how many are free at the start
  function stats(lv) {
    const B = AP.board; const m = B.build(lv); const alive = m.arrows.map(() => true); let left = m.arrows.length, layers = 0, free0 = -1;
    while (left) { const occ = B.occupancy(m, alive); const fr = m.arrows.filter(a => alive[a.id] && B.ray(m, occ, a).free); if (free0 < 0) free0 = fr.length; if (!fr.length) return { stuck: true };
      fr.forEach(a => { alive[a.id] = false; left--; }); layers++; }
    const len = m.arrows.reduce((s, a) => s + a.cells.length, 0) / Math.max(1, m.arrows.length);
    return { arrows: m.arrows.length, layers, free0, len: Math.round(len * 10) / 10 };
  }

  // ----- difficulty curve (see docs/GDD.md): 1-10 easy, then every 10th super hard, every 5th hard, the rest normal -----
  function diffOf(n) { if (n <= 10) return 'easy'; if (n % 10 === 0) return 'superhard'; if (n % 5 === 0) return 'hard'; return 'normal'; }
  const SHAPE_ROT = ['heart', 'star', 'cat', 'butterfly', 'crown', 'flower', 'circle', 'diamond'];
  function params(n) {
    const diff = diffOf(n); const t = Math.min(1, Math.max(0, (n - 10) / 90)); // 0 at level 10 -> 1 at level 100
    const R = rng(n * 7919 + 13); const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
    if (diff === 'easy') { const w = 4 + Math.floor((n - 3) / 3); return { diff, w, h: w + ri(1, 3), shape: 'rect', minLen: 2, maxLen: 3 + Math.floor(n / 3), turn: 0.3 }; }
    if (diff === 'normal') { const w = 7 + Math.round(4 * t) + ri(0, 1); return { diff, w, h: w + ri(2, 4), shape: n % 3 === 0 ? SHAPE_ROT[(n / 3 | 0) % SHAPE_ROT.length] : 'rect', minLen: 3, maxLen: 7 + Math.round(5 * t), turn: 0.4 }; }
    if (diff === 'hard') { const w = 10 + Math.round(4 * t) + ri(0, 1); return { diff, w, h: w + ri(2, 4), shape: SHAPE_ROT[(n / 5 | 0) % SHAPE_ROT.length], minLen: 4, maxLen: 10 + Math.round(6 * t), turn: 0.45 }; }
    const w = 13 + Math.round(5 * t) + ri(0, 1); return { diff, w, h: w + ri(3, 5), shape: SHAPE_ROT[(n / 10 | 0) % SHAPE_ROT.length], minLen: 4, maxLen: 14 + Math.round(8 * t), turn: 0.5 };
  }
  // best of a few seeds: good fill, and a chain depth that suits the difficulty
  function level(n, tries = 6) {
    const p = params(n); let best = null, bestScore = -1e9;
    for (let k = 0; k < tries; k++) {
      const lv = make(p, n * 1000 + k); const st = stats(lv); if (st.stuck || st.arrows < 2) continue;
      const wantDepth = { easy: 3, normal: 6, hard: 9, superhard: 12 }[p.diff];
      const score = lv.fill * 10 - Math.abs(st.layers - wantDepth) * (p.diff === 'easy' ? 1 : 0.6) - (p.diff === 'easy' ? Math.max(0, st.free0 - 3) * 0.5 : 0);
      if (score > bestScore) { bestScore = score; best = { ...lv, diff: p.diff }; }
    }
    if (best) delete best.fill;
    return best;
  }

  AP.gen = { rng, SHAPES, maskOf, make, stats, diffOf, params, level, MOVE };
})();
