// Общее для ригов: свой dev-сервер на время прогона, страница с фильтром
// консоли (Poki SDK на localhost сам ругается на «неавторизованный хостинг»),
// PASS/FAIL-счётчик. Риги судят по window.QA, а не по картинке.
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadPuppeteer, launchOptions } from './_env.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const isPoki = (s) => /poki|doubleclick|googlesyndication|googleapis|amazon-adsystem|google-analytics|googletagmanager/i.test(s);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function makeCheck() {
  const st = { failed: 0, n: 0 };
  const check = (name, ok, detail = '') => {
    st.n++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
    if (!ok) st.failed++;
  };
  check.done = () => { console.log(st.failed ? `\nИТОГ: FAIL (${st.failed}/${st.n})` : `\nИТОГ: PASS (${st.n})`); process.exit(st.failed ? 1 : 0); };
  return check;
}

// поднимает node tools/serve.mjs на порту, ждёт «serving»
export function startServer(port, root = ROOT) {
  const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'serve.mjs'), root, String(port)], { stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((resolve) => {
    child.stdout.on('data', (d) => { if (String(d).includes('serving')) resolve(child); });
    setTimeout(() => resolve(child), 1500);
  });
}

export async function openPage(opts = {}) {
  const puppeteer = loadPuppeteer();
  const browser = await puppeteer.launch(launchOptions({ args: [...launchOptions().args, '--mute-audio', '--autoplay-policy=no-user-gesture-required'] }));
  const page = await browser.newPage();
  await page.setViewport({ width: opts.width ?? 960, height: opts.height ?? 640 });
  const errors = [], requests = [], failedReq = [];
  // Ошибки консоли. Игра наружу не ходит (это проверяет distcheck), поэтому
  // «Failed to load resource» с чужого хоста — рекламный стек SDK при сбое сети,
  // а не игра; исключение со стеком из скрипта площадки — тоже не наше.
  const local = (u) => !u || /^(https?:\/\/(localhost|127\.0\.0\.1)|file:)/.test(u);
  page.on('console', (m) => {
    if (m.type() !== 'error' || isPoki(m.text())) return;
    const url = (m.location() || {}).url || '';
    if (/Failed to load resource/.test(m.text()) && !local(url)) return;
    errors.push(m.text() + (url ? ' @ ' + url : ''));
  });
  page.on('pageerror', (e) => {
    const stack = String(e.stack || '');
    if (isPoki(stack)) return;
    const where = (stack.split('\n').find((l) => /https?:|file:/.test(l)) || '').trim();
    errors.push(e.message + (where ? ' @ ' + where : ''));
  });
  // Запросы, которые делает САМ SDK площадки (рекламный стек: 2mdn, prebid,
  // imasdk…), игре не принадлежат: отличаем по инициатору — скрипту с хоста Poki.
  const bySdk = (r) => {
    try {
      const ini = r.initiator() || {};
      const frames = (ini.stack && ini.stack.callFrames) || [];
      let st = ini.stack;
      const urls = [ini.url, ...frames.map((fr) => fr.url)];
      while (st && st.parent) { st = st.parent; for (const fr of st.callFrames || []) urls.push(fr.url); }
      return urls.filter(Boolean).some((u) => isPoki(u));
    } catch (e) { return false; }
  };
  page.on('request', (r) => { if (!bySdk(r)) requests.push(r.url()); });
  page.on('requestfailed', (r) => { if (!isPoki(r.url()) && !r.url().startsWith('blob:')) failedReq.push(r.url()); });
  return { browser, page, errors, requests, failedReq };
}

export async function waitReady(page, timeout = 60000) {
  await page.waitForFunction('window.QA && QA.state && QA.state().ready', { timeout, polling: 200 });
}

// шаг игрового времени внутри страницы (rAF в headless может стоять)
export const step = (page, s) => page.evaluate((x) => QA.step(x), s);
export const state = (page) => page.evaluate(() => QA.state());
