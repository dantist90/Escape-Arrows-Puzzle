# Escape Arrows Puzzle

Neon arrow-escape puzzle for [Poki](https://poki.com): tap an arrow and it slides out along its head — if the way is clear.
Canvas 2D, no framework, procedural art and audio, 9 languages, adaptive for PC, tablet and phone.

- Design and stages: [docs/GDD.md](docs/GDD.md) · progress: [docs/STATUS.md](docs/STATUS.md)
- Poki events: [EVENTS.md](EVENTS.md) · rules for Claude sessions: [CLAUDE.md](CLAUDE.md)

```
npm install                     # dev only: puppeteer-core for the QA rigs
node tools/serve.mjs . 8993     # http://localhost:8993
node tools/probe.mjs            # QA rig (7 screen sizes + flow + events)
node tools/build.mjs --zip      # Poki build -> EscapeArrows-YYYYMMDD.zip
node tools/distcheck.mjs        # checks dist/ and the zip
node tools/pack-standalone.mjs  # EscapeArrows.html, opens with a double click
```

Dev keys: F2 — cheat panel. URL: `?qa=1&fast=1&reset=1&uilang=ru&evlog=1`.
