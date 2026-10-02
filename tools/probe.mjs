// Main QA rig: the game on 7 screen sizes + the stage-0 flow, judged by window.QA state (not pixels).
//
//   node tools/probe.mjs            all checks, screenshots into shots/
//   node tools/probe.mjs --dist     the same against dist/ (after node tools/build.mjs)
//
// Per size: boots as a new player, lobby is shown, every widget is inside the screen (safe area included),
// the two bottom buttons do not overlap, screenshot saved. Flow (one size): lobby -> Level 1 -> win -> lobby with
// level 2, the Poki events level/1/start + level/1/complete in that order, every sent event documented in EVENTS.md,
// settings opens and closes.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, startServer, openPage, waitReady, makeCheck, step, state } from './_rig.mjs';

const dist = process.argv.includes('--dist');
const PORT = 8998;
const SIZES = [[360, 640], [390, 844], [768, 1024], [1024, 768], [1280, 720], [1920, 1080], [844, 390]];

// EVENTS.md: every `cat / what / action` pattern in the first table column; <x> = any value, a|b = one of
const DOC = fs.readFileSync(path.join(ROOT, 'EVENTS.md'), 'utf8');
const esc = (t) => t.replace(/[.*+?^${}()[\]\\]/g, (c) => '\\' + c);
const toRe = (pat) => new RegExp('^' + pat.replace(/\\\|/g, '|').split(' / ')
  .map((seg) => '(?:' + seg.split('|').map((p) => esc(p).replace(/<[^>]+>/g, '[^ /]+')).join('|') + ')').join(' / ') + '$');
const PATTERNS = [...DOC.matchAll(/^\| `([^`]+ \/ [^`]+ \/ [^`]+)` \|/gm)].map((m) => toRe(m[1]));
const undocumented = (ev) => [...new Set(ev)].filter((e) => !PATTERNS.some((re) => re.test(e)));

const inside = (r, w, h) => r.x >= -1 && r.y >= -1 && r.x + r.w <= w + 1 && r.y + r.h <= h + 1;
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const check = makeCheck();
const server = await startServer(PORT, dist ? path.join(ROOT, 'dist') : ROOT);
const shots = path.join(ROOT, 'shots'); fs.mkdirSync(shots, { recursive: true });
const { browser, page, errors } = await openPage({ width: 390, height: 844 });
const url = `http://127.0.0.1:${PORT}/?qa=1&reset=1&fast=1`;
try {
  check('EVENTS.md parsed', PATTERNS.length >= 10, String(PATTERNS.length));
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitReady(page); await step(page, 0.5);
    const st = await state(page);
    const hits = await page.evaluate(() => QA.hits());
    const out = hits.filter((r) => r.id !== 'modal_block' && !inside(r, w, h));
    const play = hits.find((r) => r.id === 'play'), tour = hits.find((r) => r.id === 'tour');
    check(`${w}x${h}: lobby`, st.scene === 'lobby', st.scene);
    check(`${w}x${h}: widgets inside the screen`, out.length === 0, out.map((r) => r.id).join(' '));
    check(`${w}x${h}: Play / Tournament side by side, no overlap`, !!play && !!tour && !overlap(play, tour));
    await page.screenshot({ path: path.join(shots, `lobby_${w}x${h}.png`) });
  }
  // ----- flow -----
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitReady(page); await step(page, 0.3);
  check('tap Play', await page.evaluate(() => QA.tap('play')));
  await step(page, 1.5);
  let st = await state(page);
  check('level scene opened', st.scene === 'level', st.scene);
  await page.screenshot({ path: path.join(shots, 'level_390x844.png') });
  check('tap WIN stub', await page.evaluate(() => QA.tap('stub_win')));
  await step(page, 1.5);
  st = await state(page);
  check('back in the lobby, level 2', st.scene === 'lobby' && st.level === 2, `${st.scene} L${st.level}`);
  const ev = st.events; const iS = ev.indexOf('level / 1 / start'), iC = ev.indexOf('level / 1 / complete');
  check('events: level/1/start then level/1/complete', iS >= 0 && iC > iS, ev.join(' | '));
  check('events: no level/1/fail', !ev.includes('level / 1 / fail'));
  check('events: button/play/visible + interact', ev.includes('button / play / visible') && ev.includes('button / play / interact'));
  check('every sent event is documented in EVENTS.md', undocumented(ev).length === 0, undocumented(ev).join(' | '));
  check('SDK: loadingFinished, gameplay start/stop alternate', st.sdk[0] === 'loadingFinished' && !/start,start|stop,stop/.test(st.sdk.filter((x) => x === 'start' || x === 'stop').join(',')), st.sdk.join(','));
  check('tap gear -> settings', (await page.evaluate(() => QA.tap('bar_gear'))) && (await step(page, 0.1)).modal === 'settings');
  await page.screenshot({ path: path.join(shots, 'settings_390x844.png') });
  check('close settings', (await page.evaluate(() => QA.tap('set_close'))) && (await step(page, 0.1)).modal === null);
  check('console clean', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('exception', false, e.stack || e.message);
} finally { await browser.close(); server.kill(); }
check.done();
