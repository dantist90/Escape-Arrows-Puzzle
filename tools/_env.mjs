// Shared environment resolution for the headless rigs (probe / distcheck / shots).
//
// Why this file exists: every rig used to hard-code the absolute path of one
// specific machine to find its npm packages and its Chrome binary. That works
// on exactly one computer. Everything machine-specific now lives here, is
// resolved relative to the project, and is overridable through env vars.
//
// Requirements for the rigs (NOT for the game itself — the game ships with zero
// dependencies):
//   npm install          # once, installs puppeteer-core
//   CHROME_PATH=...      # only if Chrome is not in a standard location
//
// The rigs drive a real Chrome through puppeteer-core. puppeteer-core does NOT
// download a browser, which is deliberate: the build must stay dependency-free
// and a ~200 MB browser download per checkout is not worth it.

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

/** Project root (the folder that holds index.html). */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// require() anchored at the project root, so packages resolve from
// <root>/node_modules — created by `npm install`.
const require = createRequire(path.join(ROOT, 'package.json'));

/**
 * puppeteer-core, with an actionable message instead of a raw MODULE_NOT_FOUND.
 * @returns {import('puppeteer-core')}
 */
export function loadPuppeteer() {
  try {
    return require('puppeteer-core');
  } catch (e) {
    throw new Error(
      'puppeteer-core is missing. Run `npm install` in the project root.\n' +
      `(resolved from ${path.join(ROOT, 'node_modules')})\n${e.message}`,
    );
  }
}

// Standard install locations per platform. Checked in order; the first hit wins.
const CHROME_CANDIDATES = {
  win32: [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    path.join(os.homedir(), 'AppData/Local/Google/Chrome/Application/chrome.exe'),
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ],
};

/**
 * Absolute path to a Chrome/Chromium binary.
 * CHROME_PATH wins; otherwise the first standard location that exists.
 * @returns {string}
 */
export function chromePath() {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv) {
    if (!fs.existsSync(fromEnv)) throw new Error(`CHROME_PATH points at a missing file: ${fromEnv}`);
    return fromEnv;
  }
  for (const p of CHROME_CANDIDATES[process.platform] || []) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    'Chrome not found in the standard locations for this platform.\n' +
    'Set CHROME_PATH to the browser binary, e.g.\n' +
    '  CHROME_PATH="/usr/bin/google-chrome" node tools/probe.mjs',
  );
}

// Flags shared by every rig: software WebGL (swiftshader) so the rigs run on
// machines and CI boxes without a GPU. Slow but deterministic — these rigs judge
// game STATE, not frame rate.
export const CHROME_ARGS = [
  '--no-sandbox',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
  '--disable-dev-shm-usage',
];

/**
 * puppeteer.launch() options with the executable and flags already filled in.
 * @param {object} [extra] merged on top (e.g. {args: [...CHROME_ARGS, '--mute-audio']})
 */
export function launchOptions(extra = {}) {
  return {
    executablePath: chromePath(),
    headless: 'new',
    args: CHROME_ARGS,
    ...extra,
  };
}
