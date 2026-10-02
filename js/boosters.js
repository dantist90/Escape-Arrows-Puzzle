// ---------- Boosters: in-level (hint, shield, wand) and pre-level (heart, warmup, glow) ----------
// Stock lives in AP.save.boosters (AP.meta.boosters / addBooster). A booster opens at CONFIG.*.unlock with `gift` free uses
// (granted once, AP.save.seen['gift_<id>']). With no stock, tapping it opens the buy window: coins or a rewarded ad.
// The level start window (modal 'start') shows the pre-level boosters once the first of them is open.
(function () {
  const U = AP.util;
  AP.addStrings({
    en: { b_hint: 'Hint', b_shield: 'Shield', b_wand: 'Magic wand', b_heart: 'Extra heart', b_warmup: 'Warm-up', b_glow: 'Glow',
      bd_hint: 'Shows an arrow that can fly away', bd_shield: 'Your next mistake costs no heart', bd_wand: 'Tap any arrow to remove it',
      bd_heart: 'Start with 4 hearts', bd_warmup: '3 arrows fly away at the start', bd_glow: 'Free arrows glow for 10 seconds',
      new_booster: 'New booster!', start: 'Start', free: 'Free', pick_arrow: 'Tap any arrow', boosters: 'Boosters' },
    ru: { b_hint: 'Подсказка', b_shield: 'Щит', b_wand: 'Волшебная палочка', b_heart: 'Доп. сердце', b_warmup: 'Разминка', b_glow: 'Подсветка',
      bd_hint: 'Покажет стрелку, которая может улететь', bd_shield: 'Следующая ошибка не отнимет сердце', bd_wand: 'Нажми на любую стрелку — она исчезнет',
      bd_heart: 'Начни с 4 сердцами', bd_warmup: '3 стрелки улетят сами на старте', bd_glow: 'Свободные стрелки светятся 10 секунд',
      new_booster: 'Новый бустер!', start: 'Старт', free: 'Бесплатно', pick_arrow: 'Нажми на любую стрелку', boosters: 'Бустеры' },
    es: { b_hint: 'Pista', b_shield: 'Escudo', b_wand: 'Varita mágica', b_heart: 'Corazón extra', b_warmup: 'Calentamiento', b_glow: 'Brillo',
      bd_hint: 'Muestra una flecha que puede salir', bd_shield: 'Tu próximo error no quita corazón', bd_wand: 'Toca una flecha para quitarla',
      bd_heart: 'Empieza con 4 corazones', bd_warmup: '3 flechas salen solas al empezar', bd_glow: 'Las flechas libres brillan 10 s',
      new_booster: '¡Nuevo potenciador!', start: 'Empezar', free: 'Gratis', pick_arrow: 'Toca una flecha', boosters: 'Potenciadores' },
    de: { b_hint: 'Tipp', b_shield: 'Schild', b_wand: 'Zauberstab', b_heart: 'Extraherz', b_warmup: 'Aufwärmen', b_glow: 'Leuchten',
      bd_hint: 'Zeigt einen Pfeil, der raus kann', bd_shield: 'Dein nächster Fehler kostet kein Herz', bd_wand: 'Tippe einen Pfeil an, er verschwindet',
      bd_heart: 'Starte mit 4 Herzen', bd_warmup: '3 Pfeile fliegen beim Start weg', bd_glow: 'Freie Pfeile leuchten 10 Sek.',
      new_booster: 'Neuer Booster!', start: 'Start', free: 'Gratis', pick_arrow: 'Tippe einen Pfeil an', boosters: 'Booster' },
    fr: { b_hint: 'Indice', b_shield: 'Bouclier', b_wand: 'Baguette magique', b_heart: 'Cœur bonus', b_warmup: 'Échauffement', b_glow: 'Lueur',
      bd_hint: 'Montre une flèche qui peut sortir', bd_shield: 'Ta prochaine erreur ne coûte pas de cœur', bd_wand: 'Touche une flèche pour la retirer',
      bd_heart: 'Commence avec 4 cœurs', bd_warmup: '3 flèches s’envolent au départ', bd_glow: 'Les flèches libres brillent 10 s',
      new_booster: 'Nouveau bonus !', start: 'Jouer', free: 'Gratuit', pick_arrow: 'Touche une flèche', boosters: 'Bonus' },
    pt: { b_hint: 'Dica', b_shield: 'Escudo', b_wand: 'Varinha mágica', b_heart: 'Coração extra', b_warmup: 'Aquecimento', b_glow: 'Brilho',
      bd_hint: 'Mostra uma seta que pode sair', bd_shield: 'Seu próximo erro não custa coração', bd_wand: 'Toque numa seta para removê-la',
      bd_heart: 'Comece com 4 corações', bd_warmup: '3 setas saem sozinhas no início', bd_glow: 'Setas livres brilham por 10 s',
      new_booster: 'Novo bônus!', start: 'Começar', free: 'Grátis', pick_arrow: 'Toque numa seta', boosters: 'Bônus' },
    tr: { b_hint: 'İpucu', b_shield: 'Kalkan', b_wand: 'Sihirli değnek', b_heart: 'Ekstra kalp', b_warmup: 'Isınma', b_glow: 'Parıltı',
      bd_hint: 'Çıkabilecek bir oku gösterir', bd_shield: 'Sonraki hatan kalp götürmez', bd_wand: 'Bir oka dokun, kaybolsun',
      bd_heart: '4 kalple başla', bd_warmup: 'Başta 3 ok kendi uçar', bd_glow: 'Serbest oklar 10 sn parlar',
      new_booster: 'Yeni güçlendirici!', start: 'Başla', free: 'Ücretsiz', pick_arrow: 'Bir oka dokun', boosters: 'Güçlendiriciler' },
    pl: { b_hint: 'Podpowiedź', b_shield: 'Tarcza', b_wand: 'Różdżka', b_heart: 'Dodatkowe serce', b_warmup: 'Rozgrzewka', b_glow: 'Blask',
      bd_hint: 'Pokaże strzałkę, która może wylecieć', bd_shield: 'Następny błąd nie zabierze serca', bd_wand: 'Dotknij strzałki, a zniknie',
      bd_heart: 'Zacznij z 4 sercami', bd_warmup: '3 strzałki wylecą same na starcie', bd_glow: 'Wolne strzałki świecą 10 s',
      new_booster: 'Nowy bonus!', start: 'Start', free: 'Za darmo', pick_arrow: 'Dotknij strzałki', boosters: 'Bonusy' },
    it: { b_hint: 'Suggerimento', b_shield: 'Scudo', b_wand: 'Bacchetta magica', b_heart: 'Cuore extra', b_warmup: 'Riscaldamento', b_glow: 'Bagliore',
      bd_hint: 'Mostra una freccia che può uscire', bd_shield: 'Il prossimo errore non costa cuori', bd_wand: 'Tocca una freccia per toglierla',
      bd_heart: 'Inizia con 4 cuori', bd_warmup: '3 frecce volano via all’inizio', bd_glow: 'Le frecce libere brillano 10 s',
      new_booster: 'Nuovo potenziamento!', start: 'Via', free: 'Gratis', pick_arrow: 'Tocca una freccia', boosters: 'Potenziamenti' },
  });

  const ICON = { hint: 'hint', shield: 'shield', wand: 'wand', heart: 'heartplus', warmup: 'bolt', glow: 'eye' };
  const COL = { hint: '#ffb020', shield: '#3fd8ff', wand: '#9d5cff', heart: '#ff4d6d', warmup: '#ffc93a', glow: '#46e08a' };
  const BO = AP.boosters = {
    IN: ['hint', 'shield', 'wand'], PRE: ['heart', 'warmup', 'glow'], ICON, COL,
    cfg(id) { return AP.CONFIG.boosters[id] || AP.CONFIG.preBoosters[id]; },
    open(id, lvl) { return AP.CONFIG.debug.unlockAll || (lvl ?? AP.save.level) >= BO.cfg(id).unlock; },
    count(id) { return AP.meta.boosters(id); },
    // free uses for every booster that opened by level n (once); returns the ids that were just gifted
    gifts(n) { const out = []; for (const id of BO.IN.concat(BO.PRE)) { const c = BO.cfg(id); if (n >= c.unlock && !AP.save.seen['gift_' + id]) {
      AP.save.seen['gift_' + id] = 1; AP.meta.addBooster(id, c.gift); out.push(id); } } if (out.length) AP.persist(); return out; },
    use(id) { if (BO.count(id) <= 0) return false; AP.meta.addBooster(id, -1); AP.poki.measure('booster', id, 'use'); return true; },
    // round booster button with the stock badge (or a "+" when empty, a lock when closed)
    button(ctx, id, x, y, size, onClick, opts = {}) {
      const open = BO.open(id, opts.lvl), n = BO.count(id), s = AP.ui.scale;
      AP.ui.iconButton('bst_' + id, x, y, size, (c, cx, cy, r) => AP.art.icon(c, open ? ICON[id] : 'lock', cx, cy, r * (open ? 1.35 : 1.1)),
        open ? onClick : () => { AP.audio.bump(); AP.ui.toast(AP.t('unlock_at', { n: BO.cfg(id).unlock })); }, open ? (opts.active ? '#ffffff' : COL[id]) : '#5a4a8a');
      if (opts.active) { ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * s; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12 * s; ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2 + 3 * s, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
      if (!open) return; const bx = x + size - 6 * s, by = y + 6 * s, br = 11 * s;
      ctx.fillStyle = n > 0 ? '#ff4fb8' : AP.art.GREEN; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * s; ctx.stroke();
      if (n > 0) U.text(ctx, n, bx, by + 0.5, { size: 12 * s, color: '#fff', weight: 900, maxW: br * 1.8 }); else AP.art.icon(ctx, 'plus', bx, by, br * 0.6);
    },
  };

  // ----- buy window: one booster for coins or for a rewarded ad -----
  AP.modals.buy = function (ctx, w, h, m) {
    const s = AP.ui.fitS(330), id = m.id, c = BO.cfg(id); const pw = Math.min(w - 32 * s, 360 * s), ph = 330 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, COL[id]);
    U.text(ctx, AP.t('b_' + id), w / 2, y + 36 * s, { size: 23 * s, color: '#fff', weight: 900, maxW: pw - 90 * s });
    AP.ui.iconButton('buy_close', x + pw - 46 * s, y + 12 * s, 36 * s, (cc, cx, cy, r) => AP.art.icon(cc, 'close', cx, cy, r), () => { AP.audio.click(); AP.game.modal = m.back || null; });
    AP.art.glow(ctx, w / 2, y + 108 * s, 60 * s, 0.4, COL[id]); AP.art.candyDisc(ctx, w / 2, y + 108 * s, 40 * s, COL[id]); AP.art.icon(ctx, ICON[id], w / 2, y + 106 * s, 24 * s);
    U.wrap(ctx, AP.t('bd_' + id), w / 2, y + 172 * s, pw - 40 * s, 19 * s, { size: 15 * s, color: AP.art.INK_DIM, weight: 800, maxLines: 2 });
    const bw = pw - 48 * s, done = () => { AP.audio.sparkle(); AP.game.modal = m.back || null; if (m.after) m.after(); };
    AP.ui.button('buy_coins', x + 24 * s, y + ph - 128 * s, bw, 50 * s, '+1  ' + c.price, { color: AP.art.YELLOW, size: 19 * s, icon: (cc, ix, iy) => AP.art.currency(cc, 'coins', ix, iy, 11 * s), iconRight: true,
      onClick: () => { if (AP.meta.spend({ type: 'coins', n: c.price })) { AP.meta.addBooster(id, 1); done(); } } });
    AP.poki.rewardedVisible('booster');
    AP.ui.button('buy_ad', x + 24 * s, y + ph - 68 * s, bw, 50 * s, '+1  ' + AP.t('free'), { color: AP.art.PINK, size: 19 * s, icon: (cc, ix, iy) => AP.art.currency(cc, 'ad', ix, iy, 12 * s), iconRight: true,
      onClick: () => { const wasPlaying = AP.poki.playing; AP.poki.gameplayStop(); AP.poki.rewardedBreak('booster').then(ok => { if (ok) { AP.meta.addBooster(id, 1); done(); } if (wasPlaying) AP.poki.gameplayStart(); }); } });
  };

  // ----- level start window: level, difficulty, pre-level boosters (tap to select), Start -----
  AP.modals.start = function (ctx, w, h, m) {
    const s = AP.ui.fitS(370), n = m.n; const pw = Math.min(w - 32 * s, 400 * s), ph = 370 * s, x = w / 2 - pw / 2, y = h / 2 - ph / 2;
    const diff = (AP.levelData(n) || {}).diff || 'easy'; const dcol = { easy: AP.art.GREEN, normal: AP.art.CYAN, hard: AP.art.PINK, superhard: AP.art.RED }[diff];
    AP.art.panel(ctx, x, y, pw, ph, 24 * s, dcol);
    U.text(ctx, AP.t('level_n', { n }), w / 2, y + 38 * s, { size: 28 * s, color: '#fff', weight: 900, maxW: pw - 100 * s });
    U.text(ctx, AP.t('diff_' + diff), w / 2, y + 70 * s, { size: 15 * s, color: dcol, weight: 900, maxW: pw - 60 * s });
    AP.ui.iconButton('start_close', x + pw - 46 * s, y + 12 * s, 36 * s, (c, cx, cy, r) => AP.art.icon(c, 'close', cx, cy, r), () => { AP.audio.click(); AP.game.modal = null; if (AP.game.state === 'level') AP.game.open('lobby'); });
    U.text(ctx, AP.t('boosters'), w / 2, y + 104 * s, { size: 14 * s, color: AP.art.INK_DIM, weight: 800 });
    const cs = Math.min(76 * s, (pw - 60 * s) / 3), gap = (pw - cs * 3) / 4; m.sel = m.sel || {};
    BO.PRE.forEach((id, i) => { const bx = x + gap + i * (cs + gap), by = y + 122 * s; const open = BO.open(id, n);
      if (open && m.sel[id]) AP.art.glow(ctx, bx + cs / 2, by + cs / 2, cs * 0.85, 0.5, COL[id]);
      BO.button(ctx, id, bx, by, cs, () => { if (BO.count(id) <= 0) { AP.audio.click(); AP.game.modal = { type: 'buy', id, back: m, after: () => { m.sel[id] = true; } }; return; }
        m.sel[id] = !m.sel[id]; AP.audio.select(); }, { lvl: n, active: open && m.sel[id] });
      U.wrap(ctx, AP.t('b_' + id), bx + cs / 2, by + cs + 16 * s, cs + gap * 0.9, 14 * s, { size: 12 * s, color: '#fff', weight: 800, maxLines: 2 }); });
    AP.ui.button('start_go', x + 24 * s, y + ph - 82 * s, pw - 48 * s, 62 * s, AP.t('start'), { color: AP.art.PINK, size: 24 * s, icon: (c, ix, iy) => AP.art.icon(c, 'play', ix, iy, 11 * s),
      onClick: () => { const pre = {}; BO.PRE.forEach(id => { if (m.sel[id] && BO.open(id, n) && BO.count(id) > 0) { AP.meta.addBooster(id, -1); pre[id] = true; AP.poki.measure('prebooster', id, 'select'); } });
        AP.game.modal = null; AP.game.open('level', { n, pre }, { ad: n >= AP.CONFIG.level.adFromLevel }); } });
  };
  // Play from the lobby / Next from the win window: the start window once pre-level boosters exist, otherwise straight in
  AP.playLevel = function (n) {
    BO.gifts(n);
    const firstPre = Math.min(...BO.PRE.map(id => BO.cfg(id).unlock));
    if (n >= firstPre || AP.CONFIG.debug.unlockAll) { AP.game.modal = { type: 'start', n }; return; }
    AP.game.modal = null; AP.game.open('level', { n }, { ad: n >= AP.CONFIG.level.adFromLevel });
  };
})();
