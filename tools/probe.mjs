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
const url = `http://127.0.0.1:${PORT}/?qa=1&reset=1&fast=1&nosdk=1`;
// the local ad shim resolves on a real timer: wait for it (stepping game time does not advance it)
const adWait = () => page.waitForFunction(() => !AP.poki.adRunning, { timeout: 8000, polling: 100 }).catch(() => {});
try {
  check('EVENTS.md parsed', PATTERNS.length >= 10, String(PATTERNS.length));
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitReady(page); await step(page, 0.2);
    // a new player starts in level 1; the lobby layout is checked on its own
    await page.evaluate(() => { AP.save.seen.coach_tap = 1; QA.goto('lobby'); }); await step(page, 0.3);
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
  const solved = await page.evaluate(() => QA.solveAll());
  const bad = solved.filter((r) => r.errs.length || !r.order);
  check(`all ${solved.length} levels valid and solvable`, bad.length === 0, bad.map((r) => `L${r.n}: ${r.errs.join(',') || 'stuck'}`).join(' | '));
  let st = await step(page, 0.6);
  check('new player starts in level 1, coach tip "tap" shown', st.scene === 'level' && st.board && st.board.n === 1 && st.coach === 'tap', `${st.scene} coach ${st.coach}`);
  await page.screenshot({ path: path.join(shots, 'level1_390x844.png') });
  // clear the board by tapping free arrows where they are drawn
  const clear = async () => { for (let i = 0; i < 200; i++) { const b = (await state(page)).board; if (!b || b.left === 0) break; const f = b.arrows.find((a) => a.free);
    if (f) await page.evaluate((p) => QA.tapAt(p[0], p[1]), f.at); await step(page, 0.4); } await step(page, 1.5); return state(page); };
  st = await clear();
  check('level 1 cleared by taps -> win window', st.modal === 'win' && st.board.left === 0, `${st.modal} left ${st.board && st.board.left}`);
  await page.screenshot({ path: path.join(shots, 'win_390x844.png') });
  check('win: 3 stars, coins, level 2 next', st.level === 2 && st.stars === 3 && st.coins > 100, `L${st.level} stars ${st.stars} coins ${st.coins}`);
  await page.evaluate(() => QA.tap('win_lobby')); await step(page, 1.5);
  st = await state(page);
  check('back in the lobby', st.scene === 'lobby', st.scene);
  let ev = st.events; const iS = ev.indexOf('level / 1 / start'), iC = ev.indexOf('level / 1 / complete');
  check('events: level/1/start then level/1/complete', iS >= 0 && iC > iS, ev.join(' | '));
  check('events: no level/1/fail', !ev.includes('level / 1 / fail'));
  check('events: button/play/visible in the lobby', ev.includes('button / play / visible'));
  check('FTUE: tutorial/step-tap start then complete', ev.indexOf('tutorial / step-tap / start') >= 0 && ev.indexOf('tutorial / step-tap / complete') > ev.indexOf('tutorial / step-tap / start'));
  // level 2: tap the blocked arrow 3 times -> out of hearts -> continue for an ad -> finish
  await page.evaluate(() => QA.tap('play')); await step(page, 1.5);
  for (let i = 0; i < 3; i++) { const b = (await state(page)).board; const blk = b.arrows.find((a) => !a.free); if (blk) await page.evaluate((p) => QA.tapAt(p[0], p[1]), blk.at); await step(page, 0.6); }
  st = await state(page);
  check('bumps cost hearts, 0 hearts -> fail window', st.board.hearts === 0 && st.modal === 'fail', `hearts ${st.board.hearts} modal ${st.modal}`);
  await page.screenshot({ path: path.join(shots, 'fail_390x844.png') });
  await page.evaluate(() => QA.tap('fail_ad'));
  await page.waitForFunction(() => !AP.poki.adRunning, { timeout: 8000, polling: 100 }).catch(() => {}); await step(page, 0.2);
  st = await state(page);
  check('continue for an ad -> 1 heart, playing again', st.board.hearts === 1 && !st.modal, `hearts ${st.board.hearts} modal ${st.modal}`);
  st = await clear();
  check('level 2 won after continue', st.modal === 'win' && st.level === 3, `${st.modal} L${st.level}`);
  check('FTUE: order tip completed, hearts tip shown on level 2', st.events.includes('tutorial / step-order / complete') && st.events.includes('tutorial / step-hearts / start'), st.events.filter((e) => e.startsWith('tutorial')).join(' | '));
  ev = st.events;
  check('events: level/2 start + complete, no fail', ev.includes('level / 2 / start') && ev.includes('level / 2 / complete') && !ev.includes('level / 2 / fail'));
  check('events: rewarded/continue visible + interact', ev.includes('rewarded / continue / visible') && ev.includes('rewarded / continue / interact'));
  // Next -> level 3, then quit: counts as level/3/fail
  await page.evaluate(() => QA.tap('win_next')); await step(page, 1.5);
  st = await state(page);
  check('Next opens level 3', st.scene === 'level' && st.board.n === 3, `${st.scene} ${st.board && st.board.n}`);
  await page.evaluate(() => QA.tap('bar_back')); await step(page, 1.5);
  st = await state(page); ev = st.events;
  check('quit level 3 -> lobby, level/3/fail sent once', st.scene === 'lobby' && ev.filter((e) => e === 'level / 3 / fail').length === 1, st.scene);
  // the biggest hand level on a small phone and on PC
  for (const [w, h] of [[360, 640], [1280, 720]]) {
    await page.setViewport({ width: w, height: h }); await page.evaluate(() => { window.dispatchEvent(new Event('resize')); QA.goto('level', { n: 5 }); }); await step(page, 0.3);
    const b = (await state(page)).board; const hits = await page.evaluate(() => QA.hits());
    const offA = b.arrows.filter((a) => !(a.at[0] > 0 && a.at[1] > 0 && a.at[0] < w && a.at[1] < h)), offH = hits.filter((r) => r.id !== 'modal_block' && !inside(r, w, h));
    check(`${w}x${h}: level 5 arrows and widgets on screen`, !offA.length && !offH.length, offA.map((a) => a.id).concat(offH.map((r) => r.id)).join(' '));
    await page.screenshot({ path: path.join(shots, `level5_${w}x${h}.png`) });
  }
  // ----- stage 3: start window with pre-level boosters, in-level boosters, buy window, x2 reward -----
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => { AP.save.level = 12; AP.save.coins = 500; QA.goto('lobby'); }); await step(page, 0.3);
  await page.evaluate(() => QA.tap('play')); await step(page, 0.2);
  st = await state(page);
  check('level 12: Play opens the start window', st.modal === 'start', st.modal);
  await page.screenshot({ path: path.join(shots, 'start_390x844.png') });
  const gifted = await page.evaluate(() => ({ ...AP.save.boosters }));
  check('boosters opened by level 12 were gifted', ['hint', 'shield', 'wand', 'heart', 'warmup', 'glow'].every((id) => gifted[id] > 0), JSON.stringify(gifted));
  await page.evaluate(() => QA.tap('bst_heart')); await step(page, 0.1);
  await page.evaluate(() => QA.tap('start_go')); await step(page, 0.5); await adWait(); await step(page, 1.5);
  st = await state(page);
  check('start with the extra-heart pre-booster: 4 hearts', st.scene === 'level' && st.board.n === 12 && st.board.hearts === 4 && st.board.maxHearts === 4, `${st.scene} hearts ${st.board && st.board.hearts}`);
  check('event prebooster/heart/select, stock -1', st.events.includes('prebooster / heart / select') && st.board.boosters.heart === gifted.heart - 1);
  await page.evaluate(() => QA.tap('bst_hint')); await step(page, 0.1);
  st = await state(page); const hinted = st.board.arrows.find((a) => a.id === st.board.hint);
  check('hint marks a free arrow', !!hinted && hinted.free && st.events.includes('booster / hint / use'), String(st.board.hint));
  await page.evaluate(() => QA.tap('bst_shield')); await step(page, 0.1);
  let blk = (await state(page)).board.arrows.find((a) => !a.free);
  await page.evaluate((p) => QA.tapAt(p[0], p[1]), blk.at); await step(page, 0.8);
  st = await state(page);
  check('shield absorbs one bump', st.board.hearts === 4 && !st.board.shield && st.events.includes('booster / shield / use'), `hearts ${st.board.hearts} shield ${st.board.shield}`);
  const left0 = st.board.left; blk = st.board.arrows.find((a) => !a.free);
  await page.evaluate(() => QA.tap('bst_wand')); await step(page, 0.1);
  await page.screenshot({ path: path.join(shots, 'wand_390x844.png') });
  await page.evaluate((p) => QA.tapAt(p[0], p[1]), blk.at); await step(page, 0.6);
  st = await state(page);
  check('wand removes a blocked arrow', st.board.left === left0 - 1 && !st.board.wand && st.events.includes('booster / wand / use'), `left ${left0} -> ${st.board.left}`);
  await page.evaluate(() => { AP.save.boosters.hint = 0; }); await step(page, 0.1);
  await page.evaluate(() => QA.tap('bst_hint')); await step(page, 0.1);
  st = await state(page);
  check('empty booster opens the buy window', st.modal === 'buy', st.modal);
  await page.screenshot({ path: path.join(shots, 'buy_390x844.png') });
  const c0 = st.coins; await page.evaluate(() => QA.tap('buy_coins')); await step(page, 0.1);
  st = await state(page);
  check('buy for coins: +1 hint, coins spent', st.board.boosters.hint === 1 && st.coins === c0 - 50 && !st.modal, `hint ${st.board.boosters.hint} coins ${c0} -> ${st.coins}`);
  await page.evaluate(() => { AP.save.boosters.hint = 0; }); await page.evaluate(() => QA.tap('bst_hint')); await step(page, 0.1);
  await page.evaluate(() => QA.tap('buy_ad')); await page.waitForFunction(() => !AP.poki.adRunning, { timeout: 8000, polling: 100 }).catch(() => {}); await step(page, 0.1);
  st = await state(page);
  check('buy for an ad: +1 hint', st.board.boosters.hint === 1 && st.events.includes('rewarded / booster / interact'), String(st.board.boosters.hint));
  st = await clear();
  check('level 12 won', st.modal === 'win', st.modal);
  const cw = st.coins; await page.evaluate(() => QA.tap('win_double')); await page.waitForFunction(() => !AP.poki.adRunning, { timeout: 8000, polling: 100 }).catch(() => {}); await step(page, 0.1);
  st = await state(page);
  check('x2 coins for an ad on the win window', st.coins === cw + 15 && st.events.includes('rewarded / double / interact'), `${cw} -> ${st.coins}`);
  await page.screenshot({ path: path.join(shots, 'win_double_390x844.png') });
  for (const [w, h] of [[360, 640], [1280, 720], [844, 390]]) {
    await page.setViewport({ width: w, height: h }); await page.evaluate(() => { window.dispatchEvent(new Event('resize')); AP.game.modal = { type: 'start', n: 12 }; }); await step(page, 0.1);
    let hits = await page.evaluate(() => QA.hits());
    check(`${w}x${h}: start window fits`, hits.every((r) => r.id === 'modal_block' || inside(r, w, h)), hits.filter((r) => !inside(r, w, h)).map((r) => r.id).join(' '));
    await page.screenshot({ path: path.join(shots, `start_${w}x${h}.png`) });
    await page.evaluate(() => { AP.game.modal = { type: 'win', stars: 2, rew: { coins: 15, stars: 2 }, t: 1 }; }); await step(page, 0.1);
    hits = await page.evaluate(() => QA.hits());
    check(`${w}x${h}: win window fits`, hits.every((r) => r.id === 'modal_block' || inside(r, w, h)), hits.filter((r) => !inside(r, w, h)).map((r) => r.id).join(' '));
    await page.screenshot({ path: path.join(shots, `win_${w}x${h}.png`) });
    await page.evaluate(() => { AP.game.modal = null; QA.goto('level', { n: 12 }); }); await step(page, 0.2);
    hits = await page.evaluate(() => QA.hits());
    const bar = ['bst_hint', 'bst_shield', 'bst_wand'].map((id) => hits.find((r) => r.id === id));
    check(`${w}x${h}: booster bar on screen, no overlaps`, bar.every((r) => r && inside(r, w, h)) && !overlap(bar[0], bar[1]) && !overlap(bar[1], bar[2]));
    await page.screenshot({ path: path.join(shots, `level12_${w}x${h}.png`) });
  }
  // ----- stage 5: tournament (free ticket on unlock, 5 levels vs 19 AI, results, Roadmap) -----
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => { AP.game.modal = null; AP.save.level = 8; AP.save.tickets = 0; AP.save.arrows = 0; AP.save.roadmap = 0; AP.save.seen.coach_tour = 0; AP.save.seen.tour_gift = 0; QA.goto('lobby'); }); await step(page, 0.6);
  st = await state(page);
  check('tournament opens at level 8: free ticket + coach tip on the button', st.tickets === 1 && st.coach === 'tour', `tickets ${st.tickets} coach ${st.coach}`);
  await page.screenshot({ path: path.join(shots, 'lobby_tour_390x844.png') });
  await page.evaluate(() => QA.tap('tour')); await step(page, 0.5); await page.evaluate(() => QA.tap('tour')); await step(page, 1.5);
  st = await state(page);
  check('Tournament screen opens', st.scene === 'tour' && !st.tour, st.scene);
  await page.screenshot({ path: path.join(shots, 'tour_info_390x844.png') });
  await page.evaluate(() => QA.tap('tour_join')); await step(page, 0.2);
  st = await state(page);
  check('join for a ticket: run 1 starts, 20 players', st.tour && st.tour.n === 1 && st.tickets === 0 && st.events.includes('tournament / run-1 / start') && (await page.evaluate(() => AP.tour.table().length)) === 20, JSON.stringify(st.tour));
  for (let k = 0; k < 5; k++) {
    await page.evaluate(() => QA.tap('tour_play')); await step(page, 0.5); await adWait(); await step(page, 1.5);
    st = await state(page);
    if (k === 0) { check('tournament level opens with its own funnel', st.scene === 'level' && st.events.includes('tournament / level-1 / start') && !st.events.some((e) => /^level \/ 8 \//.test(e)), st.scene); await page.screenshot({ path: path.join(shots, 'tour_level_390x844.png') }); }
    st = await clear();
    if (st.modal !== 'tourLevel') { check(`tournament level ${k + 1} -> points window`, false, st.modal); break; }
    await page.evaluate(() => QA.tap('tour_cont')); await step(page, 1.5);
    if (k === 1) { await page.screenshot({ path: path.join(shots, 'tour_table_390x844.png') }); check('table after 2 levels: player has points, place 1..20', (await state(page)).tour.score > 0 && (await state(page)).tour.place >= 1); }
  }
  st = await state(page);
  check('after 5 levels: results window, run complete', st.scene === 'tour' && st.modal === 'tourEnd' && !st.tour && st.events.includes('tournament / run-1 / complete') && [1, 2, 3, 4, 5].every((k) => st.events.includes(`tournament / level-${k} / complete`)), `${st.scene} ${st.modal}`);
  await page.screenshot({ path: path.join(shots, 'tour_end_390x844.png') });
  check('arrows for the Roadmap granted', st.arrows > 0, String(st.arrows));
  await page.evaluate(() => QA.tap('tour_end_ok')); await step(page, 0.2);
  st = await state(page);
  check('Roadmap milestone claimed when reached (reward window)', st.arrows < 20 || (st.roadmap >= 1 && st.modal === 'reward' && st.events.includes('roadmap / milestone-1 / unlocked')), `arrows ${st.arrows} roadmap ${st.roadmap} modal ${st.modal}`);
  await page.screenshot({ path: path.join(shots, 'roadmap_reward_390x844.png') });
  await page.evaluate(() => { AP.game.modal = { type: 'roadmap' }; }); await step(page, 0.1);
  await page.screenshot({ path: path.join(shots, 'roadmap_390x844.png') });
  for (const [w, h] of [[360, 640], [844, 390]]) {
    await page.setViewport({ width: w, height: h }); await page.evaluate(() => { window.dispatchEvent(new Event('resize')); AP.game.modal = { type: 'roadmap' }; }); await step(page, 0.1);
    const hits = await page.evaluate(() => QA.hits());
    check(`${w}x${h}: roadmap window fits`, hits.every((r) => r.id === 'modal_block' || inside(r, w, h)), hits.filter((r) => !inside(r, w, h)).map((r) => r.id).join(' '));
  }
  await page.evaluate(() => { AP.game.modal = null; }); await page.setViewport({ width: 390, height: 844 }); await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  // ----- stage 6: Room, Album replay, Skins, Daily tasks -----
  await page.evaluate(() => { AP.game.modal = null; AP.save.level = 30; AP.save.stars = 60; AP.save.coins = 2000; AP.save.room = { k: 0, steps: 0 }; AP.save.seen.coach_roadmap = 1; QA.goto('lobby'); }); await step(page, 0.3);
  await page.evaluate(() => QA.tap('side_room')); await step(page, 1.5);
  check('Room opens from the lobby', (await state(page)).scene === 'room');
  await page.screenshot({ path: path.join(shots, 'room0_390x844.png') });
  for (let i = 0; i < 8; i++) { await page.evaluate(() => QA.tap('room_buy')); await step(page, 0.6); }
  st = await state(page);
  check('8 decor pieces bought with stars -> room chest', st.modal === 'reward' && st.stars === 60 - 52 && [1, 8].every((k) => st.events.includes(`room / step-${k} / unlocked`)), `modal ${st.modal} stars ${st.stars}`);
  await page.evaluate(() => QA.tap('rew_ok')); await step(page, 0.2);
  await page.screenshot({ path: path.join(shots, 'room_done_390x844.png') });
  await page.evaluate(() => QA.tap('room_next')); await step(page, 0.2);
  check('next room opens', await page.evaluate(() => AP.save.room.k === 1 && AP.save.room.steps === 0));
  await page.evaluate(() => { AP.save.room.steps = 5; }); await step(page, 0.2);
  await page.screenshot({ path: path.join(shots, 'room1_390x844.png') });
  await page.evaluate(() => QA.goto('album')); await step(page, 0.3);
  await page.screenshot({ path: path.join(shots, 'album_390x844.png') });
  check('Album lists beaten levels', await page.evaluate(() => QA.hits().some((h) => h.id === 'alb_29')));
  await page.evaluate(() => QA.tap('alb_29')); await step(page, 0.2);
  if ((await state(page)).modal === 'start') { await page.evaluate(() => QA.tap('start_go')); }
  await step(page, 0.5); await adWait(); await step(page, 1.5);
  st = await state(page);
  check('Album replay opens level 29 with the replay funnel', st.scene === 'level' && st.board.n === 29 && st.events.includes('replay / 29 / start') && !st.events.includes('level / 29 / start'), `${st.scene} ${st.board && st.board.n}`);
  st = await clear();
  check('replay won: progress stays at 30, replay/29/complete', st.modal === 'win' && st.level === 30 && st.events.includes('replay / 29 / complete'), `L${st.level}`);
  await page.evaluate(() => { AP.game.modal = null; QA.goto('skins'); }); await step(page, 0.3);
  const c1 = (await state(page)).coins; await page.evaluate(() => QA.tap('sk_candy')); await step(page, 0.2);
  st = await state(page);
  check('buy + equip the Candy arrows', st.coins === c1 - 300 && (await page.evaluate(() => AP.save.skin === 'candy' && AP.art.TUBE[0] === AP.skins.PAL.candy[0])) && st.events.includes('cosmetic / candy / unlocked') && st.events.includes('cosmetic / candy / equip'));
  await page.screenshot({ path: path.join(shots, 'skins_390x844.png') });
  await page.evaluate(() => QA.tap('sk_tab_bg')); await step(page, 0.1); await page.evaluate(() => QA.tap('sk_midnight')); await step(page, 0.2);
  check('buy + equip the Midnight background', await page.evaluate(() => AP.save.bg === 'midnight' && AP.art.BG_TOP === AP.skins.BGS.midnight[0]));
  await page.evaluate(() => { AP.save.skin = 'neon'; AP.save.bg = 'violet'; AP.skins.apply(); QA.goto('lobby'); }); await step(page, 0.3);
  await page.evaluate(() => { const d = AP.tasks.get(); d.tasks[0].prog = d.tasks[0].goal; }); await step(page, 0.1);
  await page.evaluate(() => QA.tap('side_tasks')); await step(page, 0.2);
  check('Daily tasks window', (await state(page)).modal === 'tasks');
  await page.screenshot({ path: path.join(shots, 'tasks_390x844.png') });
  await page.evaluate(() => QA.tap('task_0')); await step(page, 0.2);
  st = await state(page);
  check('claim a finished task -> reward -> back to tasks', st.modal === 'reward' && st.events.some((e) => /^daily \/ task-/.test(e)), st.modal);
  await page.evaluate(() => QA.tap('rew_ok')); await step(page, 0.1);
  check('reward window returns to the tasks window', (await state(page)).modal === 'tasks');
  for (const [w, h] of [[360, 640], [1280, 720], [844, 390]]) {
    await page.setViewport({ width: w, height: h }); await page.evaluate(() => window.dispatchEvent(new Event('resize'))); await step(page, 0.1);
    let hits = await page.evaluate(() => QA.hits());
    check(`${w}x${h}: tasks window fits`, hits.every((r) => r.id === 'modal_block' || inside(r, w, h)), hits.filter((r) => !inside(r, w, h)).map((r) => r.id).join(' '));
    for (const sc of ['room', 'skins', 'album']) { await page.evaluate((sc) => { AP.game.modal = null; QA.goto(sc); }, sc); await step(page, 0.2);
      hits = await page.evaluate(() => QA.hits()); const bad = hits.filter((r) => !inside(r, w, h));
      check(`${w}x${h}: ${sc} screen fits`, bad.length === 0, bad.map((r) => r.id).join(' ')); await page.screenshot({ path: path.join(shots, `${sc}_${w}x${h}.png`) }); }
    await page.evaluate(() => { AP.game.modal = { type: 'tasks' }; }); await step(page, 0.1);
  }
  await page.evaluate(() => { AP.game.modal = null; }); await page.setViewport({ width: 390, height: 844 }); await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  // generated levels: endless ones after the baked list are solvable; the biggest baked level draws fast and zooms
  const gen = await page.evaluate(() => { const out = []; for (let n = AP.LEVELS.length + 1; n <= AP.LEVELS.length + 12; n++) { const lv = AP.levelData(n); out.push({ n, ok: !!lv && !AP.board.validate(lv).length && !!AP.board.solve(lv) }); } return out; });
  check('endless levels (after the baked ones) valid and solvable', gen.every((g) => g.ok), gen.filter((g) => !g.ok).map((g) => g.n).join(' '));
  await page.setViewport({ width: 390, height: 844 });
  await page.evaluate(() => QA.goto('level', { n: AP.LEVELS.length })); await step(page, 0.3);
  const ms = await page.evaluate(() => { const t0 = performance.now(); QA.step(1); return (performance.now() - t0) / 60; });
  check(`level ${solved.length}: frame time under 12 ms (headless, software canvas)`, ms < 12, ms.toFixed(2) + ' ms');
  const z0 = (await state(page)).board.zoom;
  check('big level is zoomable, zoom-in button works', (await page.evaluate(() => QA.tap('zoom_in'))) && (await step(page, 0.1)).board.zoom > z0 * 1.3, String(z0));
  await page.screenshot({ path: path.join(shots, `level${solved.length}_zoomed_390x844.png`) });
  await page.evaluate(() => QA.goto('lobby')); await step(page, 0.3);
  st = await state(page); ev = st.events;
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
