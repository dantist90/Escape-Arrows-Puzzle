// =====================================================================================
//  Escape Arrows Puzzle — game & balance config
//  Every balance number lives here: rewards, prices, booster unlocks, tournament, ads.
//  Edit a value and reload (or rebuild for Poki) — no code changes needed.
//  Currencies: coins, tickets (tournament entry), stars (Room decor), arrows (Roadmap, earned in tournaments).
// =====================================================================================
window.AP = window.AP || {};
AP.CONFIG = {

  // ---------- test / temporary switches ----------
  debug: {
    unlockAll: false, // true = every mode / booster / section open from the start (testing only, never in a release)
  },

  // ---------- new player ----------
  start: { coins: 100, tickets: 1, stars: 0, arrows: 0 },

  // ---------- core level ----------
  level: {
    hearts: 3,               // mistakes allowed per level
    coins: { easy: 10, normal: 15, hard: 25, superhard: 40 }, // coins per completed level
    stars: [1, 2, 3],        // stars for finishing with 1 / 2 / 3+ hearts left
    ticketOnHard: 1,         // tickets for every hard / super-hard level
    ticketPerChapter: 2,     // tickets at the end of every chapter (10 levels)
    chapter: 10,             // levels per chapter
    continueCoins: 60,       // out of hearts: +1 heart for coins (or a rewarded ad)
    adFromLevel: 4,          // no interstitial before this level (FTUE stays ad-free)
  },

  // ---------- boosters (stage 3) ----------
  // unlock: level where the booster opens (with `gift` free uses and a short tip); price: coins per use
  boosters: {
    hint:   { unlock: 4, gift: 3, price: 50 },  // shows one free arrow
    shield: { unlock: 5, gift: 2, price: 60 },  // next mistake costs no heart
    wand:   { unlock: 6, gift: 2, price: 90 },  // removes any arrow
  },
  preBoosters: {
    heart:  { unlock: 7, gift: 2, price: 40 },  // start with +1 heart
    warmup: { unlock: 9, gift: 2, price: 60 },  // 3 free arrows fly away on start
    glow:   { unlock: 11, gift: 2, price: 50 }, // free arrows glow for the first 10 s
  },

  // ---------- tournament (stage 5) ----------
  tournament: {
    unlockLevel: 8, ticketCost: 1, levels: 5, bots: 19,
    arrowsByPlace: [60, 45, 35, 25, 20, 15, 12, 10, 8, 6], // Roadmap arrows for places 1..10, then `arrowsMin`
    arrowsMin: 4,
  },

  // ---------- rewarded ads ----------
  ads: { ticketAd: true, continueAd: true },
};
