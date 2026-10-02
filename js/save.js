// ---------- Persistent progress (localStorage) ----------
// Everything the player owns lives in AP.save. New fields: add a default here, old saves pick it up through Object.assign.
AP.SAVE_KEY = 'escape-arrows-v1';
AP.SAVE_DEFAULTS = () => ({
  ...AP.CONFIG.start,
  level: 1,            // next level to play in the Levels mode
  best: {},            // level number -> best stars (1..3); the Album lists these
  boosters: {},        // id -> owned uses (in-level and pre-level boosters)
  seen: {},            // FTUE / coach tips already shown
  tournament: null,    // current run (stage 5)
  roadmap: 0,          // Roadmap milestones claimed
  room: {},            // Room decor steps bought (stage 6)
  skin: 'neon', bg: 'violet', owned: { neon: 1, violet: 1 },
  daily: null,         // daily tasks (stage 6)
  stats: {},           // counters for tasks and analytics
  lang: null, sound: true, music: true,
});
AP.save = AP.SAVE_DEFAULTS();
AP.load = function () {
  try {
    if (/[?&]reset=1/.test(location.search)) localStorage.removeItem(AP.SAVE_KEY); // QA: start as a brand-new player
    const raw = localStorage.getItem(AP.SAVE_KEY);
    if (raw) Object.assign(AP.save, JSON.parse(raw));
  } catch (e) { /* storage unavailable (private mode etc.) — play without saving */ }
  const q = /[?&]uilang=([a-z]{2})/.exec(location.search);
  if (q && AP.LANGS.some(l => l[0] === q[1])) AP.lang = q[1];
  else if (AP.save.lang) AP.lang = AP.save.lang;
  else { const nav = (navigator.language || 'en').toLowerCase().slice(0, 2); AP.lang = AP.LANGS.some(l => l[0] === nav) ? nav : 'en'; }
};
AP.persist = function () {
  AP.save.lang = AP.lang;
  try { localStorage.setItem(AP.SAVE_KEY, JSON.stringify(AP.save)); } catch (e) { /* ignore */ }
};
