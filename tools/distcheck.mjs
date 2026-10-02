// Poki build check: serve dist/ as is and make sure the game loads ONLY from it — zero 404s, zero external requests
// (except the Poki SDK), the lobby shows and a level opens — and that the zip equals dist/ byte for byte with "/" names.
// Run after: node tools/build.mjs --zip
//   node tools/distcheck.mjs
import path from 'node:path';
import fs from 'node:fs';
import { ROOT, startServer, openPage, waitReady, makeCheck, step, state, isPoki } from './_rig.mjs';
import { listZip, readZipEntry, crc32 } from './zip.mjs';

const PORT = 8999;
const DIST = path.join(ROOT, 'dist');
const check = makeCheck();
check('dist/ exists', fs.existsSync(path.join(DIST, 'index.html')));
const server = await startServer(PORT, DIST);
const { browser, page, errors, requests, failedReq } = await openPage({ width: 960, height: 640 });
try {
  await page.goto(`http://127.0.0.1:${PORT}/?qa=1&reset=1&fast=1&uilang=ru`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await waitReady(page); await step(page, 0.3);
  let st = await state(page);
  check('new player: level 1 from dist', st.scene === 'level' && st.board && st.board.n === 1, st.scene);
  check('ru strings in dist', st.lang === 'ru', st.lang);
  check('no cheat panel in the build', await page.evaluate(() => !AP.cheats));
  await page.evaluate(() => { AP.save.seen.coach_tap = 1; QA.goto('lobby'); }); await step(page, 0.3);
  check('lobby from dist', (await state(page)).scene === 'lobby');
  await page.evaluate(() => QA.tap('play')); await step(page, 1.5);
  check('level opens from the lobby', (await state(page)).scene === 'level');
  const foreign = requests.filter((u) => !u.startsWith(`http://127.0.0.1:${PORT}/`) && !u.startsWith('data:') && !u.startsWith('blob:') && !isPoki(u));
  check('no external requests', foreign.length === 0, foreign.slice(0, 5).join(' '));
  check('no failed requests (404)', failedReq.length === 0, failedReq.slice(0, 5).join(' '));
  const notFound = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.responseStatus >= 400).map((e) => e.name));
  check('no 4xx responses', notFound.length === 0, notFound.slice(0, 5).join(' '));
  check('console clean', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  check('exception', false, e.stack || e.message);
} finally { await browser.close(); server.kill(); }

// ── the archive that actually goes to Poki ──────────────────────────────────
try {
  const zips = fs.readdirSync(ROOT).filter((f) => /^EscapeArrows-\d{8}\.zip$/.test(f)).sort();
  if (zips.length) {
    const zip = path.join(ROOT, zips[zips.length - 1]);
    const entries = listZip(zip); const names = entries.map((e) => e.name);
    const walk = (d, base = d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, base, out); else out.push(path.relative(base, p).split(path.sep).join('/')); } return out; };
    const distFiles = walk(DIST).sort();
    const badNames = names.filter((n) => n.includes('\\') || n.startsWith('/') || n.includes('..'));
    check(`zip ${zips[zips.length - 1]}: entry names use "/"`, badNames.length === 0, badNames.slice(0, 3).join(' '));
    check('zip: index.html at the root', names.includes('index.html'));
    const missing = distFiles.filter((f) => !names.includes(f)), extra = names.filter((n) => !distFiles.includes(n));
    check('zip: same files as dist/', missing.length === 0 && extra.length === 0, `missing: ${missing.slice(0, 3).join(' ')} extra: ${extra.slice(0, 3).join(' ')}`);
    const mismatch = [];
    for (const e of entries) { const disk = fs.existsSync(path.join(DIST, e.name)) ? fs.readFileSync(path.join(DIST, e.name)) : null; const data = readZipEntry(zip, e);
      if (!disk || !disk.equals(data) || crc32(data) !== e.crc) mismatch.push(e.name); }
    check('zip: every entry equals dist/ byte for byte, CRC ok', mismatch.length === 0, mismatch.slice(0, 3).join(' '));
    console.log(`      archive ${(fs.statSync(zip).size / 1048576).toFixed(2)} MB, ${entries.length} files`);
  } else check('zip: EscapeArrows-*.zip found', false, 'no archive — run node tools/build.mjs --zip');
} catch (e) { check('zip: reading the archive', false, e.message); }
check.done();
