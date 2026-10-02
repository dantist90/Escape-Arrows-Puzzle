// ---------- Boot, render loop, input, QA hooks ----------
(function () {
  const canvas = document.getElementById('game'); const ctx = canvas.getContext('2d'); AP.ctx = ctx;
  let W = 0, H = 0, dpr = 1, last = 0, activePointer = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    AP.ui.computeLayout(W, H);
  }
  window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 100)); resize();

  // ----- input: one pointer at a time; a press on a widget goes to the widget, otherwise to the scene -----
  // (pinch zoom on the board in stage 1 will need the second pointer: route it through AP.game.onPinch there)
  const blocked = () => AP.poki.adRunning || AP.trans.active || AP.boot.active;
  function down(x, y) {
    AP.audio.init(); AP.audio.resume();
    AP.ui.pointer.x = x; AP.ui.pointer.y = y; AP.ui.pointer.down = true;
    if (blocked()) return;
    const hit = AP.ui.find(x, y);
    if (hit) { AP.ui.pressed = hit.id; if (hit.onDown) hit.onDown(); }
    else { AP.ui.pressed = null; AP.game.onDown(x, y); }
  }
  function move(x, y) { AP.ui.pointer.x = x; AP.ui.pointer.y = y; if (AP.ui.pointer.down) AP.game.onMove(x, y); }
  function up(x, y) {
    AP.ui.pointer.x = x; AP.ui.pointer.y = y; AP.ui.pointer.down = false;
    const pressed = AP.ui.pressed; AP.ui.pressed = null;
    if (pressed && !blocked()) {
      const hit = AP.ui.hits.find(h => h.id === pressed);
      if (hit && hit.onUp) hit.onUp();
      if (hit && hit.onClick && AP.util.inRect(x, y, hit.rect)) hit.onClick();
    }
    AP.game.onUp(x, y);
  }
  canvas.addEventListener('pointerdown', e => { if (activePointer !== null && activePointer !== e.pointerId) return; activePointer = e.pointerId; down(e.clientX, e.clientY); e.preventDefault(); });
  canvas.addEventListener('pointermove', e => { if (activePointer !== null && activePointer !== e.pointerId) return; move(e.clientX, e.clientY); });
  const onUp = e => { if (activePointer !== null && activePointer !== e.pointerId) return; activePointer = null; up(e.clientX, e.clientY); };
  canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
  window.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => { if (AP.ui.wheel(e.clientX, e.clientY, e.deltaX, e.deltaY)) e.preventDefault(); }, { passive: false });
  window.addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault(); });

  // ----- one frame: update everything by dt, then draw (the QA rigs call it directly with a fixed dt) -----
  function tick(dt) {
    AP.game.dt = dt;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); AP.ui.begin();
    if (AP.boot.active && !AP.boot.fade) { AP.boot.update(dt); AP.boot.draw(ctx, W, H); return; } // start loader
    AP.updateTweens(dt); AP.updateParticles(dt); AP.game.update(dt); AP.trans.update(dt);
    AP.game.draw(ctx, W, H); AP.trans.draw(ctx, W, H); AP.poki.drawFake(ctx, W, H, dt);
    if (AP.boot.active) { AP.boot.update(dt); AP.boot.draw(ctx, W, H); } // the loader fades out over the first scene
  }
  let qaHold = false; // while a rig steps the game by hand, rAF frames are skipped so time is deterministic
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (!qaHold) tick(dt);
    requestAnimationFrame(frame);
  }

  // ----- boot -----
  AP.load(); AP.ui.computeLayout(W, H);
  const fontReady = (document.fonts && document.fonts.load) ? document.fonts.load('900 16px "ArrowsFont"').catch(() => null) : Promise.resolve();
  const assetsListed = new Promise(res => AP.assets.load(res));
  const firstAssets = assetsListed.then(() => AP.assets.need(['boot', 'first']));
  const cap = new Promise(res => setTimeout(res, 15000)); // a broken network never blocks the game for good
  AP.boot.start(Promise.all([AP.poki.init(), Promise.race([Promise.all([fontReady, firstAssets]), cap])]), () => {
    AP.poki.loadingFinished();
    AP.game.go('lobby');
  });
  fontReady.then(() => document.getElementById('loader').classList.add('hide')); // the HTML loader only covers the script download
  requestAnimationFrame(t => { last = t; frame(t); });

  // ----- QA API for the headless rigs (?qa=1). Rigs judge game STATE, not pixels. -----
  if (AP.QA.on) {
    window.QA = {
      // advance the game by `secs` of game time in 1/60 steps (rAF may stall in headless Chrome)
      step(secs) { qaHold = true; const n = Math.max(1, Math.round(secs * 60)); for (let i = 0; i < n; i++) tick(1 / 60); qaHold = false; return QA.state(); },
      state() {
        return { ready: !AP.boot.active, scene: AP.game.state, modal: AP.game.modal && AP.game.modal.type, trans: AP.trans.active, lang: AP.lang,
          level: AP.save.level, coins: AP.save.coins, tickets: AP.save.tickets, stars: AP.save.stars, arrows: AP.save.arrows,
          layout: { w: W, h: H, s: AP.ui.scale, portrait: AP.ui.layout.portrait }, events: AP.poki.events.slice(), sdk: AP.poki.log.slice() };
      },
      // hit rects drawn in the last frame, by id
      hits() { return AP.ui.hits.map(h => ({ id: h.id, ...h.rect })); },
      // tap a widget by id (centre of its rect), as a real pointer would
      tap(id) { const h = AP.ui.hits.find(k => k.id === id); if (!h) return false; const x = h.rect.x + h.rect.w / 2, y = h.rect.y + h.rect.h / 2; AP.poki.onInteract(); down(x, y); up(x, y); return true; },
      tapAt(x, y) { AP.poki.onInteract(); down(x, y); up(x, y); },
      goto(id, arg) { AP.game.go(id, arg); },
    };
  }
})();
