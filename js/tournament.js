// ---------- Tournament: a 5-level run against 19 AI players ----------
// Entry: 1 ticket (CONFIG.tournament.ticketCost) or a rewarded ad ('ticket'). Each level scores points:
// arrows cleared x arrowPoint + hearts left x heartPoints + time bonus. The AI players' scores grow level by level
// (seeded per run), so the table moves while the player plays. After the last level: place, Roadmap arrows, coins for the top 3.
// Run state: AP.save.tournament = { n, idx, scores: [], bots: [{name, col, skill, scores: []}] } (null = no run).
// Events: tournament/run-<n>/start|complete|fail and tournament/level-<k>/start|complete|fail (see EVENTS.md).
(function () {
  const U = AP.util;
  AP.addStrings({
    en: { tour_title: 'Tournament', tour_info: '5 levels · 20 players · win arrows for the Roadmap!', join: 'Join', you: 'You', tour_level: 'Level {n} of 5',
      play_tour: 'Play level {n}', tour_points: 'Points', tour_done: 'Tournament over!', place_n: 'Place {n}', new_tour: 'New tournament', give_up: 'Finish level',
      pts_arrows: 'Arrows', pts_hearts: 'Hearts', pts_time: 'Speed', cont_tour: 'Continue', coach_tour: 'The Tournament is open! Here is a free ticket — beat the other players!', coach_roadmap: 'Arrows from tournaments fill the Roadmap. Every stop is a gift!' },
    ru: { tour_title: 'Турнир', tour_info: '5 уровней · 20 игроков · стрелочки для Пути наград!', join: 'Участвовать', you: 'Ты', tour_level: 'Уровень {n} из 5',
      play_tour: 'Играть уровень {n}', tour_points: 'Очки', tour_done: 'Турнир окончен!', place_n: '{n} место', new_tour: 'Новый турнир', give_up: 'Завершить уровень',
      pts_arrows: 'Стрелки', pts_hearts: 'Сердца', pts_time: 'Скорость', cont_tour: 'Дальше', coach_tour: 'Турнир открыт! Вот бесплатный билет — обгони других игроков!', coach_roadmap: 'Стрелочки из турниров заполняют Путь наград. Каждая остановка — подарок!' },
    es: { tour_title: 'Torneo', tour_info: '5 niveles · 20 jugadores · ¡gana flechas para la Ruta!', join: 'Unirse', you: 'Tú', tour_level: 'Nivel {n} de 5',
      play_tour: 'Jugar nivel {n}', tour_points: 'Puntos', tour_done: '¡Torneo terminado!', place_n: 'Puesto {n}', new_tour: 'Nuevo torneo', give_up: 'Terminar nivel',
      pts_arrows: 'Flechas', pts_hearts: 'Corazones', pts_time: 'Rapidez', cont_tour: 'Seguir', coach_tour: '¡El Torneo está abierto! Aquí tienes un ticket gratis.', coach_roadmap: 'Las flechas de los torneos llenan la Ruta. ¡Cada parada es un regalo!' },
    de: { tour_title: 'Turnier', tour_info: '5 Level · 20 Spieler · gewinne Pfeile für den Weg!', join: 'Mitmachen', you: 'Du', tour_level: 'Level {n} von 5',
      play_tour: 'Level {n} spielen', tour_points: 'Punkte', tour_done: 'Turnier vorbei!', place_n: 'Platz {n}', new_tour: 'Neues Turnier', give_up: 'Level beenden',
      pts_arrows: 'Pfeile', pts_hearts: 'Herzen', pts_time: 'Tempo', cont_tour: 'Weiter', coach_tour: 'Das Turnier ist offen! Hier ein Gratis-Ticket.', coach_roadmap: 'Pfeile aus Turnieren füllen den Weg. Jeder Halt ist ein Geschenk!' },
    fr: { tour_title: 'Tournoi', tour_info: '5 niveaux · 20 joueurs · gagne des flèches pour le Parcours !', join: 'Participer', you: 'Toi', tour_level: 'Niveau {n} sur 5',
      play_tour: 'Jouer le niveau {n}', tour_points: 'Points', tour_done: 'Tournoi terminé !', place_n: '{n}e place', new_tour: 'Nouveau tournoi', give_up: 'Finir le niveau',
      pts_arrows: 'Flèches', pts_hearts: 'Cœurs', pts_time: 'Vitesse', cont_tour: 'Continuer', coach_tour: 'Le Tournoi est ouvert ! Voici un ticket gratuit.', coach_roadmap: 'Les flèches des tournois remplissent le Parcours. Chaque étape est un cadeau !' },
    pt: { tour_title: 'Torneio', tour_info: '5 níveis · 20 jogadores · ganhe setas para a Trilha!', join: 'Participar', you: 'Você', tour_level: 'Nível {n} de 5',
      play_tour: 'Jogar nível {n}', tour_points: 'Pontos', tour_done: 'Torneio encerrado!', place_n: '{n}º lugar', new_tour: 'Novo torneio', give_up: 'Terminar nível',
      pts_arrows: 'Setas', pts_hearts: 'Corações', pts_time: 'Rapidez', cont_tour: 'Continuar', coach_tour: 'O Torneio abriu! Aqui está um ticket grátis.', coach_roadmap: 'As setas dos torneios enchem a Trilha. Cada parada é um presente!' },
    tr: { tour_title: 'Turnuva', tour_info: '5 seviye · 20 oyuncu · Ödül yolu için ok kazan!', join: 'Katıl', you: 'Sen', tour_level: 'Seviye {n} / 5',
      play_tour: '{n}. seviyeyi oyna', tour_points: 'Puan', tour_done: 'Turnuva bitti!', place_n: '{n}. sıra', new_tour: 'Yeni turnuva', give_up: 'Seviyeyi bitir',
      pts_arrows: 'Oklar', pts_hearts: 'Kalpler', pts_time: 'Hız', cont_tour: 'Devam', coach_tour: 'Turnuva açıldı! İşte ücretsiz bir bilet.', coach_roadmap: 'Turnuva okları Ödül yolunu doldurur. Her durak bir hediye!' },
    pl: { tour_title: 'Turniej', tour_info: '5 poziomów · 20 graczy · zdobywaj strzałki na Ścieżkę!', join: 'Dołącz', you: 'Ty', tour_level: 'Poziom {n} z 5',
      play_tour: 'Graj poziom {n}', tour_points: 'Punkty', tour_done: 'Koniec turnieju!', place_n: '{n}. miejsce', new_tour: 'Nowy turniej', give_up: 'Zakończ poziom',
      pts_arrows: 'Strzałki', pts_hearts: 'Serca', pts_time: 'Szybkość', cont_tour: 'Dalej', coach_tour: 'Turniej otwarty! Masz darmowy bilet.', coach_roadmap: 'Strzałki z turniejów wypełniają Ścieżkę. Każdy przystanek to prezent!' },
    it: { tour_title: 'Torneo', tour_info: '5 livelli · 20 giocatori · vinci frecce per il Percorso!', join: 'Partecipa', you: 'Tu', tour_level: 'Livello {n} di 5',
      play_tour: 'Gioca livello {n}', tour_points: 'Punti', tour_done: 'Torneo finito!', place_n: '{n}° posto', new_tour: 'Nuovo torneo', give_up: 'Finisci livello',
      pts_arrows: 'Frecce', pts_hearts: 'Cuori', pts_time: 'Velocità', cont_tour: 'Avanti', coach_tour: 'Il Torneo è aperto! Ecco un biglietto gratis.', coach_roadmap: 'Le frecce dei tornei riempiono il Percorso. Ogni tappa è un regalo!' },
  });

  const NAMES = ['Mia', 'Luna', 'Zoe', 'Ava', 'Lily', 'Emma', 'Sofia', 'Nora', 'Chloe', 'Ella', 'Kira', 'Maya', 'Ruby', 'Isla', 'Aria', 'Nina', 'Lea', 'Yuki', 'Sara', 'Elif', 'Anya', 'Iris', 'Bella', 'Hana', 'Alma', 'Jade', 'Rosa', 'Vera', 'Ivy', 'Mila'];
  const COLS = ['#ff4fb8', '#3fd8ff', '#ffc93a', '#46e08a', '#9d5cff', '#ff8a3d', '#ff4d6d', '#5fd3a8'];
  const C = () => AP.CONFIG.tournament;

  const T = AP.tour = {
    run() { return AP.save.tournament; },
    open() { return AP.CONFIG.debug.unlockAll || AP.save.level >= C().unlockLevel; },
    // level k (0-based) of run n: generated, normal sizes, the last one harder
    levelData(n, k) {
      const p = { ...AP.gen.params(22 + k * 6 + (n % 4) * 2) }; p.diff = k === C().levels - 1 ? 'hard' : 'normal'; if (p.diff === 'normal') p.shape = k % 2 ? 'heart' : 'rect';
      const lv = AP.gen.make(p, 90000 + n * 37 + k); lv.diff = p.diff; delete lv.fill; return lv;
    },
    // the score a decent player makes on a level (the AI players are a share of it)
    typical(lv) { const c = C(); return lv.a.length * c.arrowPoint + 2 * c.heartPoints + c.timeBonus * 0.5; },
    start() {
      const n = (AP.save.stats.tourRuns || 0) + 1; AP.save.stats.tourRuns = n; const R = AP.gen.rng(n * 7919 + 3);
      const names = NAMES.slice(); for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
      const [a, b] = C().botSkill; const bots = [];
      for (let i = 0; i < C().bots; i++) bots.push({ name: names[i % names.length] + (i >= names.length ? i : ''), col: COLS[i % COLS.length], skill: a + (b - a) * R(), scores: [] });
      AP.save.tournament = { n, idx: 0, scores: [], bots }; AP.persist();
      AP.poki.measure('tournament', 'run-' + n, 'start');
    },
    // the AI players play level k as soon as the player finishes it
    botsPlay(k) { const r = T.run(); const lv = T.levelData(r.n, k); const R = AP.gen.rng(r.n * 131 + k * 17); const typ = T.typical(lv);
      r.bots.forEach(b => { b.scores[k] = Math.round(typ * b.skill * (0.85 + 0.3 * R()) / 5) * 5; }); },
    total(scores) { return scores.reduce((s, v) => s + (v || 0), 0); },
    // table: [{name, col, total, me}] sorted by total (the player wins ties)
    table() { const r = T.run(); if (!r) return []; const rows = r.bots.map(b => ({ name: b.name, col: b.col, total: T.total(b.scores) }));
      rows.push({ name: AP.t('you'), col: '#ffffff', total: T.total(r.scores), me: true }); return rows.sort((p, q) => q.total - p.total || (q.me ? 1 : 0) - (p.me ? 1 : 0)); },
    place() { return T.table().findIndex(r => r.me) + 1; },
    // a level of the run is over (won or given up): store points, let the bots play it, move on
    levelDone(points, ok) {
      const r = T.run(); if (!r) return; const k = r.idx; r.scores[k] = points; T.botsPlay(k); r.idx++;
      AP.poki.measure('tournament', 'level-' + (k + 1), ok ? 'complete' : 'fail'); AP.tasks.bump('tour'); AP.persist();
    },
    // after the last level: rewards by place, then the Roadmap claims what it can
    finish() {
      const r = T.run(); if (!r) return null; const place = T.place(), c = C();
      const rew = { arrows: place <= c.arrowsByPlace.length ? c.arrowsByPlace[place - 1] : c.arrowsMin }; if (place <= 3) rew.coins = c.coinsTop3[place - 1];
      AP.meta.grant(rew); AP.poki.measure('tournament', 'run-' + r.n, 'complete'); AP.save.tournament = null; AP.save.stats.bestPlace = Math.min(AP.save.stats.bestPlace || 99, place); AP.persist();
      return { place, rew };
    },
    // the player gives up the whole run (leaves it unfinished and starts over)
    abandon() { const r = T.run(); if (!r) return; AP.poki.measure('tournament', 'run-' + r.n, 'fail'); AP.save.tournament = null; AP.persist(); },
    // pay the entry and start: ticket or rewarded ad
    join(byAd) {
      if (byAd) { AP.poki.rewardedBreak('ticket').then(ok => { if (ok) { T.start(); AP.audio.sparkle(); } }); return; }
      if (AP.meta.spend({ type: 'tickets', n: C().ticketCost })) { T.start(); AP.audio.sparkle(); }
    },
    playNext() { const r = T.run(); if (!r) return; AP.game.open('level', { tour: true, k: r.idx }, { ad: true }); },
  };

  // ----- the tournament screen: info + join, or the live table + Play -----
  const S = AP.screens.tour = {
    enter(arg) { AP.poki.gameplayStop(); if (arg && arg.final) AP.game.modal = { type: 'tourEnd', ...arg.final, t: 0 }; }, // final results of a finished run
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s, t = AP.game.t; AP.art.background(ctx, w, h, t); const r = T.run();
      AP.game.topBar(ctx, { back: () => { AP.audio.click(); AP.game.open('lobby'); }, pills: ['tickets', 'arrows'], title: AP.t('tour_title') });
      const st = L.stage, pw = Math.min(st.w - 24 * s, 480 * s), px = st.x + st.w / 2 - pw / 2, py = st.y + 8 * s, ph = L.foot.y - py - 8 * s;
      AP.art.panel(ctx, px, py, pw, ph, 22 * s, AP.art.YELLOW);
      if (!r) { S.info(ctx, px, py, pw, ph, s, t); }
      else {
        U.text(ctx, AP.t('tour_level', { n: Math.min(r.idx + 1, C().levels) }), w / 2, py + 24 * s, { size: 16 * s, color: AP.art.YELLOW, weight: 900, maxW: pw - 40 * s });
        // progress dots for the 5 levels
        for (let i = 0; i < C().levels; i++) { const dx = w / 2 + (i - (C().levels - 1) / 2) * 26 * s; ctx.fillStyle = i < r.idx ? AP.art.GREEN : i === r.idx ? AP.art.YELLOW : 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.arc(dx, py + 48 * s, 7 * s, 0, Math.PI * 2); ctx.fill(); }
        S.drawTable(ctx, px + 12 * s, py + 64 * s, pw - 24 * s, ph - 76 * s, s);
      }
      // bottom buttons
      const ft = L.foot, bh = Math.min(ft.h - 20 * s, 64 * s, h * 0.12), by = ft.y + (ft.h - bh) / 2, maxW = Math.min(ft.w - 36 * s, 560 * s), bx = ft.x + ft.w / 2 - maxW / 2;
      if (!r) {
        const bw = (maxW - 12 * s) / 2, cost = C().ticketCost;
        AP.ui.button('tour_join', bx, by, bw, bh, AP.t('join') + '  ' + cost, { color: AP.art.YELLOW, size: Math.min(20 * s, bh * 0.34), icon: (c, ix, iy) => AP.art.currency(c, 'tickets', ix, iy, 11 * s), iconRight: true, onClick: () => T.join(false) });
        if (AP.CONFIG.ads.ticketAd) { AP.poki.rewardedVisible('ticket');
          AP.ui.button('tour_join_ad', bx + bw + 12 * s, by, bw, bh, AP.t('join'), { color: AP.art.PINK, size: Math.min(20 * s, bh * 0.34), icon: (c, ix, iy) => AP.art.currency(c, 'ad', ix, iy, 12 * s), iconRight: true, onClick: () => T.join(true) }); }
      } else AP.ui.button('tour_play', bx, by, maxW, bh, AP.t('play_tour', { n: r.idx + 1 }), { color: AP.art.PINK, size: Math.min(22 * s, bh * 0.36), icon: (c, ix, iy) => AP.art.icon(c, 'play', ix, iy, 10 * s), onClick: () => T.playNext() });
    },
    info(ctx, x, y, w, h, s, t) {
      const cx = x + w / 2; AP.art.glow(ctx, cx, y + h * 0.25, 90 * s, 0.4, AP.art.YELLOW); AP.art.candyDisc(ctx, cx, y + h * 0.25, 56 * s, AP.art.YELLOW); AP.art.icon(ctx, 'trophy', cx, y + h * 0.25, 30 * s);
      U.wrap(ctx, AP.t('tour_info'), cx, y + h * 0.25 + 84 * s, w - 40 * s, 22 * s, { size: 17 * s, color: '#fff', weight: 900, maxLines: 3 });
      // prizes for places 1..3
      const c = C(); for (let i = 0; i < 3; i++) { const ry = y + h * 0.25 + 140 * s + i * 44 * s; if (ry + 40 * s > y + h) break;
        ctx.fillStyle = 'rgba(10,2,40,0.45)'; U.rr(ctx, x + 20 * s, ry, w - 40 * s, 38 * s, 12 * s); ctx.fill();
        U.text(ctx, AP.t('place_n', { n: i + 1 }), x + 34 * s, ry + 19 * s, { size: 15 * s, color: ['#ffd24a', '#dfe6ff', '#ffb27a'][i], weight: 900, align: 'left', maxW: w * 0.35 });
        AP.art.pill(ctx, x + w - 210 * s, ry + 4 * s, 90 * s, 30 * s, 'arrows', '+' + c.arrowsByPlace[i], s); AP.art.pill(ctx, x + w - 114 * s, ry + 4 * s, 90 * s, 30 * s, 'coins', '+' + c.coinsTop3[i], s); }
    },
    // the table: rows around the player (top 3 always visible)
    drawTable(ctx, x, y, w, h, s) {
      const rows = T.table(); const rh = Math.min(40 * s, (h - 8 * s) / 9); const n = Math.max(3, Math.floor(h / (rh + 4 * s)));
      const me = rows.findIndex(r => r.me); let list = rows.map((r, i) => ({ ...r, pl: i + 1 }));
      if (list.length > n) { const lo = U.clamp(me - Math.floor((n - 3) / 2), 3, list.length - (n - 3)); list = list.slice(0, 3).concat(list.slice(lo, lo + n - 3)); }
      list.forEach((r, i) => { const ry = y + i * (rh + 4 * s);
        ctx.fillStyle = r.me ? 'rgba(255,79,184,0.45)' : 'rgba(10,2,40,0.45)'; U.rr(ctx, x, ry, w, rh, 12 * s); ctx.fill(); if (r.me) { ctx.strokeStyle = AP.art.PINK; ctx.lineWidth = 2 * s; ctx.stroke(); }
        U.text(ctx, r.pl, x + 20 * s, ry + rh / 2, { size: 15 * s, color: r.pl <= 3 ? ['#ffd24a', '#dfe6ff', '#ffb27a'][r.pl - 1] : '#fff', weight: 900 });
        if (r.me) AP.art.mascot(ctx, x + 52 * s, ry + rh / 2 + 1 * s, rh * 0.36, 'happy', AP.game.t);
        else { AP.art.candyDisc(ctx, x + 52 * s, ry + rh / 2, rh * 0.36, r.col, { lip: 1.5 * s }); U.text(ctx, r.name[0], x + 52 * s, ry + rh / 2 + 0.5, { size: rh * 0.38, color: '#fff', weight: 900 }); }
        U.text(ctx, r.name, x + 76 * s, ry + rh / 2, { size: 15 * s, color: '#fff', weight: 800, align: 'left', maxW: w - 170 * s });
        U.text(ctx, r.total, x + w - 16 * s, ry + rh / 2, { size: 16 * s, color: AP.art.YELLOW, weight: 900, align: 'right' }); });
    },
  };

  // ----- after a tournament level: points breakdown, then back to the table (or the final results) -----
  AP.modals.tourLevel = function (ctx, w, h, m) {
    const s = AP.ui.fitS(360); const pw = Math.min(w - 32 * s, 360 * s), ph = 360 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, AP.art.YELLOW); AP.art.mascot(ctx, w / 2, y - 14 * s, 28 * s, m.ok ? 'happy' : 'oops', AP.game.t);
    U.text(ctx, AP.t('tour_points'), w / 2, y + 40 * s, { size: 22 * s, color: '#fff', weight: 900, maxW: pw - 40 * s });
    [['pts_arrows', m.parts[0]], ['pts_hearts', m.parts[1]], ['pts_time', m.parts[2]]].forEach(([k, v], i) => { const ry = y + 70 * s + i * 40 * s;
      U.text(ctx, AP.t(k), x + 30 * s, ry + 16 * s, { size: 16 * s, color: AP.art.INK_DIM, weight: 800, align: 'left', maxW: pw * 0.5 });
      U.text(ctx, '+' + v, x + pw - 30 * s, ry + 16 * s, { size: 18 * s, color: '#fff', weight: 900, align: 'right' }); });
    U.text(ctx, m.points, w / 2, y + 222 * s, { size: 40 * s, color: AP.art.YELLOW, weight: 900, stroke: '#7a2cff', strokeW: 6 * s });
    AP.ui.button('tour_cont', x + 24 * s, y + ph - 76 * s, pw - 48 * s, 56 * s, AP.t('cont_tour'), { color: AP.art.GREEN, size: 21 * s, onClick: () => {
      AP.game.modal = null; const r = T.run(); const final = r && r.idx >= C().levels ? T.finish() : null;
      AP.game.open('tour', final ? { final } : null); } });
  };

  // ----- final results: place, arrows for the Roadmap, coins -----
  AP.modals.tourEnd = function (ctx, w, h, m) {
    const s = AP.ui.fitS(360); m.t += AP.game.dt || 0.016; const pw = Math.min(w - 32 * s, 360 * s), ph = 360 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, AP.art.YELLOW); AP.art.mascot(ctx, w / 2, y - 14 * s, 28 * s, m.place <= 3 ? 'wow' : 'happy', AP.game.t);
    U.text(ctx, AP.t('tour_done'), w / 2, y + 40 * s, { size: 23 * s, color: '#fff', weight: 900, maxW: pw - 40 * s });
    const k = U.easeBack(U.clamp(m.t / 0.4, 0, 1)); ctx.save(); ctx.translate(w / 2, y + 116 * s); ctx.scale(k || 0.001, k || 0.001);
    AP.art.candyDisc(ctx, 0, 0, 46 * s, m.place <= 3 ? ['#ffc93a', '#c9d3ff', '#ff9a5c'][m.place - 1] : '#7a2cff');
    U.text(ctx, '#' + m.place, 0, 2 * s, { size: 30 * s, color: '#fff', weight: 900, stroke: '#3a1670', strokeW: 5 * s }); ctx.restore();
    U.text(ctx, AP.t('place_n', { n: m.place }), w / 2, y + 182 * s, { size: 18 * s, color: AP.art.YELLOW, weight: 900 });
    const items = AP.roadmap.items(m.rew); items.forEach((it, i) => AP.art.pill(ctx, w / 2 + (i - (items.length - 1) / 2) * 104 * s - 48 * s, y + 206 * s, 96 * s, 34 * s, it[0], '+' + it[1], s));
    AP.ui.button('tour_end_ok', x + 24 * s, y + ph - 76 * s, pw - 48 * s, 56 * s, AP.t('collect'), { color: AP.art.GREEN, size: 21 * s, onClick: () => { AP.game.modal = null; AP.audio.coin(); AP.roadmap.check(); } });
  };
})();
