// ---------- FTUE coach: Lu the fox explains one thing at a time ----------
// A tip = speech bubble with the mascot + a pointing hand on the target. Each tip shows once (AP.save.seen['coach_<id>']).
//   done: 'tap'    — any tap closes it (a tap on the bubble is swallowed, elsewhere it also reaches the game)
//   done: 'action' — it stays until doneWhen() is true (e.g. the player sent the arrow away); taps go through to the game
// Poki funnel: tutorial/step-<id>/start when shown, tutorial/step-<id>/complete when closed.
// Order of the list = priority when several tips are ready at once.
(function () {
  const U = AP.util;
  const L = () => AP.screens.level;
  const hitRect = id => { const h = AP.ui.hits.find(k => k.id === id); return h ? h.rect : null; };
  const inLevel = () => AP.game.state === 'level' && AP.board.cur && !AP.game.modal && !AP.trans.active;
  // rect around a free arrow on the board (its middle cell)
  const freeArrowRect = () => { const f = AP.board.freeIds(); if (!f.length) return null; const p = AP.board.screenOf(f[0]); const c = AP.board.cur.view.c; const r = Math.max(c * 0.7, 22 * AP.ui.scale); return { x: p[0] - r, y: p[1] - r, w: r * 2, h: r * 2 }; };
  const boosterTip = id => ({ done: 'tap', mood: 'wow', when: () => inLevel() && AP.boosters.open(id, L().n) && L().n >= AP.boosters.cfg(id).unlock && !!hitRect('bst_' + id), target: () => hitRect('bst_' + id) });

  const TIPS = [
    { id: 'tap', done: 'action', mood: 'happy', pos: 'bottom', when: () => inLevel() && L().n === 1, target: freeArrowRect, doneWhen: () => !AP.board.cur || AP.board.cur.left < AP.board.cur.arrows.length },
    { id: 'order', done: 'action', mood: 'idle', pos: 'bottom', when: () => inLevel() && L().n === 2, target: freeArrowRect, doneWhen: () => !AP.board.cur || AP.board.cur.left < AP.board.cur.arrows.length },
    { id: 'hearts', done: 'tap', mood: 'oops', when: () => inLevel() && L().hearts < L().maxHearts && L().hearts > 0, target: () => hitRect('hud_hearts') },
    { id: 'hint', ...boosterTip('hint') }, { id: 'shield', ...boosterTip('shield') }, { id: 'wand', ...boosterTip('wand') },
    { id: 'pre', done: 'tap', mood: 'wow', pos: 'top', when: () => AP.game.modal && AP.game.modal.type === 'start' && !AP.trans.active, target: () => hitRect('bst_heart') },
    { id: 'zoom', done: 'tap', mood: 'idle', when: () => inLevel() && AP.board.zoomable() && !!hitRect('zoom_in'), target: () => hitRect('zoom_in') },
  ];

  AP.addStrings({
    en: { coach_tap: 'Tap the arrow — it flies away along its tip!', coach_order: 'Arrows can\'t pass through each other. Send this one first!', coach_hearts: 'Oops! A blocked arrow bounces back and costs a heart.',
      coach_hint: 'New: Hint! It shows an arrow that can fly away.', coach_shield: 'New: Shield! Your next mistake is free.', coach_wand: 'New: Magic wand! Tap it, then any arrow to remove it.',
      coach_pre: 'Pick boosters before the level to make it easier!', coach_zoom: 'Big puzzle! Pinch or tap + to zoom in.' },
    ru: { coach_tap: 'Нажми на стрелку — она улетит туда, куда смотрит!', coach_order: 'Стрелки не проходят сквозь друг друга. Сначала отправь эту!', coach_hearts: 'Ой! Заблокированная стрелка отскакивает и отнимает сердце.',
      coach_hint: 'Новинка: Подсказка! Покажет стрелку, которая может улететь.', coach_shield: 'Новинка: Щит! Следующая ошибка бесплатно.', coach_wand: 'Новинка: Палочка! Нажми её, а потом любую стрелку.',
      coach_pre: 'Выбери бустеры перед уровнем, чтобы было проще!', coach_zoom: 'Большой пазл! Раздвинь пальцы или нажми +.' },
    es: { coach_tap: '¡Toca la flecha: sale volando hacia donde apunta!', coach_order: 'Las flechas no se atraviesan. ¡Envía esta primero!', coach_hearts: '¡Uy! Una flecha bloqueada rebota y quita un corazón.',
      coach_hint: 'Nuevo: ¡Pista! Muestra una flecha que puede salir.', coach_shield: 'Nuevo: ¡Escudo! Tu próximo error es gratis.', coach_wand: 'Nuevo: ¡Varita! Tócala y luego cualquier flecha.',
      coach_pre: '¡Elige potenciadores antes del nivel!', coach_zoom: '¡Puzle grande! Pellizca o toca + para acercar.' },
    de: { coach_tap: 'Tippe den Pfeil an — er fliegt in seine Richtung davon!', coach_order: 'Pfeile können nicht durcheinander. Schick zuerst diesen los!', coach_hearts: 'Hoppla! Ein blockierter Pfeil prallt ab und kostet ein Herz.',
      coach_hint: 'Neu: Tipp! Zeigt einen Pfeil, der raus kann.', coach_shield: 'Neu: Schild! Dein nächster Fehler ist gratis.', coach_wand: 'Neu: Zauberstab! Tippe ihn an, dann einen Pfeil.',
      coach_pre: 'Wähle Booster vor dem Level!', coach_zoom: 'Großes Rätsel! Zieh mit zwei Fingern oder tippe +.' },
    fr: { coach_tap: 'Touche la flèche : elle s\'envole vers sa pointe !', coach_order: 'Les flèches ne se traversent pas. Envoie celle-ci d\'abord !', coach_hearts: 'Oups ! Une flèche bloquée rebondit et coûte un cœur.',
      coach_hint: 'Nouveau : Indice ! Il montre une flèche qui peut sortir.', coach_shield: 'Nouveau : Bouclier ! Ta prochaine erreur est gratuite.', coach_wand: 'Nouveau : Baguette ! Touche-la, puis une flèche.',
      coach_pre: 'Choisis des bonus avant le niveau !', coach_zoom: 'Grand puzzle ! Pince ou touche + pour zoomer.' },
    pt: { coach_tap: 'Toque na seta: ela voa para onde aponta!', coach_order: 'As setas não se atravessam. Mande esta primeiro!', coach_hearts: 'Opa! Uma seta bloqueada volta e custa um coração.',
      coach_hint: 'Novo: Dica! Mostra uma seta que pode sair.', coach_shield: 'Novo: Escudo! Seu próximo erro é grátis.', coach_wand: 'Novo: Varinha! Toque nela e depois numa seta.',
      coach_pre: 'Escolha bônus antes do nível!', coach_zoom: 'Quebra-cabeça grande! Use dois dedos ou toque +.' },
    tr: { coach_tap: 'Oka dokun — baktığı yöne uçar!', coach_order: 'Oklar birbirinin içinden geçemez. Önce bunu gönder!', coach_hearts: 'Hop! Engellenen ok geri seker ve bir kalp götürür.',
      coach_hint: 'Yeni: İpucu! Çıkabilecek bir oku gösterir.', coach_shield: 'Yeni: Kalkan! Sonraki hatan bedava.', coach_wand: 'Yeni: Değnek! Ona, sonra bir oka dokun.',
      coach_pre: 'Seviyeden önce güçlendirici seç!', coach_zoom: 'Büyük bulmaca! Yakınlaştırmak için + ya dokun.' },
    pl: { coach_tap: 'Dotknij strzałki — poleci tam, gdzie wskazuje!', coach_order: 'Strzałki nie przechodzą przez siebie. Najpierw wyślij tę!', coach_hearts: 'Ups! Zablokowana strzałka odbija się i zabiera serce.',
      coach_hint: 'Nowość: Podpowiedź! Pokaże strzałkę, która może wylecieć.', coach_shield: 'Nowość: Tarcza! Następny błąd za darmo.', coach_wand: 'Nowość: Różdżka! Dotknij jej, a potem strzałki.',
      coach_pre: 'Wybierz bonusy przed poziomem!', coach_zoom: 'Duża łamigłówka! Rozsuń palce lub dotknij +.' },
    it: { coach_tap: 'Tocca la freccia: vola via dove punta!', coach_order: 'Le frecce non si attraversano. Manda prima questa!', coach_hearts: 'Ops! Una freccia bloccata rimbalza e costa un cuore.',
      coach_hint: 'Novità: Suggerimento! Mostra una freccia che può uscire.', coach_shield: 'Novità: Scudo! Il prossimo errore è gratis.', coach_wand: 'Novità: Bacchetta! Toccala, poi una freccia.',
      coach_pre: 'Scegli i potenziamenti prima del livello!', coach_zoom: 'Puzzle grande! Allarga le dita o tocca +.' },
  });

  const C = AP.coach = {
    TIPS, cur: null, t: 0, gap: 0, rect: null,
    seen(id) { return !!AP.save.seen['coach_' + id]; },
    started: {},
    show(tp) { C.cur = tp; C.t = 0; if (!C.started[tp.id]) { C.started[tp.id] = 1; AP.poki.measure('tutorial', 'step-' + tp.id, 'start'); } }, // a re-shown tip does not restart the funnel
    close() { const tp = C.cur; if (!tp) return; AP.save.seen['coach_' + tp.id] = 1; AP.persist(); AP.poki.measure('tutorial', 'step-' + tp.id, 'complete'); C.cur = null; C.rect = null; C.gap = 0.6; },
    // pointerdown hook (main.js). Returns true when the tap is swallowed (it hit the bubble).
    tap(x, y) {
      if (!C.cur) return false; const inside = C.rect && U.inRect(x, y, C.rect);
      if (C.cur.done === 'tap' && C.t > 0.35) { C.close(); AP.audio.click(); return inside; }
      return inside;
    },
    update(dt) {
      C.gap = Math.max(0, C.gap - dt);
      if (C.cur) { C.t += dt; if (C.cur.done === 'action' && C.cur.doneWhen()) C.close(); else if (!C.cur.when()) { C.cur = null; C.rect = null; } return; } // context gone (a window opened, level over): hide, show again later
      if (C.gap > 0 || AP.poki.adRunning || AP.boot.active) return;
      for (const tp of TIPS) if (!C.seen(tp.id) && tp.when()) { C.show(tp); break; }
    },
    draw(ctx, w, h) {
      C.rect = null; const tp = C.cur; if (!tp) return; const s = AP.ui.scale;
      const T = tp.target ? tp.target() : null; const P = T ? { x: T.x + T.w / 2, y: T.y + T.h / 2 } : null;
      const text = AP.t('coach_' + tp.id), avR = 26 * s, pad = 12 * s, fs = 15 * s, lh = 19 * s;
      const bw = Math.min(w - 24 * s, 380 * s), tw = bw - pad * 3 - avR * 2; const lines = U.wrapLines(ctx, text, tw, { size: fs, weight: 800, maxLines: 4 });
      const bh = Math.max(avR * 2 + pad * 2, lines.length * lh + pad * 2);
      // above the target when it is in the lower half, below it otherwise; never under the top bar
      const top = (AP.ui.layout.head.h || 0) + 6 * s; let by, below;
      if (P) { if (P.y > h * 0.5) { by = T.y - bh - 46 * s; below = true; } else { by = T.y + T.h + 46 * s; below = false; } }
      else { by = h * 0.3; below = true; }
      // pos 'bottom': just above the bottom bar (board tips: never over the board); 'top': under the top bar (window tips)
      if (tp.pos === 'bottom') { by = AP.ui.layout.foot.y - bh - 8 * s; below = true; } else if (tp.pos === 'top') { by = top; below = false; }
      by = U.clamp(by, top, h - bh - 8 * s); const bx = U.clamp((P ? P.x : w / 2) - bw / 2, 12 * s, w - 12 * s - bw);
      const k = U.easeBack(Math.min(1, C.t / 0.35)), a = Math.min(1, C.t / 0.2);
      ctx.save(); ctx.globalAlpha = a;
      if (T) { ctx.save(); ctx.strokeStyle = U.rgba('#ffe066', 0.6 + 0.35 * Math.sin(AP.game.t * 5)); ctx.lineWidth = 3 * s; ctx.setLineDash([7 * s, 6 * s]); ctx.lineDashOffset = -AP.game.t * 20 * s;
        U.rr(ctx, T.x - 6 * s, T.y - 6 * s, T.w + 12 * s, T.h + 12 * s, Math.min(T.w, T.h) / 2 + 6 * s); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(k, k); ctx.translate(-(bx + bw / 2), -(by + bh / 2));
      ctx.save(); ctx.shadowColor = 'rgba(255,79,184,0.6)'; ctx.shadowBlur = 16 * s; ctx.fillStyle = '#fff'; U.rr(ctx, bx, by, bw, bh, 18 * s); ctx.fill(); ctx.restore();
      ctx.strokeStyle = AP.art.PINK; ctx.lineWidth = 3 * s; U.rr(ctx, bx, by, bw, bh, 18 * s); ctx.stroke();
      AP.art.mascot(ctx, bx + pad + avR, by + bh / 2 + 3 * s, avR * 0.92, tp.mood || 'idle', AP.game.t);
      const ty0 = by + bh / 2 - (lines.length - 1) * lh / 2;
      lines.forEach((ln, i) => U.text(ctx, ln, bx + pad * 2 + avR * 2, ty0 + i * lh, { size: fs, color: '#3a1670', weight: 800, align: 'left', maxW: tw, minScale: 0.8 }));
      if (tp.done === 'tap') U.text(ctx, '▸', bx + bw - 14 * s, by + bh - 12 * s, { size: 12 * s, color: AP.art.PINK, weight: 900 });
      ctx.restore();
      if (P) C.hand(ctx, P.x, P.y, below ? Math.PI * 0.35 : -Math.PI * 0.35, s, AP.game.t);
      ctx.restore();
      C.rect = { x: bx, y: by, w: bw, h: bh };
    },
    // cartoon pointing hand: (x, y) = point to touch, ang = direction from that point to the hand
    hand(ctx, x, y, ang, s, t) {
      const bob = (Math.sin(t * 6) * 0.5 + 0.5) * 8 * s, k = s * 1.2, OL = '#8a5cc8';
      ctx.save(); ctx.translate(x + Math.cos(ang) * (8 * s + bob), y + Math.sin(ang) * (8 * s + bob)); ctx.rotate(ang - Math.PI / 2);
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = OL; ctx.lineWidth = 2.4 * k;
      const g = ctx.createLinearGradient(-12 * k, 0, 26 * k, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#eee4ff'); ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(-6 * k, 18 * k); ctx.quadraticCurveTo(-13 * k, 20 * k, -12 * k, 29 * k); ctx.quadraticCurveTo(-11 * k, 36 * k, -7 * k, 44 * k); ctx.lineTo(21 * k, 44 * k);
      ctx.quadraticCurveTo(26 * k, 38 * k, 25 * k, 33 * k); ctx.quadraticCurveTo(28 * k, 29 * k, 24 * k, 25 * k); ctx.quadraticCurveTo(26 * k, 19 * k, 19 * k, 18 * k); ctx.quadraticCurveTo(13 * k, 14 * k, 6 * k, 17 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
      U.rr(ctx, -5.5 * k, 0, 11 * k, 28 * k, 5.5 * k); ctx.fill(); ctx.stroke();
      U.rr(ctx, -9 * k, 42 * k, 32 * k, 10 * k, 5 * k); ctx.fill(); ctx.stroke();
      ctx.restore();
    },
  };
})();
