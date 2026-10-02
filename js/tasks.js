// ---------- Daily tasks: 3 a day from CONFIG.daily.pool, each with a reward, a chest for all three ----------
// AP.save.daily = {day: 'YYYY-MM-DD', tasks: [{kind, goal, prog, claimed, reward}], chest: false}. New day = new tasks.
// The game reports progress with AP.tasks.bump(kind, n): win, stars3, arrows, booster, tour.
// Events: daily/task-<kind>/complete (claimed), daily/chest/claimed.
(function () {
  const U = AP.util;
  AP.addStrings({
    en: { tasks_title: 'Daily tasks', t_win: 'Win {n} levels', t_stars3: 'Get 3 stars {n} times', t_arrows: 'Send away {n} arrows', t_booster: 'Use {n} boosters', t_tour: 'Play {n} tournament levels', claim: 'Claim', chest_all: 'Finish all 3 for a chest!', tasks_new: 'New tasks tomorrow' },
    ru: { tasks_title: 'Задания дня', t_win: 'Пройди уровни: {n}', t_stars3: 'Уровни на 3 звезды: {n}', t_arrows: 'Отправь стрелки: {n}', t_booster: 'Используй бустеры: {n}', t_tour: 'Уровни турнира: {n}', claim: 'Забрать', chest_all: 'Выполни все 3 — получишь сундук!', tasks_new: 'Новые задания завтра' },
    es: { tasks_title: 'Tareas del día', t_win: 'Supera {n} niveles', t_stars3: 'Consigue 3 estrellas {n} veces', t_arrows: 'Envía {n} flechas', t_booster: 'Usa {n} potenciadores', t_tour: 'Juega {n} niveles de torneo', claim: 'Recoger', chest_all: '¡Completa las 3 y gana un cofre!', tasks_new: 'Nuevas tareas mañana' },
    de: { tasks_title: 'Tagesaufgaben', t_win: 'Schaffe {n} Level', t_stars3: 'Hol {n}-mal 3 Sterne', t_arrows: 'Schick {n} Pfeile los', t_booster: 'Nutze {n} Booster', t_tour: 'Spiel {n} Turnierlevel', claim: 'Abholen', chest_all: 'Alle 3 schaffen = Truhe!', tasks_new: 'Neue Aufgaben morgen' },
    fr: { tasks_title: 'Défis du jour', t_win: 'Réussis {n} niveaux', t_stars3: 'Obtiens 3 étoiles {n} fois', t_arrows: 'Envoie {n} flèches', t_booster: 'Utilise {n} bonus', t_tour: 'Joue {n} niveaux de tournoi', claim: 'Prendre', chest_all: 'Fais les 3 pour un coffre !', tasks_new: 'Nouveaux défis demain' },
    pt: { tasks_title: 'Tarefas do dia', t_win: 'Vença {n} níveis', t_stars3: 'Pegue 3 estrelas {n} vezes', t_arrows: 'Mande {n} setas', t_booster: 'Use {n} bônus', t_tour: 'Jogue {n} níveis de torneio', claim: 'Pegar', chest_all: 'Faça as 3 e ganhe um baú!', tasks_new: 'Novas tarefas amanhã' },
    tr: { tasks_title: 'Günlük görevler', t_win: '{n} seviye geç', t_stars3: '{n} kez 3 yıldız al', t_arrows: '{n} ok gönder', t_booster: '{n} güçlendirici kullan', t_tour: '{n} turnuva seviyesi oyna', claim: 'Al', chest_all: '3 görevi bitir, sandık kazan!', tasks_new: 'Yeni görevler yarın' },
    pl: { tasks_title: 'Zadania dnia', t_win: 'Przejdź poziomy: {n}', t_stars3: 'Poziomy na 3 gwiazdki: {n}', t_arrows: 'Wyślij strzałki: {n}', t_booster: 'Użyj bonusów: {n}', t_tour: 'Poziomy turnieju: {n}', claim: 'Odbierz', chest_all: 'Zrób wszystkie 3 — dostaniesz skrzynię!', tasks_new: 'Nowe zadania jutro' },
    it: { tasks_title: 'Missioni del giorno', t_win: 'Supera {n} livelli', t_stars3: 'Ottieni 3 stelle {n} volte', t_arrows: 'Manda via {n} frecce', t_booster: 'Usa {n} potenziamenti', t_tour: 'Gioca {n} livelli di torneo', claim: 'Ritira', chest_all: 'Completa tutte e 3 per un forziere!', tasks_new: 'Nuove missioni domani' },
  });
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const TK = AP.tasks = {
    // today's tasks (rolled from the pool by the date, one task per kind)
    get() {
      const d = AP.save.daily; if (d && d.day === today()) return d;
      const day = today(), R = AP.gen.rng(day.split('-').reduce((a, v) => a * 37 + +v, 7)), pool = AP.CONFIG.daily.pool.slice(), out = [], kinds = {};
      while (out.length < 3 && pool.length) { const i = Math.floor(R() * pool.length), p = pool.splice(i, 1)[0]; if (kinds[p.kind]) continue; kinds[p.kind] = 1; out.push({ kind: p.kind, goal: p.goal, prog: 0, claimed: false, reward: p.reward }); }
      AP.save.daily = { day, tasks: out, chest: false }; AP.persist(); return AP.save.daily;
    },
    bump(kind, n = 1) { const d = TK.get(); let ch = false; d.tasks.forEach(t => { if (t.kind === kind && t.prog < t.goal) { t.prog = Math.min(t.goal, t.prog + n); ch = true; } }); if (ch) AP.persist(); },
    claimable() { const d = TK.get(); return d.tasks.some(t => !t.claimed && t.prog >= t.goal) || (!d.chest && d.tasks.every(t => t.claimed)); },
    claim(i) { const d = TK.get(), t = d.tasks[i]; if (!t || t.claimed || t.prog < t.goal) return; t.claimed = true; AP.meta.grant(t.reward); AP.poki.measure('daily', 'task-' + t.kind, 'complete'); AP.persist();
      AP.game.modal = { type: 'reward', rews: [t.reward], next: { type: 'tasks' } }; },
    claimChest() { const d = TK.get(); if (d.chest || !d.tasks.every(t => t.claimed)) return; d.chest = true; const r = AP.CONFIG.daily.chest; AP.meta.grant(r); AP.poki.measure('daily', 'chest', 'claimed'); AP.persist();
      AP.game.modal = { type: 'reward', rews: [r], next: { type: 'tasks' } }; },
  };

  AP.modals.tasks = function (ctx, w, h, m) {
    const s = AP.ui.fitS(470), d = TK.get(); const pw = Math.min(w - 32 * s, 420 * s), ph = 470 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, AP.art.GREEN);
    U.text(ctx, AP.t('tasks_title'), w / 2, y + 34 * s, { size: 24 * s, color: '#fff', weight: 900, maxW: pw - 100 * s });
    AP.ui.iconButton('tasks_close', x + pw - 46 * s, y + 12 * s, 36 * s, (c, cx, cy, r) => AP.art.icon(c, 'close', cx, cy, r), () => { AP.audio.click(); AP.game.modal = null; });
    d.tasks.forEach((t, i) => { const ry = y + 66 * s + i * 92 * s, rx = x + 16 * s, rw = pw - 32 * s, rh = 84 * s, done = t.prog >= t.goal;
      ctx.fillStyle = t.claimed ? 'rgba(70,224,138,0.18)' : 'rgba(10,2,40,0.5)'; U.rr(ctx, rx, ry, rw, rh, 14 * s); ctx.fill();
      U.text(ctx, AP.t('t_' + t.kind, { n: t.goal }), rx + 14 * s, ry + 22 * s, { size: 15 * s, color: '#fff', weight: 900, align: 'left', maxW: rw - 130 * s });
      const bw = rw - 150 * s; ctx.fillStyle = 'rgba(255,255,255,0.15)'; U.rr(ctx, rx + 14 * s, ry + 48 * s, bw, 12 * s, 6 * s); ctx.fill();
      ctx.fillStyle = done ? AP.art.GREEN : AP.art.PINK; U.rr(ctx, rx + 14 * s, ry + 48 * s, Math.max(12 * s, bw * t.prog / t.goal), 12 * s, 6 * s); ctx.fill();
      U.text(ctx, t.prog + '/' + t.goal, rx + 14 * s + bw / 2, ry + 70 * s, { size: 11 * s, color: AP.art.INK_DIM, weight: 800 });
      const it = AP.roadmap.items(t.reward)[0]; if (it) { AP.roadmap.drawItem(ctx, it, rx + rw - 112 * s, ry + 54 * s, 13 * s); U.text(ctx, '+' + it[1], rx + rw - 112 * s, ry + 76 * s, { size: 11 * s, color: '#fff', weight: 900 }); }
      if (t.claimed) AP.art.check(ctx, rx + rw - 44 * s, ry + rh / 2, 16 * s);
      else AP.ui.button('task_' + i, rx + rw - 88 * s, ry + rh / 2 - 20 * s, 78 * s, 40 * s, AP.t('claim'), { color: AP.art.GREEN, size: 14 * s, disabled: !done, onClick: () => TK.claim(i) }); });
    const all = d.tasks.every(t => t.claimed), cy = y + ph - 74 * s;
    ctx.fillStyle = 'rgba(255,201,58,0.15)'; U.rr(ctx, x + 16 * s, cy, pw - 32 * s, 58 * s, 14 * s); ctx.fill();
    AP.art.candyDisc(ctx, x + 46 * s, cy + 29 * s, 20 * s, AP.art.YELLOW); AP.art.icon(ctx, 'trophy', x + 46 * s, cy + 29 * s, 11 * s);
    U.text(ctx, d.chest ? AP.t('tasks_new') : AP.t('chest_all'), x + 76 * s, cy + 29 * s, { size: 14 * s, color: '#fff', weight: 800, align: 'left', maxW: pw - 200 * s });
    if (!d.chest) AP.ui.button('task_chest', x + pw - 112 * s, cy + 9 * s, 86 * s, 40 * s, AP.t('claim'), { color: AP.art.YELLOW, size: 14 * s, disabled: !all, onClick: () => TK.claimChest() });
  };
})();
