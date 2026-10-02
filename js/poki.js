// ---------- Poki SDK wrapper ----------
// Uses the real PokiSDK when loaded (poki.com), otherwise a shim that simulates ad breaks so the game can be tested locally.
// Every event the game sends goes through P.measure(); the list of events is EVENTS.md (keep it in sync).
const P = AP.poki = {
  ready: false, sdk: null, adRunning: false, fake: false, fakeTimer: 0, fakeLabel: '',
  init() {
    if (window.PokiSDK && !AP.QA.noSdk) {
      P.sdk = window.PokiSDK;
      return P.sdk.init().then(() => { P.ready = true; }).catch(() => { P.ready = false; });
    }
    P.fake = true; P.ready = true; return Promise.resolve();
  },
  loadingFinished() { P.log.push('loadingFinished'); if (P.sdk) P.sdk.gameLoadingFinished(); },
  // Poki requires gameplayStart() to follow a real player interaction and start/stop to alternate (no duplicates).
  // The game asks for gameplay (want); the SDK event fires on the first tap / key press after that.
  want: false, playing: false, interacted: false, log: [], events: [],
  sdkStart() { if (P.playing || !P.want || !P.interacted) return; P.playing = true; P.log.push('start'); if (P.sdk) P.sdk.gameplayStart(); },
  gameplayStart() { P.want = true; P.sdkStart(); },
  gameplayStop() { P.want = false; if (!P.playing) return; P.playing = false; P.log.push('stop'); if (P.sdk) P.sdk.gameplayStop(); },
  onInteract() { P.interacted = true; P.sdkStart(); },

  // ----- game events: PokiSDK.measure(category, what, action) -----
  // Values must not contain "/" or "^" (Poki reserves them); they are replaced with "-".
  // Every call is also kept in P.events (QA rigs compare it with EVENTS.md) and printed with ?evlog=1.
  measure(category, what, action) {
    const clean = v => String(v).replace(/[\/^]/g, '-');
    const e = [clean(category), clean(what), clean(action)];
    P.events.push(e.join(' / ')); if (P.events.length > 500) P.events.shift();
    if (/[?&]evlog=1/.test(location.search)) console.log('[measure]', e.join(' / '));
    try { if (P.sdk && P.sdk.measure) P.sdk.measure(e[0], e[1], e[2]); } catch (err) { /* never break the game over analytics */ }
  },
  // level funnel: one start, then exactly one outcome per attempt (complete OR fail)
  levelOpen: null,
  levelStart(n, diff) { P.levelOpen = String(n); P.measure('level', n, 'start'); if (diff) P.measure('difficulty', diff, 'start'); },
  levelEnd(n, ok) { if (P.levelOpen !== String(n)) return; P.levelOpen = null; P.measure('level', n, ok ? 'complete' : 'fail'); },

  // Interstitial. Returns a promise; audio is muted for the duration.
  commercialBreak() {
    if (P.adRunning) return Promise.resolve();
    P.adRunning = true; AP.audio.setAdMute(true); P.log.push('commercialBreak');
    const finish = () => { P.adRunning = false; AP.audio.setAdMute(false); };
    if (P.sdk) return P.sdk.commercialBreak(() => {}).then(finish).catch(finish);
    return P.fakeBreak('AD BREAK (interstitial)', 1.5).then(finish);
  },
  // Rewarded. Resolves to true if the player should get the reward. `placement` feeds the rewarded/<placement>/interact event.
  rewardedBreak(placement) {
    if (P.adRunning) return Promise.resolve(false);
    if (placement) P.measure('rewarded', placement, 'interact');
    P.adRunning = true; AP.audio.setAdMute(true); P.log.push('rewardedBreak');
    const finish = ok => { P.adRunning = false; AP.audio.setAdMute(false); return ok; };
    if (P.sdk) return P.sdk.rewardedBreak(() => {}).then(finish).catch(() => finish(false));
    return P.fakeBreak('REWARDED AD', 2).then(() => finish(true));
  },
  // a rewarded button became visible: send rewarded/<placement>/visible once per screen visit (the caller resets `shown`)
  shown: {},
  rewardedVisible(placement) { if (P.shown[placement]) return; P.shown[placement] = 1; P.measure('rewarded', placement, 'visible'); },
  fakeBreak(label, secs) { P.fakeLabel = label; P.fakeTimer = secs; const ms = AP.QA && AP.QA.fast ? 50 : secs * 1000; return new Promise(res => setTimeout(res, ms)); },
  // draws the local placeholder overlay
  drawFake(ctx, w, h, dt) {
    if (!P.fake || P.fakeTimer <= 0) return; P.fakeTimer -= dt;
    ctx.fillStyle = 'rgba(14,6,40,0.88)'; ctx.fillRect(0, 0, w, h);
    AP.util.text(ctx, P.fakeLabel, w / 2, h / 2 - 10, { size: 28, color: '#fff' });
    AP.util.text(ctx, Math.ceil(P.fakeTimer) + 's  (local placeholder — real ads on Poki)', w / 2, h / 2 + 28, { size: 14, color: '#c9b8ff', weight: 600 });
  },
};
['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, e => { if (e.isTrusted !== false) P.onInteract(); }, { capture: true, passive: true }));
