// ---------- Procedural audio (WebAudio, no sample files) ----------
const A = AP.audio = {
  ctx: null, master: null, muted: false, adMuted: false,
  init() {
    if (A.ctx) return;
    try {
      A.ctx = new (window.AudioContext || window.webkitAudioContext)();
      A.master = A.ctx.createGain(); A.master.gain.value = 0.6; A.master.connect(A.ctx.destination); // sfx bus
      A.musicBus = A.ctx.createGain(); A.musicBus.gain.value = 0; A.musicBus.connect(A.ctx.destination);
      A.musicLP = A.ctx.createBiquadFilter(); A.musicLP.type = 'lowpass'; A.musicLP.frequency.value = 2600; A.musicLP.connect(A.musicBus);
      // shared noise buffer
      const len = A.ctx.sampleRate * 2; const buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      A.noiseBuf = buf;
    } catch (e) { A.ctx = null; }
    A.applyMute();
  },
  resume() { if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); },
  applyMute() {
    if (A.master) A.master.gain.value = (A.muted || A.adMuted || !AP.save.sound) ? 0 : 0.6;
    if (A.musicBus) { const on = !A.muted && !A.adMuted && AP.save.music !== false; A.musicBus.gain.setTargetAtTime(on ? 0.32 : 0, A.now(), 0.25); if (on) A.startMusic(); }
  },
  // ---- generative lullaby: soft lo-fi pad + music-box plucks, never repeats exactly ----
  CHORDS: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], // Fmaj7 Em7 Dm7 Cmaj7
  SCALE: [72, 74, 76, 79, 81, 84, 86, 88],
  startMusic() {
    if (!A.ctx || A.musicTimer) return;
    A.beat = 0; A.nextT = A.now() + 0.1; const spb = 60 / 76 / 2; // eighth notes at 76 bpm
    A.musicTimer = setInterval(() => {
      if (!A.ctx || A.ctx.state !== 'running') return;
      while (A.nextT < A.now() + 0.25) {
        const bar = Math.floor(A.beat / 8) % 4, step = A.beat % 8, ch = A.CHORDS[bar];
        if (step === 0) ch.forEach((n, i) => A.mnote(n, A.nextT, spb * 8, 'triangle', 0.035 - i * 0.004, 0.6));
        if (step === 0 || step === 4) A.mnote(ch[0] - 12, A.nextT, spb * 3.5, 'sine', 0.06, 0.02);
        if (Math.random() < (step % 2 ? 0.28 : 0.55)) { const pool = A.SCALE.filter(n => ch.some(c => (n - c) % 12 === 0) || Math.random() < 0.35); A.mnote(AP.util.pick(pool.length ? pool : A.SCALE), A.nextT, 0.9, 'sine', 0.05, 0.003, true); }
        A.beat++; A.nextT += spb;
      }
    }, 90);
  },
  mnote(midi, t, dur, type, vol, att, bell) {
    const f = 440 * Math.pow(2, (midi - 69) / 12); const o = A.ctx.createOscillator(); const g = A.ctx.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(A.musicLP); o.start(t); o.stop(t + dur + 0.05);
    if (bell) { const o2 = A.ctx.createOscillator(); const g2 = A.ctx.createGain(); o2.type = 'sine'; o2.frequency.value = f * 3.01; g2.gain.setValueAtTime(0.0001, t); g2.gain.linearRampToValueAtTime(vol * 0.25, t + att); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.4); o2.connect(g2); g2.connect(A.musicLP); o2.start(t); o2.stop(t + dur); }
  },
  setAdMute(v) { A.adMuted = v; A.applyMute(); },
  ok() { return !!A.ctx && AP.save.sound && !A.adMuted; },
  now() { return A.ctx.currentTime; },
  env(gain, t, a, d, peak = 1) { gain.gain.setValueAtTime(0.0001, t); gain.gain.linearRampToValueAtTime(peak, t + a); gain.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  tone(freq, dur, type = 'sine', vol = 0.3, slide = 0) {
    if (!A.ok()) return; const t = A.now(); const o = A.ctx.createOscillator(); const g = A.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    A.env(g, t, 0.005, dur, vol); o.connect(g); g.connect(A.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur, vol = 0.2, filterFreq = 1200, type = 'lowpass', q = 1) {
    if (!A.ok()) return null; const t = A.now(); const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true;
    const f = A.ctx.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq; f.Q.value = q; const g = A.ctx.createGain();
    A.env(g, t, 0.01, dur, vol); s.connect(f); f.connect(g); g.connect(A.master); s.start(t); s.stop(t + dur + 0.05); return { s, f, g };
  },
  // --- named sounds ---
  click() { A.tone(880, 0.06, 'sine', 0.15, 300); },
  pop() { A.tone(520, 0.08, 'triangle', 0.25, 400); },
  select() { A.tone(660, 0.07, 'sine', 0.18); setTimeout(() => A.tone(990, 0.09, 'sine', 0.18), 60); },
  coin(i = 0) { A.tone(1200 + i * 120, 0.09, 'sine', 0.15, 600); },
  tick() { A.tone(1500, 0.02, 'square', 0.05); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => A.tone(f, 0.25, 'triangle', 0.2), i * 110)); },
  lose() { [392, 330, 262].forEach((f, i) => setTimeout(() => A.tone(f, 0.28, 'triangle', 0.18), i * 150)); },
  whoosh() { const n = A.noise(0.3, 0.12, 800); if (n) n.f.frequency.exponentialRampToValueAtTime(4000, A.now() + 0.3); },
  // an arrow leaves the board: rising zip, pitch climbs with the combo
  fly(i = 0) { A.tone(500 + Math.min(i, 12) * 60, 0.18, 'triangle', 0.16, 900); A.noise(0.12, 0.05, 2500, 'highpass'); },
  // an arrow hits another one: dull bonk
  bump() { A.tone(160, 0.16, 'square', 0.12, -60); A.noise(0.08, 0.12, 600); },
  heartLost() { A.tone(440, 0.12, 'sine', 0.16, -200); setTimeout(() => A.tone(300, 0.2, 'sine', 0.14, -120), 110); },
  sparkle() { [1568, 2093, 2637].forEach((f, i) => setTimeout(() => A.tone(f, 0.12, 'sine', 0.08), i * 50)); },
};
