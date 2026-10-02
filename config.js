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
    freeTicketOnUnlock: 1,   // gift when the tournament opens (the coach tip points at it)
    arrowsByPlace: [60, 45, 35, 25, 20, 15, 12, 10, 8, 6], // Roadmap arrows for places 1..10, then `arrowsMin`
    arrowsMin: 4,
    coinsTop3: [150, 100, 60],
    // score of one tournament level: arrows cleared x arrowPoint + hearts left x heartPoints + max(0, timeBonus - seconds x timePenalty)
    arrowPoint: 10, heartPoints: 50, timeBonus: 200, timePenalty: 2,
    botSkill: [0.6, 1.45], // AI players: share of the "typical" level score they make (random per bot, +-15% per level)
  },

  // ---------- Roadmap (stage 5): milestones paid in arrows (earned in tournaments) ----------
  // `at` = total arrows needed; past the list, milestones repeat every `repeatEvery` arrows with `repeatReward`
  roadmap: {
    steps: [
      { at: 20, reward: { coins: 100 } },
      { at: 50, reward: { boosters: { hint: 2 } } },
      { at: 90, reward: { tickets: 2 } },
      { at: 140, reward: { coins: 200 } },
      { at: 200, reward: { boosters: { shield: 2, wand: 1 } } },
      { at: 270, reward: { tickets: 3 } },
      { at: 350, reward: { coins: 300 } },
      { at: 440, reward: { boosters: { heart: 2, glow: 2 } } },
      { at: 540, reward: { tickets: 3, coins: 200 } },
      { at: 650, reward: { boosters: { wand: 3 } } },
    ],
    repeatEvery: 120, repeatReward: { coins: 250, tickets: 1 },
  },

  // ---------- rewarded ads ----------
  ads: { ticketAd: true, continueAd: true },
};
