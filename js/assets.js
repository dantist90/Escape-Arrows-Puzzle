// ---------- Image assets: PNG files listed in assets/manifest.json (an atlas manifest {atlas:{images,frames}} also works) ----------
// Every drawing function keeps its procedural fallback; if a sprite with the matching name is loaded it is drawn instead.
// Names are paths under assets/images without extension, e.g. "ui/logo", "mascot/idle".
// Loading is prioritised by the player's path. Every image belongs to a group (its first folder, see tools/build.mjs);
// groups load in this order, a few files at a time:
//   boot - loader / logo / transition        first - the first level (board, FTUE mascot)
//   hub  - lobby, roadmap, popups            meta  - room, album, skins, tournament      rest - everything else
// The boot loader waits for boot+first; the rest streams in the background. A transition boosts the group it leads to
// (AP.assets.boost) and waits for it (AP.assets.need) while the screen is covered.
const AS = AP.assets = {
  frames: {}, images: [], ready: false, pending: 0,
  ORDER: ['boot', 'first', 'hub', 'meta', 'rest'],
  queue: [], active: 0, MAX: 6, groups: {}, waiters: [], boosted: {},
  grp(g) { return AS.groups[g] || (AS.groups[g] = { total: 0, done: 0 }); },
  // Called once at boot. The packed atlas (build) or the dev manifest of individual files; `done` fires when the list is known.
  load(done) {
    const listed = () => { AS.listed = true; AS.pump(); AS.check(); if (done) done(); };
    // standalone file (tools/pack-standalone.mjs): images are inlined as data URLs, nothing to fetch
    if (window.AP_INLINE_IMAGES) { window.AP_INLINE_IMAGES.forEach(e => { const name = e.p.replace(/\.[a-z0-9]+$/i, '');
      AS.add(e.d, e.g || AS.guess(e.p), img => { AS.frames[name] = { img, x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }; }); }); listed(); return; }
    AS.fetchJSON('assets/manifest.json', man => {
      if (man && man.atlas) AS.loadAtlas(man.atlas); else if (man && man.images) AS.loadFiles(man.images);
      listed();
    });
  },
  fetchJSON(url, cb) {
    try { fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(cb).catch(() => cb(null)); } catch (e) { cb(null); }
  },
  // one queued image: {src, group, onload}
  add(src, group, onload) { group = AS.ORDER.includes(group) ? group : 'rest'; AS.grp(group).total++; AS.queue.push({ src, group, onload }); },
  prio(it) { return AS.boosted[it.group] ? -100 + AS.boosted[it.group] : AS.ORDER.indexOf(it.group); },
  pump() {
    while (AS.active < AS.MAX && AS.queue.length) {
      let bi = 0; for (let k = 1; k < AS.queue.length; k++) if (AS.prio(AS.queue[k]) < AS.prio(AS.queue[bi])) bi = k;
      const it = AS.queue.splice(bi, 1)[0]; AS.active++;
      const img = new Image(); const end = ok => { AS.active--; AS.grp(it.group).done++; if (ok && it.onload) it.onload(img); AS.pump(); AS.check(); };
      img.onload = () => end(true); img.onerror = () => end(false); img.src = it.src; if (it.keep) it.keep(img);
    }
  },
  // 0..1 for the given groups (1 when they have nothing to load)
  progress(groups) { if (!AS.listed) return 0; let t = 0, d = 0; (groups || AS.ORDER).forEach(g => { const G = AS.grp(g); t += G.total; d += G.done; }); return t ? d / t : 1; },
  // promise: resolves when every image of these groups is loaded (or failed)
  need(groups) { AS.boost(groups); return new Promise(res => { AS.waiters.push({ groups, res }); AS.check(); }); },
  boost(groups) { let n = 0; (groups || []).forEach(g => { if (!AS.boosted[g]) AS.boosted[g] = ++n + Object.keys(AS.boosted).length; }); },
  check() {
    if (!AS.listed) return;
    AS.waiters = AS.waiters.filter(w => { if (AS.progress(w.groups) >= 1) { w.res(); return false; } return true; });
    if (!AS.ready && AS.progress() >= 1) AS.ready = true;
  },
  loadAtlas(atlas) {
    atlas.images.forEach((src, idx) => { const g = (atlas.groups && atlas.groups[idx]) || 'rest'; AS.add('assets/' + src, g, img => { AS.images[idx] = img; }); });
    for (const name in atlas.frames) { const f = atlas.frames[name]; AS.frames[name] = { idx: f.i || 0, x: f.x, y: f.y, w: f.w, h: f.h }; }
  },
  loadFiles(list) {
    list.forEach(e => { const path = typeof e === 'string' ? e : e.p, g = typeof e === 'string' ? AS.guess(path) : e.g; const name = path.replace(/\.[a-z0-9]+$/i, '');
      AS.add('assets/images/' + path, g, img => { AS.frames[name] = { img, x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }; }); });
  },
  guess(path) { const g = path.split('/')[0]; return AS.ORDER.includes(g) ? g : 'rest'; }, // manifest entries without a group: the first folder decides
  has(name) { return !!AS.frames[name]; },
  // draw sprite centered at (x, y) scaled to fit w×h (keeps aspect); returns false when the sprite is missing
  draw(ctx, name, x, y, w, h, opts = {}) {
    const f = AS.frames[name]; if (!f) return false; const img = f.img || AS.images[f.idx]; if (!img || !img.complete || !img.naturalWidth) return false;
    const k = Math.min(w / f.w, h / f.h); const dw = f.w * k, dh = f.h * k;
    const ax = opts.anchorX ?? 0.5, ay = opts.anchorY ?? 0.5;
    ctx.drawImage(img, f.x, f.y, f.w, f.h, x - dw * ax, y - dh * ay, dw, dh); return true;
  },
};
