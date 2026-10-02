// Свой zip без зависимостей: deflate через zlib, имена только с «/».
//
// Зачем свой: PowerShell Compress-Archive пишет имена записей с обратными
// слэшами (`css\style.css`). По спецификации zip разделитель — только «/»;
// Linux-распаковщики (хостинг Poki) читают такие имена как плоские файлы в
// корне архива — index.html грузится, а css/js «не находятся»: экран загрузки
// без стилей, игра не стартует. Поймано на FindTheNeedle-20260908.zip.
//
//   writeZip(dir, outFile) → { entries, bytes }
//   listZip(file) → [{ name, size, csize, crc, method, offset }]  (центральный каталог)
//   readZipEntry(file, entry) → Buffer                              (распаковка одной записи)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
export function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function dosDateTime(d) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

// все файлы папки, рекурсивно, отсортированные, с именами через «/»
function walk(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, base, out);
    else out.push({ file: p, name: path.relative(base, p).split(path.sep).join('/') });
  }
  return out;
}

export function writeZip(dir, outFile) {
  const items = walk(dir);
  const parts = [];
  const central = [];
  let offset = 0;
  const { time, date } = dosDateTime(new Date());
  for (const it of items) {
    const data = fs.readFileSync(it.file);
    const name = Buffer.from(it.name, 'utf8');
    if (it.name.includes('\\')) throw new Error('backslash in zip entry name: ' + it.name);
    const crc = crc32(data);
    const deflated = zlib.deflateRawSync(data, { level: 9 });
    const store = deflated.length >= data.length;      // уже сжатое (GLB с meshopt, PNG) — как есть
    const body = store ? data : deflated;
    const method = store ? 0 : 8;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);            // version needed
    lh.writeUInt16LE(0x0800, 6);        // flags: UTF-8 names
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(time, 10); lh.writeUInt16LE(date, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(name.length, 26); lh.writeUInt16LE(0, 28);
    parts.push(lh, name, body);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);            // version made by (MS-DOS, 2.0)
    ch.writeUInt16LE(20, 6);            // version needed
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(time, 12); ch.writeUInt16LE(date, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(name.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36); ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);
    central.push(ch, name);
    offset += lh.length + name.length + body.length;
  }
  const cdBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(items.length, 8); eocd.writeUInt16LE(items.length, 10);
  eocd.writeUInt32LE(cdBuf.length, 12); eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);
  const all = Buffer.concat([...parts, cdBuf, eocd]);
  fs.writeFileSync(outFile, all);
  return { entries: items.length, bytes: all.length };
}

// центральный каталог: читаем EOCD с хвоста, затем записи
export function listZip(file) {
  const buf = fs.readFileSync(file);
  let e = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { e = i; break; }
  }
  if (e < 0) throw new Error('EOCD not found: ' + file);
  const n = buf.readUInt16LE(e + 10);
  let p = buf.readUInt32LE(e + 16);
  const out = [];
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central header at ' + p);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20), size = buf.readUInt32LE(p + 24);
    const nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nl).toString('utf8');
    out.push({ name, size, csize, crc, method, offset });
    p += 46 + nl + xl + cl;
  }
  return out;
}

export function readZipEntry(file, entry) {
  const buf = fs.readFileSync(file);
  const p = entry.offset;
  if (buf.readUInt32LE(p) !== 0x04034b50) throw new Error('bad local header for ' + entry.name);
  const nl = buf.readUInt16LE(p + 26), xl = buf.readUInt16LE(p + 28);
  const start = p + 30 + nl + xl;
  const body = buf.subarray(start, start + entry.csize);
  return entry.method === 0 ? Buffer.from(body) : zlib.inflateRawSync(body);
}
