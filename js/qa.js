// ---------- QA switches (URL params) ----------
// ?qa=1 exposes window.QA for the headless rigs (tools/*.mjs); ?fast=1 skips the minimum loader / ad placeholder waits;
// ?nosdk=1 ignores the real Poki SDK and uses the local shim (its ads never finish on localhost); ?reset=1 starts as a brand-new player; ?uilang=ru forces a language; ?evlog=1 prints every Poki event to the console.
AP.QA = {
  on: /[?&]qa=1/.test(location.search),
  fast: /[?&]fast=1/.test(location.search),
  noSdk: /[?&]nosdk=1/.test(location.search),
  cut: /[?&]qa=1/.test(location.search) ? new Set() : null, // strings that had to be cut with an ellipsis (AP.util.fit)
};
