// ---------- Economy: currencies and rewards ----------
// Currencies live in AP.save: coins, tickets, stars, arrows. Costs are {type, n}; rewards are {coins: 20, tickets: 1, ...}.
const M = AP.meta = {
  TYPES: ['coins', 'tickets', 'stars', 'arrows'],
  get(type) { return AP.save[type] || 0; },
  add(type, n) { AP.save[type] = Math.max(0, M.get(type) + n); AP.persist(); },
  can(cost) { return !cost || M.get(cost.type) >= cost.n; },
  // spends and returns true, or shows a toast and returns false
  spend(cost) { if (!M.can(cost)) { AP.ui.toast(AP.t('not_enough')); AP.audio.bump(); return false; } M.add(cost.type, -cost.n); AP.audio.coin(); return true; },
  // adds every currency of a reward object; the reward popup comes with stage 3
  grant(rew) { for (const k in rew) if (M.TYPES.includes(k)) AP.save[k] = M.get(k) + rew[k]; AP.persist(); AP.audio.sparkle(); },
  // booster stock (in-level and pre-level boosters share AP.save.boosters)
  boosters(id) { return (AP.save.boosters || {})[id] || 0; },
  addBooster(id, n) { const b = AP.save.boosters || (AP.save.boosters = {}); b[id] = Math.max(0, (b[id] || 0) + n); AP.persist(); },
};
AP.addStrings({ en: { not_enough: 'Not enough!' }, ru: { not_enough: 'Не хватает!' }, es: { not_enough: '¡No alcanza!' }, de: { not_enough: 'Nicht genug!' }, fr: { not_enough: 'Pas assez !' },
  pt: { not_enough: 'Não é suficiente!' }, tr: { not_enough: 'Yetersiz!' }, pl: { not_enough: 'Za mało!' }, it: { not_enough: 'Non basta!' } });
