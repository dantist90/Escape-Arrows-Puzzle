# Escape Arrows Puzzle

Neon arrow-escape puzzle for [Poki](https://poki.com): tap an arrow and it slides out along its head — if the way is clear.
Canvas 2D, no framework, procedural art and audio, 9 languages, adaptive for PC, tablet and phone.

- **Levels:** 100 baked levels (Easy / Normal / Hard / Super hard, silhouettes), endless generated levels after that.
- **Boosters:** hint, shield, magic wand in a level; extra heart, warm-up, glow before a level.
- **Tournament:** a 5-level run against 19 AI players for a ticket; arrows won fill the **Roadmap** of rewards.
- **Meta:** Room decor for stars, Album with replays, Skins (arrow palettes, backgrounds), Daily tasks.
- **FTUE:** Lu the neon fox teaches one thing at a time; a new player starts in level 1 right away.

Design and stages: [docs/GDD.md](docs/GDD.md) · progress: [docs/STATUS.md](docs/STATUS.md) ·
Poki events: [EVENTS.md](EVENTS.md) · rules for Claude sessions: [CLAUDE.md](CLAUDE.md)

## Run and check
```
npm install                     # dev only: puppeteer-core for the QA rigs
node tools/serve.mjs . 8993     # http://localhost:8993
npm run check                   # probe + textfit + build + distcheck
```
Dev: F2 — cheat panel. URL: `?qa=1&fast=1&reset=1&uilang=ru&evlog=1&nosdk=1`.

## Upload to Poki
1. `npm run check` — everything green.
2. Upload `EscapeArrows-YYYYMMDD.zip` (index.html at the archive root, no external requests except the Poki SDK).
3. `node tools/pack-standalone.mjs` makes `EscapeArrows.html` — one file to send for a quick look (no ads, local shim).
