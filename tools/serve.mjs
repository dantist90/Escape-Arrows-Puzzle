// Статический сервер разработки на Node (Python в этой среде нет):
//
//   node tools/serve.mjs [корень=.] [порт=8993]
//
// Зачем свой, а не npx serve: (1) заголовки no-cache — правки модулей видны
// по F5 без «пустого кеша»; (2) правильные MIME: браузер отказывается
// выполнять ES-модуль, отданный как text/html, а GLB без model/gltf-binary
// distcheck считает ошибкой; (3) ноль зависимостей.
import { createServer } from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] ?? path.join(HERE, '..'));
const port = Number(process.argv[3] ?? 8993);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

createServer(async (req, res) => {
  let rel;
  try { rel = decodeURIComponent((req.url ?? '/').split('?')[0].split('#')[0]); } catch { rel = '/'; }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
  try {
    const st = await stat(file);
    if (st.isDirectory()) { res.writeHead(301, { Location: rel + '/' }); res.end(); return; }
    const body = await readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found: ' + rel);
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
