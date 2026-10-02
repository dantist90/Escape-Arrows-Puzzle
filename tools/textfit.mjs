// Text fit rig: every language on a small phone and a landscape phone, every screen and window;
// lists the strings that AP.util.fit had to cut with an ellipsis (AP.QA.cut). Also checks every EN key is translated.
//
//   node tools/textfit.mjs
import { startServer, openPage, waitReady, makeCheck, step } from './_rig.mjs';

const PORT = 8996;
const SIZES = [[360, 640], [844, 390]];
const check = makeCheck();
const server = await startServer(PORT);
const { browser, page, errors } = await openPage({ width: 360, height: 640 });
// scenes and windows to visit (run in the page): [name, setup]
const VIEWS = [
  ['lobby', () => { AP.game.modal = null; QA.goto('lobby'); }],
  ['level', () => { QA.goto('level', { n: 12 }); }],
  ['start', () => { QA.goto('lobby'); AP.game.modal = { type: 'start', n: 12 }; }],
  ['win', () => { QA.goto('level', { n: 12 }); AP.game.modal = { type: 'win', stars: 2, rew: { coins: 15, stars: 2, tickets: 1 }, t: 2 }; }],
  ['fail', () => { QA.goto('level', { n: 12 }); AP.game.modal = { type: 'fail' }; }],
  ['buy', () => { QA.goto('level', { n: 12 }); AP.game.modal = { type: 'buy', id: 'shield' }; }],
  ['settings', () => { QA.goto('lobby'); AP.game.modal = { type: 'settings' }; }],
  ['tour', () => { AP.save.tournament = null; QA.goto('tour'); }],
  ['tourEnd', () => { QA.goto('tour'); AP.game.modal = { type: 'tourEnd', place: 2, rew: { arrows: 45, coins: 100 }, t: 1 }; }],
  ['roadmap', () => { QA.goto('lobby'); AP.game.modal = { type: 'roadmap' }; }],
  ['tasks', () => { QA.goto('lobby'); AP.game.modal = { type: 'tasks' }; }],
  ['room', () => { AP.game.modal = null; QA.goto('room'); }],
  ['skins', () => { QA.goto('skins'); }],
  ['album', () => { QA.goto('album'); }],
];
try {
  await page.goto(`http://127.0.0.1:${PORT}/?qa=1&reset=1&fast=1&nosdk=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitReady(page);
  const miss = await page.evaluate(() => { const en = Object.keys(AP.STR.en); const out = []; AP.LANGS.forEach(([l]) => en.forEach((k) => { if (AP.STR[l][k] === undefined) out.push(l + ':' + k); })); return out; });
  check('every EN string is translated into all 9 languages', miss.length === 0, miss.slice(0, 8).join(' '));
  await page.evaluate(() => { AP.save.level = 30; AP.save.seen = { coach_tap: 1 }; Object.keys(AP.save.seen); AP.coach.cur = null; AP.coach.TIPS.forEach((t) => { AP.save.seen['coach_' + t.id] = 1; }); });
  const langs = await page.evaluate(() => AP.LANGS.map((l) => l[0]));
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h }); await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    for (const lang of langs) {
      const cut = new Set();
      for (const [name, fn] of VIEWS) {
        await page.evaluate((lang, src) => { AP.lang = lang; AP.QA.cut.clear(); (0, eval)('(' + src + ')')(); }, lang, fn.toString());
        await step(page, 0.15);
        (await page.evaluate(() => [...AP.QA.cut])).forEach((s) => cut.add(`${name}: "${s}"`));
      }
      check(`${w}x${h} ${lang}: no text cut`, cut.size === 0, [...cut].slice(0, 6).join(' | '));
    }
  }
  check('console clean', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) { check('exception', false, e.stack || e.message); } finally { await browser.close(); server.kill(); }
check.done();
