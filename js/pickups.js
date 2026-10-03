// ---------- Field pickups: coins and power-ups on empty cells ----------
// Items lie on empty cells that some arrow's ray crosses, so every item can be collected. A flying arrow collects an
// item when its head passes over the cell (AP.board.update -> ev.onCell -> AP.pickups.collect). Kinds open one by one
// (CONFIG.pickups: firstLevel, every, order):
//   coin      +coinValue coins, the coin flies into the coins pill
//   bomb      pops every arrow with a cell within bombRadius of it (square)
//   fire      the next arrow you tap flies through the others (a flame by the hearts while it is charged)
//   heart     +1 heart
//   lightning pops every arrow that has a cell in its row
// Items only ever remove arrows or help, so a solvable level stays solvable. Event: pickup/<kind>/collect.
(function () {
  const U = AP.util;
  AP.addStrings({
    en: { pk_coin: 'Coins', pk_bomb: 'Bomb', pk_fire: 'Fire', pk_heart: 'Heart', pk_lightning: 'Lightning',
      coach_pk_coin: 'Coins! Send an arrow over them to collect them.', coach_pk_bomb: 'A bomb! Fly an arrow over it to blow up the arrows around it.',
      coach_pk_fire: 'Fire! Collect it and your next arrow flies through the others.', coach_pk_heart: 'A heart! Collect it for one more heart.', coach_pk_lightning: 'Lightning! It clears every arrow in its row.' },
    ru: { pk_coin: 'Монеты', pk_bomb: 'Бомба', pk_fire: 'Огонёк', pk_heart: 'Сердечко', pk_lightning: 'Молния',
      coach_pk_coin: 'Монетки! Пусти стрелку через них, чтобы собрать.', coach_pk_bomb: 'Бомба! Пролети через неё — взорвёт стрелки рядом.',
      coach_pk_fire: 'Огонёк! Собери его — следующая стрелка пролетит сквозь другие.', coach_pk_heart: 'Сердечко! Собери — получишь ещё одно сердце.', coach_pk_lightning: 'Молния! Уберёт все стрелки в своём ряду.' },
    es: { pk_coin: 'Monedas', pk_bomb: 'Bomba', pk_fire: 'Fuego', pk_heart: 'Corazón', pk_lightning: 'Rayo',
      coach_pk_coin: '¡Monedas! Haz pasar una flecha por encima para recogerlas.', coach_pk_bomb: '¡Una bomba! Pasa una flecha por encima y hará explotar las de alrededor.',
      coach_pk_fire: '¡Fuego! Recógelo y tu próxima flecha atravesará las demás.', coach_pk_heart: '¡Un corazón! Recógelo para tener uno más.', coach_pk_lightning: '¡Rayo! Quita todas las flechas de su fila.' },
    de: { pk_coin: 'Münzen', pk_bomb: 'Bombe', pk_fire: 'Feuer', pk_heart: 'Herz', pk_lightning: 'Blitz',
      coach_pk_coin: 'Münzen! Lass einen Pfeil darüber fliegen, um sie einzusammeln.', coach_pk_bomb: 'Eine Bombe! Flieg drüber und die Pfeile drumherum platzen.',
      coach_pk_fire: 'Feuer! Sammle es ein, dann fliegt dein nächster Pfeil durch die anderen.', coach_pk_heart: 'Ein Herz! Sammle es für ein Herz mehr.', coach_pk_lightning: 'Blitz! Er räumt alle Pfeile in seiner Reihe ab.' },
    fr: { pk_coin: 'Pièces', pk_bomb: 'Bombe', pk_fire: 'Flamme', pk_heart: 'Cœur', pk_lightning: 'Éclair',
      coach_pk_coin: 'Des pièces ! Fais passer une flèche dessus pour les ramasser.', coach_pk_bomb: 'Une bombe ! Passe dessus et les flèches autour explosent.',
      coach_pk_fire: 'Une flamme ! Ramasse-la et ta prochaine flèche traversera les autres.', coach_pk_heart: 'Un cœur ! Ramasse-le pour un cœur de plus.', coach_pk_lightning: 'Un éclair ! Il enlève toutes les flèches de sa ligne.' },
    pt: { pk_coin: 'Moedas', pk_bomb: 'Bomba', pk_fire: 'Fogo', pk_heart: 'Coração', pk_lightning: 'Raio',
      coach_pk_coin: 'Moedas! Passe uma seta por cima para pegá-las.', coach_pk_bomb: 'Uma bomba! Passe por cima e as setas em volta explodem.',
      coach_pk_fire: 'Fogo! Pegue e sua próxima seta atravessa as outras.', coach_pk_heart: 'Um coração! Pegue para ter mais um.', coach_pk_lightning: 'Raio! Tira todas as setas da sua linha.' },
    tr: { pk_coin: 'Altınlar', pk_bomb: 'Bomba', pk_fire: 'Ateş', pk_heart: 'Kalp', pk_lightning: 'Şimşek',
      coach_pk_coin: 'Altınlar! Toplamak için üstünden bir ok geçir.', coach_pk_bomb: 'Bomba! Üstünden geç, etrafındaki oklar patlar.',
      coach_pk_fire: 'Ateş! Topla, sonraki okun diğerlerinin içinden geçer.', coach_pk_heart: 'Kalp! Topla, bir kalp daha kazan.', coach_pk_lightning: 'Şimşek! Sırasındaki tüm okları temizler.' },
    pl: { pk_coin: 'Monety', pk_bomb: 'Bomba', pk_fire: 'Ogień', pk_heart: 'Serce', pk_lightning: 'Piorun',
      coach_pk_coin: 'Monety! Przeleć nad nimi strzałką, by je zebrać.', coach_pk_bomb: 'Bomba! Przeleć nad nią, a strzałki obok wybuchną.',
      coach_pk_fire: 'Ogień! Zbierz go, a następna strzałka przeleci przez inne.', coach_pk_heart: 'Serce! Zbierz je, by mieć jedno więcej.', coach_pk_lightning: 'Piorun! Usuwa wszystkie strzałki w swoim rzędzie.' },
    it: { pk_coin: 'Monete', pk_bomb: 'Bomba', pk_fire: 'Fuoco', pk_heart: 'Cuore', pk_lightning: 'Fulmine',
      coach_pk_coin: 'Monete! Fai passare una freccia sopra per raccoglierle.', coach_pk_bomb: 'Una bomba! Passaci sopra e le frecce vicine esplodono.',
      coach_pk_fire: 'Fuoco! Raccoglilo e la prossima freccia passerà attraverso le altre.', coach_pk_heart: 'Un cuore! Raccoglilo per averne uno in più.', coach_pk_lightning: 'Fulmine! Toglie tutte le frecce della sua riga.' },
  });

  const C = () => AP.CONFIG.pickups;
  const PK = AP.pickups = {
    unlockOf(kind) { const c = C(); return c.firstLevel + c.order.indexOf(kind) * c.every; },
    open(kind, n) { return AP.CONFIG.debug.unlockAll || n >= PK.unlockOf(kind); },
    // empty cells (inside the silhouette) that some arrow's ray crosses: every item there can be collected
    rayCells(st) {
      const m = st.m, out = new Map();
      m.arrows.forEach(a => { const h = a.cells[a.cells.length - 1]; let x = h[0] + a.dir[0], y = h[1] + a.dir[1];
        while (x >= 0 && y >= 0 && x < m.w && y < m.h) { if (st.occ[y * m.w + x] < 0 && (!st.mask || st.mask[y * m.w + x])) out.set(x + ',' + y, [x, y]); x += a.dir[0]; y += a.dir[1]; } });
      return [...out.values()];
    },
    // items for level n (seeded, so a retry shows the same ones): st.items = [{kind, x, y, t, got}]
    place(st, n, seed) {
      st.items = []; if (!PK.open('coin', n)) return; const c = C(), R = AP.gen.rng((seed || n) * 7717 + 11), cells = PK.rayCells(st);
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      const coins = Math.min(cells.length, c.coins[0] + Math.floor(R() * (c.coins[1] - c.coins[0] + 1)));
      for (let i = 0; i < coins; i++) st.items.push({ kind: 'coin', x: cells[i][0], y: cells[i][1], t: R() * 6, got: false });
      const specials = c.order.slice(1).filter(k => PK.open(k, n));
      if (specials.length && cells.length > coins && R() < c.specialChance) {
        // the newest kind shows up on the level where it opens, so the coach tip can introduce it
        const fresh = specials.find(k => PK.unlockOf(k) === n); const kind = fresh || specials[Math.floor(R() * specials.length)];
        st.items.push({ kind, x: cells[coins][0], y: cells[coins][1], t: 0, got: false }); }
    },
    at(st, x, y) { return (st.items || []).find(it => !it.got && it.x === x && it.y === y); },
    // ----- drawing -----
    icon(ctx, kind, x, y, r, t = 0) {
      ctx.save();
      if (kind === 'coin') AP.art.currency(ctx, 'coins', x, y, r);
      else if (kind === 'bomb') { ctx.fillStyle = '#2a1650'; ctx.beginPath(); ctx.arc(x, y + r * 0.1, r * 0.82, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ff5ccf'; ctx.lineWidth = r * 0.14; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.moveTo(x + r * 0.45, y - r * 0.55); ctx.quadraticCurveTo(x + r * 0.8, y - r * 1.0, x + r * 0.55, y - r * 1.05); ctx.stroke();
        AP.art.sparkle(ctx, x + r * 0.55, y - r * 1.05, r * (0.32 + 0.12 * Math.sin(t * 14)), '#fff3a0'); }
      else if (kind === 'fire') { const f = 1 + 0.08 * Math.sin(t * 9);
        ctx.translate(x, y + r * 0.3); ctx.scale(f, 2 - f); ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.moveTo(0, -r * 1.15); ctx.bezierCurveTo(r * 0.9, -r * 0.3, r * 0.75, r * 0.6, 0, r * 0.6); ctx.bezierCurveTo(-r * 0.75, r * 0.6, -r * 0.9, -r * 0.3, 0, -r * 1.15); ctx.fill();
        ctx.fillStyle = '#ffd34a'; ctx.beginPath(); ctx.moveTo(0, -r * 0.55); ctx.bezierCurveTo(r * 0.5, -r * 0.05, r * 0.4, r * 0.5, 0, r * 0.5); ctx.bezierCurveTo(-r * 0.4, r * 0.5, -r * 0.5, -r * 0.05, 0, -r * 0.55); ctx.fill(); }
      else if (kind === 'heart') { U.heart(ctx, x, y - r * 0.8, r * 1.9); ctx.fillStyle = '#ff4d6d'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.12; ctx.stroke(); }
      else if (kind === 'lightning') { ctx.fillStyle = '#ffe14a'; ctx.strokeStyle = '#b06a00'; ctx.lineWidth = r * 0.1; ctx.beginPath();
        [[0.2, -1], [-0.55, 0.12], [-0.05, 0.12], [-0.25, 1], [0.55, -0.15], [0.05, -0.15]].forEach((p, i) => i ? ctx.lineTo(x + p[0] * r, y + p[1] * r) : ctx.moveTo(x + p[0] * r, y + p[1] * r)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    },
    draw(ctx, st, v) {
      (st.items || []).forEach(it => { if (it.got) return; it.t += AP.game.dt || 0.016; const x = v.ox + (it.x + 0.5) * v.c, y = v.oy + (it.y + 0.5) * v.c + Math.sin(it.t * 3) * v.c * 0.04;
        const r = Math.max(7, v.c * 0.4), ring = { coin: '#ffc928', bomb: '#ff5ccf', fire: '#ff8a3d', heart: '#ff4d6d', lightning: '#ffe14a' }[it.kind];
        ctx.fillStyle = 'rgba(20,6,60,0.55)'; ctx.beginPath(); ctx.arc(x, y, r * 1.25, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = U.rgba(ring, 0.7 + 0.3 * Math.sin(it.t * 4)); ctx.lineWidth = Math.max(1.5, r * 0.14); ctx.stroke();
        PK.icon(ctx, it.kind, x, y, r * 0.85, it.t); });
    },
    // screen rect of the first item of a kind (coach target)
    rectOf(kind) { const st = AP.board.cur; if (!st || !st.view || !st.items) return null; const it = st.items.find(i => i.kind === kind && !i.got); if (!it) return null;
      const p = AP.board.toScreen([it.x, it.y]), r = Math.max(18 * AP.ui.scale, st.view.c * 0.6); return { x: p[0] - r, y: p[1] - r, w: r * 2, h: r * 2 }; },
  };
})();
