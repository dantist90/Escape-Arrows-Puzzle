// Poki build: dist/ holds exactly what the game loads, optionally zipped.
//
//   node tools/build.mjs            build into dist/
//   node tools/build.mjs --zip      build and pack EscapeArrows-YYYYMMDD.zip (index.html at the archive root)
//   node tools/build.mjs --cheats   keep the F2 cheat panel (scripts marked data-dev are dropped otherwise)
//   node tools/build.mjs --no-bump  do not bump js/version.js (used by the rigs)
//
// DESTRUCTIVE: starts by deleting dist/ and today's zip.
//
// Scripts come from the BUILD:SCRIPTS block of index.html, in order, and are joined into dist/js/game.js
// (one request instead of ~20). Level data ships as a script too (levels/levels.js in the block), so the standalone
// file:// build works without fetch. css/style.css and assets/** are copied as is.
// Checks before zipping: every listed file exists, no external URL except the Poki SDK, the zip names use "/".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeZip, listZip } from './zip.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DIST = path.join(ROOT, 'dist');
const args = process.argv.slice(2);
const wantZip = args.includes('--zip'), cheats = args.includes('--cheats'), bump = !args.includes('--no-bump');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const mb = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';
const fail = (msg) => { console.error('FAIL  ' + msg); process.exit(1); };

// ── version ─────────────────────────────────────────────────────────────────
const vFile = path.join(ROOT, 'js', 'version.js');
let vSrc = fs.readFileSync(vFile, 'utf8');
if (bump) {
  vSrc = vSrc.replace(/AP\.VERSION = '(\d+)\.(\d+)\.(\d+)'/, (m, a, b, c) => `AP.VERSION = '${a}.${b}.${+c + 1}'`);
  fs.writeFileSync(vFile, vSrc);
}
const version = (/AP\.VERSION = '([^']+)'/.exec(vSrc) || [])[1];
console.log('version ' + version);

// ── scripts from index.html ─────────────────────────────────────────────────
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const block = /<!-- BUILD:SCRIPTS[^>]*-->([\s\S]*?)<!-- \/BUILD:SCRIPTS -->/.exec(html);
if (!block) fail('index.html has no BUILD:SCRIPTS block');
const scripts = [...block[1].matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"([^>]*)><\/script>/g)]
  .filter((m) => cheats || !/data-dev/.test(m[2])).map((m) => m[1]);
if (!scripts.length) fail('no scripts found in BUILD:SCRIPTS');
for (const s of scripts) if (!fs.existsSync(path.join(ROOT, s))) fail('missing script ' + s);
const external = [...html.matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((m) => m[0]).filter((u) => !/poki\.com/.test(u) && !/w3\.org/.test(u));
if (external.length) fail('external URLs in index.html: ' + external.join(' '));

// ── dist/ ───────────────────────────────────────────────────────────────────
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'js'), { recursive: true });
const bundle = scripts.map((s) => `// ==== ${s} ====\n` + fs.readFileSync(path.join(ROOT, s), 'utf8')).join('\n;\n');
fs.writeFileSync(path.join(DIST, 'js', 'game.js'), bundle);
const outHtml = html.replace(block[0], `<script src="js/game.js?v=${version}"></script>`).replace(/css\/style\.css\?v=[^"]*/, `css/style.css?v=${version}`);
fs.writeFileSync(path.join(DIST, 'index.html'), outHtml);
const copyTree = (from) => {
  const abs = path.join(ROOT, from); if (!fs.existsSync(abs)) return 0; let n = 0;
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (!/\.(md|txt)$/i.test(e.name) || /LICENSE/i.test(e.name)) { const dst = path.join(DIST, rel(p)); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(p, dst); n++; } } };
  if (fs.statSync(abs).isDirectory()) walk(abs); else { fs.mkdirSync(path.dirname(path.join(DIST, from)), { recursive: true }); fs.copyFileSync(abs, path.join(DIST, from)); n = 1; }
  return n;
};
const counts = { css: copyTree('css'), assets: copyTree('assets') };
let total = 0; const walkAll = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walkAll(p); else total += fs.statSync(p).size; } }; walkAll(DIST);
console.log(`dist/: ${scripts.length} scripts -> js/game.js (${mb(bundle.length)}), css ${counts.css}, assets ${counts.assets}; total ${mb(total)}${cheats ? '  [CHEATS ON]' : ''}`);

// ── zip ─────────────────────────────────────────────────────────────────────
if (wantZip) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const zip = path.join(ROOT, `EscapeArrows-${stamp}.zip`);
  fs.rmSync(zip, { force: true });
  // own zip writer (tools/zip.mjs): PowerShell Compress-Archive writes "\" in entry names and Poki's Linux hosting breaks
  const res = writeZip(DIST, zip);
  const list = listZip(zip);
  if (list.length !== res.entries || !list.some((x) => x.name === 'index.html') || list.some((x) => x.name.includes('\\'))) fail('zip self-check');
  console.log('zip:', rel(zip), mb(fs.statSync(zip).size), '(index.html at the archive root)');
}
