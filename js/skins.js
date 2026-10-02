// ---------- Skins: arrow palettes and backgrounds (shop for coins; some only from the Roadmap) ----------
// AP.save.skin / AP.save.bg = equipped ids, AP.save.owned = {id: 1}. Prices: CONFIG.skins / CONFIG.backgrounds (null = Roadmap only).
// AP.skins.apply() pushes the equipped ones into AP.art (TUBE colours for arrows, BG_TOP / BG_BOT for the background).
// Events: cosmetic/<id>/unlocked (bought or won), cosmetic/<id>/equip.
(function () {
  const U = AP.util;
  const PAL = {
    neon: ['#ffb020', '#ff4fb8', '#a24bff'], candy: ['#ff9ad5', '#ffd1f0', '#b38bff'], ocean: ['#3fd8ff', '#3f8bff', '#7a5cff'],
    mint: ['#b6ff6b', '#46e08a', '#2fc6c0'], sunset: ['#ffe066', '#ff8a3d', '#ff3d6d'], galaxy: ['#ffffff', '#9d5cff', '#3fd8ff'], gold: ['#fff2a0', '#ffc93a', '#ff9a1e'],
  };
  const BGS = { violet: ['#2a0b6e', '#4a1bb0'], midnight: ['#070a2a', '#1a2a6e'], rose: ['#4a0b3e', '#a01b6e'], aurora: ['#062a3a', '#1b6e6a'], sunset: ['#3a0b2a', '#b04a1b'] };
  AP.addStrings({
    en: { sk_arrows: 'Arrows', sk_bg: 'Backgrounds', equip: 'Use', equipped: 'In use', roadmap_only: 'Roadmap',
      sk_neon: 'Neon', sk_candy: 'Candy', sk_ocean: 'Ocean', sk_mint: 'Mint', sk_sunset: 'Sunset', sk_galaxy: 'Galaxy', sk_gold: 'Gold', bg_violet: 'Violet', bg_midnight: 'Midnight', bg_rose: 'Rose', bg_aurora: 'Aurora', bg_sunset: 'Sunset' },
    ru: { sk_arrows: 'Стрелки', sk_bg: 'Фоны', equip: 'Выбрать', equipped: 'Выбрано', roadmap_only: 'Путь наград',
      sk_neon: 'Неон', sk_candy: 'Конфетка', sk_ocean: 'Океан', sk_mint: 'Мята', sk_sunset: 'Закат', sk_galaxy: 'Галактика', sk_gold: 'Золото', bg_violet: 'Фиалка', bg_midnight: 'Полночь', bg_rose: 'Роза', bg_aurora: 'Сияние', bg_sunset: 'Закат' },
    es: { sk_arrows: 'Flechas', sk_bg: 'Fondos', equip: 'Usar', equipped: 'En uso', roadmap_only: 'Ruta',
      sk_neon: 'Neón', sk_candy: 'Caramelo', sk_ocean: 'Océano', sk_mint: 'Menta', sk_sunset: 'Atardecer', sk_galaxy: 'Galaxia', sk_gold: 'Oro', bg_violet: 'Violeta', bg_midnight: 'Medianoche', bg_rose: 'Rosa', bg_aurora: 'Aurora', bg_sunset: 'Atardecer' },
    de: { sk_arrows: 'Pfeile', sk_bg: 'Hintergründe', equip: 'Nutzen', equipped: 'Aktiv', roadmap_only: 'Weg',
      sk_neon: 'Neon', sk_candy: 'Bonbon', sk_ocean: 'Ozean', sk_mint: 'Minze', sk_sunset: 'Abendrot', sk_galaxy: 'Galaxie', sk_gold: 'Gold', bg_violet: 'Violett', bg_midnight: 'Mitternacht', bg_rose: 'Rosa', bg_aurora: 'Polarlicht', bg_sunset: 'Abendrot' },
    fr: { sk_arrows: 'Flèches', sk_bg: 'Fonds', equip: 'Choisir', equipped: 'Actif', roadmap_only: 'Parcours',
      sk_neon: 'Néon', sk_candy: 'Bonbon', sk_ocean: 'Océan', sk_mint: 'Menthe', sk_sunset: 'Couchant', sk_galaxy: 'Galaxie', sk_gold: 'Or', bg_violet: 'Violet', bg_midnight: 'Minuit', bg_rose: 'Rose', bg_aurora: 'Aurore', bg_sunset: 'Couchant' },
    pt: { sk_arrows: 'Setas', sk_bg: 'Fundos', equip: 'Usar', equipped: 'Em uso', roadmap_only: 'Trilha',
      sk_neon: 'Neon', sk_candy: 'Doce', sk_ocean: 'Oceano', sk_mint: 'Menta', sk_sunset: 'Pôr do sol', sk_galaxy: 'Galáxia', sk_gold: 'Ouro', bg_violet: 'Violeta', bg_midnight: 'Meia-noite', bg_rose: 'Rosa', bg_aurora: 'Aurora', bg_sunset: 'Pôr do sol' },
    tr: { sk_arrows: 'Oklar', sk_bg: 'Arka planlar', equip: 'Seç', equipped: 'Seçili', roadmap_only: 'Ödül yolu',
      sk_neon: 'Neon', sk_candy: 'Şeker', sk_ocean: 'Okyanus', sk_mint: 'Nane', sk_sunset: 'Gün batımı', sk_galaxy: 'Galaksi', sk_gold: 'Altın', bg_violet: 'Menekşe', bg_midnight: 'Gece yarısı', bg_rose: 'Gül', bg_aurora: 'Kutup ışığı', bg_sunset: 'Gün batımı' },
    pl: { sk_arrows: 'Strzałki', sk_bg: 'Tła', equip: 'Wybierz', equipped: 'Wybrane', roadmap_only: 'Ścieżka',
      sk_neon: 'Neon', sk_candy: 'Cukierek', sk_ocean: 'Ocean', sk_mint: 'Mięta', sk_sunset: 'Zachód', sk_galaxy: 'Galaktyka', sk_gold: 'Złoto', bg_violet: 'Fiolet', bg_midnight: 'Północ', bg_rose: 'Róża', bg_aurora: 'Zorza', bg_sunset: 'Zachód' },
    it: { sk_arrows: 'Frecce', sk_bg: 'Sfondi', equip: 'Usa', equipped: 'In uso', roadmap_only: 'Percorso',
      sk_neon: 'Neon', sk_candy: 'Caramella', sk_ocean: 'Oceano', sk_mint: 'Menta', sk_sunset: 'Tramonto', sk_galaxy: 'Galassia', sk_gold: 'Oro', bg_violet: 'Viola', bg_midnight: 'Mezzanotte', bg_rose: 'Rosa', bg_aurora: 'Aurora', bg_sunset: 'Tramonto' },
  });

  const SK = AP.skins = {
    PAL, BGS,
    apply() { AP.art.TUBE = PAL[AP.save.skin] || PAL.neon; const b = BGS[AP.save.bg] || BGS.violet; AP.art.BG_TOP = b[0]; AP.art.BG_BOT = b[1]; },
    price(kind, id) { return (kind === 'arrows' ? AP.CONFIG.skins : AP.CONFIG.backgrounds)[id]; },
    // tap on a cell: equip if owned, buy if it has a price, else say where it comes from
    pick(kind, id) {
      const own = AP.save.owned[id], key = kind === 'arrows' ? 'skin' : 'bg';
      if (!own) { const p = SK.price(kind, id); if (p === null || p === undefined) { AP.audio.bump(); AP.ui.toast(AP.t('roadmap_only')); return; }
        if (!AP.meta.spend({ type: 'coins', n: p })) return; AP.save.owned[id] = 1; AP.poki.measure('cosmetic', id, 'unlocked'); AP.audio.sparkle(); }
      if (AP.save[key] !== id) { AP.save[key] = id; AP.poki.measure('cosmetic', id, 'equip'); SK.apply(); AP.persist(); AP.audio.select(); }
    },
  };

  // ----- the Skins screen: two tabs, a scrolling grid of preview cells -----
  const S = AP.screens.skins = {
    tab: 'arrows',
    enter() { AP.poki.gameplayStop(); },
    draw(ctx, w, h) {
      const L = AP.ui.layout, s = L.s; AP.art.background(ctx, w, h, AP.game.t);
      AP.game.topBar(ctx, { pills: ['coins'], title: AP.t('skins') });
      const st = L.stage, tw = Math.min(st.w - 24 * s, 420 * s), tx = st.x + st.w / 2 - tw / 2, ty = st.y + 6 * s, th = 44 * s;
      [['arrows', 'sk_arrows'], ['bg', 'sk_bg']].forEach(([k, lbl], i) => AP.ui.button('sk_tab_' + k, tx + i * (tw / 2 + 4 * s), ty, tw / 2 - 4 * s, th, AP.t(lbl), { color: S.tab === k ? AP.art.PINK : '#4a2fa0', size: 16 * s, onClick: () => { S.tab = k; AP.audio.click(); } }));
      AP.game.footBar(ctx, 540 * s);
      const ids = Object.keys(S.tab === 'arrows' ? PAL : BGS); const rect = { x: st.x + 10 * s, y: ty + th + 10 * s, w: st.w - 20 * s, h: L.foot.y - (ty + th + 14 * s) };
      AP.ui.grid('sk_' + S.tab, rect, ids, (id, x, y, size, i, hh) => S.cell(ctx, id, x, y, size, hh, s), { cols: L.portrait ? 2 : 4, aspect: 1.15, maxSize: 200 * s });
    },
    cell(ctx, id, x, y, sz, hh, s) {
      const kind = S.tab, own = !!AP.save.owned[id], on = (kind === 'arrows' ? AP.save.skin : AP.save.bg) === id, price = SK.price(kind, id);
      AP.art.panel(ctx, x, y, sz, hh, 16 * s, on ? AP.art.GREEN : '#6b4fd0', 0.85);
      // preview: a few tubes in the palette / a mini background with a tube on it
      const px = x + 10 * s, py = y + 10 * s, pw = sz - 20 * s, ph = hh * 0.55;
      ctx.save(); U.rr(ctx, px, py, pw, ph, 10 * s); ctx.clip();
      const bg = kind === 'bg' ? BGS[id] : BGS[AP.save.bg] || BGS.violet; const g = ctx.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); ctx.fillStyle = g; ctx.fillRect(px, py, pw, ph);
      const pal = kind === 'arrows' ? PAL[id] : PAL[AP.save.skin] || PAL.neon, c = pw / 6;
      AP.art.tube(ctx, [[px + c, py + ph - c * 0.8], [px + c, py + c * 0.9], [px + c * 2.6, py + c * 0.9]], c * 0.38, pal);
      AP.art.tube(ctx, [[px + pw - c, py + ph * 0.25], [px + pw - c, py + ph - c * 0.9], [px + pw - c * 2.8, py + ph - c * 0.9]], c * 0.38, pal.slice().reverse());
      ctx.restore();
      U.text(ctx, AP.t((kind === 'arrows' ? 'sk_' : 'bg_') + id), x + sz / 2, py + ph + 18 * s, { size: 15 * s, color: '#fff', weight: 900, maxW: sz - 16 * s });
      const bh = Math.min(36 * s, hh - ph - 46 * s), by = y + hh - bh - 10 * s, label = on ? AP.t('equipped') : own ? AP.t('equip') : price === null || price === undefined ? AP.t('roadmap_only') : String(price);
      AP.ui.button('sk_' + id, x + 10 * s, by, sz - 20 * s, bh, label, { color: on ? AP.art.GREEN : own ? AP.art.VIOLET : AP.art.YELLOW, size: 14 * s, disabled: on,
        icon: !own && price ? (cc, ix, iy) => AP.art.currency(cc, 'coins', ix, iy, 9 * s) : null, onClick: () => SK.pick(kind, id) });
    },
  };
})();
