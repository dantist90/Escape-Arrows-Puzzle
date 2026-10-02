// One double-clickable file: EscapeArrows.html (no server, no network; the Poki SDK is left out, so the local ad shim runs).
//
//   node tools/pack-standalone.mjs
//
// Builds dist/ first (no version bump), then inlines css (font as a data URL), the joined js/game.js and every PNG
// listed in assets/manifest.json (as data URLs in an inline manifest). Output: EscapeArrows.html in the project root.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
execFileSync(process.execPath, [path.join(ROOT, 'tools', 'build.mjs'), '--no-bump'], { stdio: 'inherit' });

const b64 = (p) => fs.readFileSync(p).toString('base64');
let css = fs.readFileSync(path.join(DIST, 'css', 'style.css'), 'utf8')
  .replace(/src: url\("\.\.\/assets\/fonts\/game\.woff2"\)[^;]*;/, `src: url(data:font/woff2;base64,${b64(path.join(DIST, 'assets', 'fonts', 'game.woff2'))}) format("woff2");`);
let js = fs.readFileSync(path.join(DIST, 'js', 'game.js'), 'utf8');
// images: replace the manifest fetch with an inline list of data URLs
const man = JSON.parse(fs.readFileSync(path.join(DIST, 'assets', 'manifest.json'), 'utf8'));
const imgs = (man.images || []).map((e) => { const p = typeof e === 'string' ? e : e.p; const g = typeof e === 'string' ? undefined : e.g;
  return { p, g, d: 'data:image/png;base64,' + b64(path.join(DIST, 'assets', 'images', p)) }; });
js = `window.AP_INLINE_IMAGES = ${JSON.stringify(imgs)};\n` + js;
let html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
  .replace(/<script src="https:\/\/game-cdn\.poki\.com[^"]*"><\/script>\n?/, '')
  .replace(/<link rel="stylesheet" href="css\/style\.css[^"]*">/, () => `<style>\n${css}\n</style>`)
  .replace(/<script src="js\/game\.js[^"]*"><\/script>/, () => `<script>\n${js.replace(/<\/script>/g, '<\\/script>')}\n</script>`);
const out = path.join(ROOT, 'EscapeArrows.html');
fs.writeFileSync(out, html);
console.log('standalone:', path.relative(ROOT, out), (fs.statSync(out).size / 1048576).toFixed(2), 'MB');
