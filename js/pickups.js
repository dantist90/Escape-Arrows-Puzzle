// ---------- Field pickups: coins and power-ups on empty cells ----------
// Items lie on empty cells that some arrow's ray crosses, so every item can be collected. A flying arrow collects an
// item when its head passes over the cell (AP.board.update -> ev.onCell -> AP.pickups.collect). Kinds open one by one
// (CONFIG.pickups: firstLevel, every, order):
//   coin      +coinValue coins, the coin flies into the coins pill
//   bomb      pops every arrow with a cell within bombRadius of it (square)
//   fire      the next arrow you tap flies through the others (a flame by the hearts while it is charged)
//   heart     +1 heart
//   lightning pops every arrow that has a cell in its row
// Level mechanics (CONFIG.pickups.order goes on: key 23, rotator 27, portal 31):
//   lock + key  a locked arrow does not move until a flying arrow passes over its key (same colour)
//   rotator     an arrow's head that enters the cell turns to the rotator's direction
//   portal      two linked cells: a head entering one comes out of the other, same direction
// Every mechanic is placed only if the greedy solver (AP.board.solveLive) still clears the board.
// Items only ever remove arrows or help, so a solvable level stays solvable. Event: pickup/<kind>/collect.
(function () {
  const U = AP.util;
  AP.addStrings({
    en: { pk_key: 'Key', pk_rotator: 'Turn tile', pk_portal: 'Portal', need_key: 'Locked! Collect its key first', coach_pk_key: 'A locked arrow! Send another arrow over the key of the same colour to open it.', coach_pk_rotator: 'A turn tile! An arrow flying over it turns where the tile points.', coach_pk_portal: 'Portals! An arrow flying into one comes out of the other.', pk_coin: 'Coins', pk_bomb: 'Bomb', pk_fire: 'Fire', pk_heart: 'Heart', pk_lightning: 'Lightning',
      coach_pk_coin: 'Coins! Send an arrow over them to collect them.', coach_pk_bomb: 'A bomb! Fly an arrow over it to blow up the arrows around it.',
      coach_pk_fire: 'Fire! Collect it and your next arrow flies through the others.', coach_pk_heart: 'A heart! Collect it for one more heart.', coach_pk_lightning: 'Lightning! It clears every arrow in its row.' },
    ru: { pk_key: 'Ключ', pk_rotator: 'Поворот', pk_portal: 'Портал', need_key: 'Заперто! Сначала собери ключ', coach_pk_key: 'Стрелка на замке! Пусти другую стрелку через ключ того же цвета — замок откроется.', coach_pk_rotator: 'Поворот! Стрелка, пролетая по нему, поворачивает туда, куда он указывает.', coach_pk_portal: 'Порталы! Стрелка влетает в один и вылетает из другого.', pk_coin: 'Монеты', pk_bomb: 'Бомба', pk_fire: 'Огонёк', pk_heart: 'Сердечко', pk_lightning: 'Молния',
      coach_pk_coin: 'Монетки! Пусти стрелку через них, чтобы собрать.', coach_pk_bomb: 'Бомба! Пролети через неё — взорвёт стрелки рядом.',
      coach_pk_fire: 'Огонёк! Собери его — следующая стрелка пролетит сквозь другие.', coach_pk_heart: 'Сердечко! Собери — получишь ещё одно сердце.', coach_pk_lightning: 'Молния! Уберёт все стрелки в своём ряду.' },
    es: { pk_key: 'Llave', pk_rotator: 'Giro', pk_portal: 'Portal', need_key: '¡Cerrada! Primero coge su llave', coach_pk_key: '¡Una flecha con candado! Pasa otra flecha por la llave del mismo color para abrirla.', coach_pk_rotator: '¡Un giro! La flecha que pasa por encima gira hacia donde apunta.', coach_pk_portal: '¡Portales! La flecha entra por uno y sale por el otro.', pk_coin: 'Monedas', pk_bomb: 'Bomba', pk_fire: 'Fuego', pk_heart: 'Corazón', pk_lightning: 'Rayo',
      coach_pk_coin: '¡Monedas! Haz pasar una flecha por encima para recogerlas.', coach_pk_bomb: '¡Una bomba! Pasa una flecha por encima y hará explotar las de alrededor.',
      coach_pk_fire: '¡Fuego! Recógelo y tu próxima flecha atravesará las demás.', coach_pk_heart: '¡Un corazón! Recógelo para tener uno más.', coach_pk_lightning: '¡Rayo! Quita todas las flechas de su fila.' },
    de: { pk_key: 'Schlüssel', pk_rotator: 'Dreher', pk_portal: 'Portal', need_key: 'Verschlossen! Hol erst den Schlüssel', coach_pk_key: 'Ein Pfeil mit Schloss! Flieg mit einem anderen Pfeil über den Schlüssel in derselben Farbe.', coach_pk_rotator: 'Ein Dreher! Ein Pfeil darüber biegt in seine Richtung ab.', coach_pk_portal: 'Portale! Ein Pfeil fliegt in eins hinein und aus dem anderen heraus.', pk_coin: 'Münzen', pk_bomb: 'Bombe', pk_fire: 'Feuer', pk_heart: 'Herz', pk_lightning: 'Blitz',
      coach_pk_coin: 'Münzen! Lass einen Pfeil darüber fliegen, um sie einzusammeln.', coach_pk_bomb: 'Eine Bombe! Flieg drüber und die Pfeile drumherum platzen.',
      coach_pk_fire: 'Feuer! Sammle es ein, dann fliegt dein nächster Pfeil durch die anderen.', coach_pk_heart: 'Ein Herz! Sammle es für ein Herz mehr.', coach_pk_lightning: 'Blitz! Er räumt alle Pfeile in seiner Reihe ab.' },
    fr: { pk_key: 'Clé', pk_rotator: 'Virage', pk_portal: 'Portail', need_key: 'Verrouillée ! Ramasse d’abord sa clé', coach_pk_key: 'Une flèche verrouillée ! Fais passer une autre flèche sur la clé de même couleur.', coach_pk_rotator: 'Un virage ! La flèche qui passe dessus tourne dans sa direction.', coach_pk_portal: 'Des portails ! La flèche entre dans l’un et ressort de l’autre.', pk_coin: 'Pièces', pk_bomb: 'Bombe', pk_fire: 'Flamme', pk_heart: 'Cœur', pk_lightning: 'Éclair',
      coach_pk_coin: 'Des pièces ! Fais passer une flèche dessus pour les ramasser.', coach_pk_bomb: 'Une bombe ! Passe dessus et les flèches autour explosent.',
      coach_pk_fire: 'Une flamme ! Ramasse-la et ta prochaine flèche traversera les autres.', coach_pk_heart: 'Un cœur ! Ramasse-le pour un cœur de plus.', coach_pk_lightning: 'Un éclair ! Il enlève toutes les flèches de sa ligne.' },
    pt: { pk_key: 'Chave', pk_rotator: 'Curva', pk_portal: 'Portal', need_key: 'Trancada! Pegue a chave primeiro', coach_pk_key: 'Uma seta trancada! Passe outra seta pela chave da mesma cor.', coach_pk_rotator: 'Uma curva! A seta que passa por ela vira para onde ela aponta.', coach_pk_portal: 'Portais! A seta entra num e sai pelo outro.', pk_coin: 'Moedas', pk_bomb: 'Bomba', pk_fire: 'Fogo', pk_heart: 'Coração', pk_lightning: 'Raio',
      coach_pk_coin: 'Moedas! Passe uma seta por cima para pegá-las.', coach_pk_bomb: 'Uma bomba! Passe por cima e as setas em volta explodem.',
      coach_pk_fire: 'Fogo! Pegue e sua próxima seta atravessa as outras.', coach_pk_heart: 'Um coração! Pegue para ter mais um.', coach_pk_lightning: 'Raio! Tira todas as setas da sua linha.' },
    tr: { pk_key: 'Anahtar', pk_rotator: 'Dönüş', pk_portal: 'Portal', need_key: 'Kilitli! Önce anahtarını topla', coach_pk_key: 'Kilitli ok! Aynı renkteki anahtarın üstünden başka bir ok geçir.', coach_pk_rotator: 'Dönüş karesi! Üstünden geçen ok gösterdiği yöne döner.', coach_pk_portal: 'Portallar! Ok birine girer, diğerinden çıkar.', pk_coin: 'Altınlar', pk_bomb: 'Bomba', pk_fire: 'Ateş', pk_heart: 'Kalp', pk_lightning: 'Şimşek',
      coach_pk_coin: 'Altınlar! Toplamak için üstünden bir ok geçir.', coach_pk_bomb: 'Bomba! Üstünden geç, etrafındaki oklar patlar.',
      coach_pk_fire: 'Ateş! Topla, sonraki okun diğerlerinin içinden geçer.', coach_pk_heart: 'Kalp! Topla, bir kalp daha kazan.', coach_pk_lightning: 'Şimşek! Sırasındaki tüm okları temizler.' },
    pl: { pk_key: 'Klucz', pk_rotator: 'Zakręt', pk_portal: 'Portal', need_key: 'Zamknięte! Najpierw zbierz klucz', coach_pk_key: 'Strzałka na kłódkę! Przeleć inną strzałką nad kluczem w tym samym kolorze.', coach_pk_rotator: 'Zakręt! Strzałka nad nim skręca tam, gdzie wskazuje.', coach_pk_portal: 'Portale! Strzałka wlatuje w jeden i wylatuje z drugiego.', pk_coin: 'Monety', pk_bomb: 'Bomba', pk_fire: 'Ogień', pk_heart: 'Serce', pk_lightning: 'Piorun',
      coach_pk_coin: 'Monety! Przeleć nad nimi strzałką, by je zebrać.', coach_pk_bomb: 'Bomba! Przeleć nad nią, a strzałki obok wybuchną.',
      coach_pk_fire: 'Ogień! Zbierz go, a następna strzałka przeleci przez inne.', coach_pk_heart: 'Serce! Zbierz je, by mieć jedno więcej.', coach_pk_lightning: 'Piorun! Usuwa wszystkie strzałki w swoim rzędzie.' },
    it: { pk_key: 'Chiave', pk_rotator: 'Svolta', pk_portal: 'Portale', need_key: 'Bloccata! Prima prendi la chiave', coach_pk_key: 'Una freccia col lucchetto! Fai passare un’altra freccia sulla chiave dello stesso colore.', coach_pk_rotator: 'Una svolta! La freccia che ci passa sopra gira dove punta.', coach_pk_portal: 'Portali! La freccia entra in uno ed esce dall’altro.', pk_coin: 'Monete', pk_bomb: 'Bomba', pk_fire: 'Fuoco', pk_heart: 'Cuore', pk_lightning: 'Fulmine',
      coach_pk_coin: 'Monete! Fai passare una freccia sopra per raccoglierle.', coach_pk_bomb: 'Una bomba! Passaci sopra e le frecce vicine esplodono.',
      coach_pk_fire: 'Fuoco! Raccoglilo e la prossima freccia passerà attraverso le altre.', coach_pk_heart: 'Un cuore! Raccoglilo per averne uno in più.', coach_pk_lightning: 'Fulmine! Toglie tutte le frecce della sua riga.' },
  });

  const C = () => AP.CONFIG.pickups, B = () => AP.board;
  const PK = AP.pickups = {
    unlockOf(kind) { const c = C(); return c.firstLevel + c.order.indexOf(kind) * c.every; },
    open(kind, n) { return AP.CONFIG.debug.unlockAll || n >= PK.unlockOf(kind); },
    // empty cells (inside the silhouette, no mechanic on them) that some arrow's way out crosses: items there can be collected
    rayCells(st, except) {
      const m = st.m, out = new Map();
      m.arrows.forEach(a => { if (except !== undefined && a.id === except) return; B().ray(m, st.occ, a, true).cells.forEach(([x, y]) => { const i = y * m.w + x;
        if (st.occ[i] < 0 && (!st.mask || st.mask[i]) && !(m.field && m.field[i]) && !PK.at(st, x, y)) out.set(x + ',' + y, [x, y]); }); });
      return [...out.values()];
    },
    emptyCells(st) { const m = st.m, out = []; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const i = y * m.w + x; if (st.occ[i] < 0 && (!st.mask || st.mask[i]) && !(m.field && m.field[i]) && !PK.at(st, x, y)) out.push([x, y]); } return out; },
    // mechanics + items for level n (seeded, so a retry shows the same ones)
    place(st, n, seed) {
      st.items = []; st.locked = {}; st.m.field = {}; st.portals = 0; const c = C(), R = AP.gen.rng((seed || n) * 7717 + 11), m = st.m;
      const pick = arr => arr[Math.floor(R() * arr.length)], cnt = r => Array.isArray(r) ? r[0] + Math.floor(R() * (r[1] - r[0] + 1)) : r;
      const KEYC = ['#ffd24a', '#3fd8ff', '#46e08a'];
      // rotators: on a cell some head passes; a random new heading (not straight back)
      if (PK.open('rotator', n)) for (let k = cnt(c.rotators), tries = 0; k > 0 && tries < 40; tries++) {
        const cells = PK.rayCells(st); if (!cells.length) break; const [x, y] = pick(cells), i = y * m.w + x, d = pick([[0, -1], [0, 1], [-1, 0], [1, 0]]);
        m.field[i] = { t: 'rot', d }; if (B().solveLive(st)) k--; else delete m.field[i]; }
      // portals: an entry on a head's way, the exit on any other empty cell (not next to it)
      if (PK.open('portal', n)) for (let k = cnt(c.portals), tries = 0; k > 0 && tries < 40; tries++) {
        const a = pick(PK.rayCells(st) || []), all = PK.emptyCells(st).filter(e => a && Math.abs(e[0] - a[0]) + Math.abs(e[1] - a[1]) > 3); if (!a || !all.length) break; const b = pick(all);
        const ia = a[1] * m.w + a[0], ib = b[1] * m.w + b[0], col = ['#c06bff', '#3fd8ff'][st.portals % 2];
        m.field[ia] = { t: 'portal', to: b, col }; m.field[ib] = { t: 'portal', to: a, col };
        if (B().solveLive(st)) { k--; st.portals++; } else { delete m.field[ia]; delete m.field[ib]; } }
      // locks: an arrow of 3+ cells is locked; its key lies on another arrow's way out
      if (PK.open('key', n)) for (let k = cnt(c.locks), tries = 0; k > 0 && tries < 40; tries++) {
        const cand = m.arrows.filter(a => a.cells.length >= 3 && !st.locked[a.id]); if (!cand.length) break; const L = pick(cand);
        const cells = PK.rayCells(st, L.id); if (!cells.length) continue; const [x, y] = pick(cells), lockN = Object.keys(st.locked).length;
        st.locked[L.id] = true; const key = { kind: 'key', x, y, t: 0, got: false, lock: L.id, col: KEYC[lockN % KEYC.length] }; st.items.push(key); L.lockCol = key.col; st.arrows[L.id].lockCol = key.col;
        if (B().solveLive(st)) k--; else { delete st.locked[L.id]; st.items.pop(); } }
      // coins and one special item on reachable cells
      if (!PK.open('coin', n)) return;
      const cells = PK.rayCells(st); for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
      const coins = Math.min(cells.length, c.coins[0] + Math.floor(R() * (c.coins[1] - c.coins[0] + 1)));
      for (let i = 0; i < coins; i++) st.items.push({ kind: 'coin', x: cells[i][0], y: cells[i][1], t: R() * 6, got: false });
      const specials = ['bomb', 'fire', 'heart', 'lightning'].filter(k => PK.open(k, n));
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
      else if (kind === 'key') { const col = arguments[6] || '#ffd24a'; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = r * 0.26; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x - r * 0.38, y, r * 0.38, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.9, y); ctx.moveTo(x + r * 0.55, y); ctx.lineTo(x + r * 0.55, y + r * 0.35); ctx.moveTo(x + r * 0.85, y); ctx.lineTo(x + r * 0.85, y + r * 0.3); ctx.stroke(); }
      else if (kind === 'lightning') { ctx.fillStyle = '#ffe14a'; ctx.strokeStyle = '#b06a00'; ctx.lineWidth = r * 0.1; ctx.beginPath();
        [[0.2, -1], [-0.55, 0.12], [-0.05, 0.12], [-0.25, 1], [0.55, -0.15], [0.05, -0.15]].forEach((p, i) => i ? ctx.lineTo(x + p[0] * r, y + p[1] * r) : ctx.moveTo(x + p[0] * r, y + p[1] * r)); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    },
    draw(ctx, st, v) {
      PK.drawField(ctx, st, v);
      (st.items || []).forEach(it => { if (it.got) return; it.t += AP.game.dt || 0.016; const x = v.ox + (it.x + 0.5) * v.c, y = v.oy + (it.y + 0.5) * v.c + Math.sin(it.t * 3) * v.c * 0.04;
        const r = Math.max(7, v.c * 0.4), ring = { key: it.col || '#ffd24a', coin: '#ffc928', bomb: '#ff5ccf', fire: '#ff8a3d', heart: '#ff4d6d', lightning: '#ffe14a' }[it.kind];
        ctx.fillStyle = 'rgba(20,6,60,0.55)'; ctx.beginPath(); ctx.arc(x, y, r * 1.25, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = U.rgba(ring, 0.7 + 0.3 * Math.sin(it.t * 4)); ctx.lineWidth = Math.max(1.5, r * 0.14); ctx.stroke();
        PK.icon(ctx, it.kind, x, y, r * 0.85, it.t, it.col); });
    },
    // rotator tiles (a turn arrow) and portals (swirling rings); drawn under the items and the arrows
    drawField(ctx, st, v) {
      const m = st.m, F = m.field; if (!F) return; const t = AP.game.t;
      for (const k in F) { const f = F[k], i = +k, x = v.ox + (i % m.w + 0.5) * v.c, y = v.oy + (Math.floor(i / m.w) + 0.5) * v.c, r = v.c * 0.42;
        ctx.save();
        if (f.t === 'rot') { ctx.fillStyle = 'rgba(255,255,255,0.14)'; U.rr(ctx, x - r, y - r, r * 2, r * 2, r * 0.35); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = Math.max(1, r * 0.1); ctx.stroke();
          ctx.translate(x, y); ctx.rotate(Math.atan2(f.d[1], f.d[0])); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = Math.max(1.5, r * 0.2); ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(-r * 0.15, r * 0.45, r * 0.55, -Math.PI / 2, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(r * 0.75, -r * 0.1); ctx.lineTo(r * 0.25, -r * 0.42); ctx.lineTo(r * 0.25, r * 0.22); ctx.closePath(); ctx.fill(); }
        else if (f.t === 'portal') { for (let j = 0; j < 3; j++) { ctx.strokeStyle = U.rgba(f.col, 0.9 - j * 0.25); ctx.lineWidth = Math.max(1.5, r * 0.16); ctx.beginPath(); ctx.arc(x, y, r * (0.95 - j * 0.28), t * (2 + j) + j, t * (2 + j) + j + Math.PI * 1.4); ctx.stroke(); }
          ctx.fillStyle = U.rgba(f.col, 0.35); ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore(); }
    },
    // padlocks on locked arrows (middle cell), in the colour of their key; drawn above the arrows
    drawLocks(ctx, st, v) {
      if (!st.locked) return; for (const id in st.locked) { if (!st.locked[id] || !st.alive[id]) continue; const a = st.arrows[id], c = a.cells[Math.floor(a.cells.length / 2)];
        const x = v.ox + (c[0] + 0.5) * v.c + Math.sin((a.wob || 0) * 40) * (a.wob || 0) * 4 * AP.ui.scale, y = v.oy + (c[1] + 0.5) * v.c, r = Math.max(7, v.c * 0.36), col = a.lockCol || '#ffd24a';
        ctx.save(); ctx.fillStyle = 'rgba(20,6,60,0.8)'; ctx.beginPath(); ctx.arc(x, y, r * 1.15, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, r * 0.16); ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, r * 0.18); ctx.beginPath(); ctx.arc(x, y - r * 0.15, r * 0.36, Math.PI, 0); ctx.stroke(); ctx.fillStyle = col; U.rr(ctx, x - r * 0.5, y - r * 0.15, r, r * 0.75, r * 0.15); ctx.fill(); ctx.restore(); }
    },
    // screen rect of a field tile of a type (coach target)
    fieldRect(type) { const st = AP.board.cur; if (!st || !st.view || !st.m.field) return null; const k = Object.keys(st.m.field).find(i => st.m.field[i].t === type); if (k === undefined) return null;
      const i = +k, p = AP.board.toScreen([i % st.m.w, Math.floor(i / st.m.w)]), r = Math.max(18 * AP.ui.scale, st.view.c * 0.6); return { x: p[0] - r, y: p[1] - r, w: r * 2, h: r * 2 }; },
    // screen rect of the first item of a kind (coach target)
    rectOf(kind) { const st = AP.board.cur; if (!st || !st.view || !st.items) return null; const it = st.items.find(i => i.kind === kind && !i.got); if (!it) return null;
      const p = AP.board.toScreen([it.x, it.y]), r = Math.max(18 * AP.ui.scale, st.view.c * 0.6); return { x: p[0] - r, y: p[1] - r, w: r * 2, h: r * 2 }; },
  };
})();
