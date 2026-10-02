# Escape Arrows Puzzle — правила для сессий Claude

Головоломка для Poki: стрелки-«змейки» на сетке, тап — стрелка улетает по направлению наконечника,
если путь до края свободен; иначе отскок и минус сердце. Аудитория — девочки 10–12 лет, неоновый стиль.
Полный дизайн и этапы: [docs/GDD.md](docs/GDD.md). Что сделано и что дальше: [docs/STATUS.md](docs/STATUS.md).
События Poki: [EVENTS.md](EVENTS.md).

Пользователь общается по-русски — отвечать по-русски. Код и комментарии в коде — по-английски.

## Как работаем
- Каждый этап из GDD — отдельная ветка `stage-N-<кратко>` и PR в `main`. Один этап — одна сессия.
- В начале сессии: прочитать GDD, STATUS, EVENTS. В конце — обновить STATUS (что сделано, что осталось, решения).
- Перед PR обязательно: `node tools/probe.mjs` зелёный; если менялась сборка — `node tools/build.mjs --zip && node tools/distcheck.mjs`.

## Запуск и инструменты (только Node, Python нет и не нужен)
```
npm install                      # один раз: puppeteer-core для ригов (игре зависимости не нужны)
node tools/serve.mjs . 8993      # dev-сервер http://localhost:8993  (?qa=1&fast=1&reset=1&uilang=ru&evlog=1)
node tools/genlevels.mjs         # перепечь levels/levels.js (100 уровней) + таблица метрик
node tools/probe.mjs             # главный риг: 7 размеров экрана + сценарий + события, скриншоты в shots/
node tools/build.mjs --zip       # dist/ + EscapeArrows-YYYYMMDD.zip для Poki (без чит-панели)
node tools/distcheck.mjs         # dist/ грузится сам, ноль 404/внешних запросов, zip = dist/
node tools/pack-standalone.mjs   # EscapeArrows.html — один файл, открывается двойным кликом
```
Риги ищут Chrome в стандартных местах; иначе задать `CHROME_PATH`. В облаке без Chrome:
`npx @puppeteer/browsers install chrome@stable` и `CHROME_PATH=<путь из вывода>`.
Zip собирать только `tools/build.mjs` (свой `tools/zip.mjs`): PowerShell Compress-Archive пишет `\` в именах, и хостинг Poki ломается.

## Архитектура
- Canvas 2D, без фреймворка и бандлера. Классические `<script>` по порядку из блока `BUILD:SCRIPTS` в `index.html`;
  билд склеивает их в `dist/js/game.js`. Новый файл — добавить строку в этот блок. Скрипты с `data-dev` в билд не идут.
- Всё на одном глобальном объекте `AP`. Баланс — только в `config.js` (`AP.CONFIG`), никаких чисел в коде.
- Сцены: `AP.screens.<id> = {enter, leave, update, draw, onDown, onMove, onUp}` (`js/game.js`). Переход с шторкой и
  интерстишелом: `AP.game.open(id, arg, {ad:true})`. Модалки: `AP.game.modal = {type}` + `AP.modals[type]`.
- UI — immediate mode (`js/ui.js`): виджеты рисуются каждый кадр и регистрируют хит-зону. Кнопки: `AP.ui.button`, `AP.ui.iconButton`, сетка `AP.ui.grid`.
- Адаптив: `AP.ui.layout = {portrait, s, safe, head, foot, stage}`. Все размеры, шрифты и отступы умножать на `s`.
  Текст рисовать через `AP.util.text(..., {maxW})` — он сам ужимается и обрезается. Safe-area берётся из CSS env().
- Арт процедурный (`js/art.js`): неоновые трубки `AP.art.tube`, фон, иконки, валюты. Любой спрайт `assets/images/<group>/<name>.png`
  из `assets/manifest.json` заменяет отрисовку с тем же именем (`AP.assets.draw`).
- Звук процедурный (`js/audio.js`), без файлов. Тексты: `AP.t(key, vars)`, 9 языков в `js/i18n.js` + `AP.addStrings` в модулях.
- Сохранение: `AP.save` (`js/save.js`), новые поля — только через `AP.SAVE_DEFAULTS`.
- Уровни: `levels/levels.js` (`AP.LEVELS`) генерирует `node tools/genlevels.mjs` — руками не править. Это скрипт, а не JSON через fetch,
  чтобы работал standalone. После последнего запечённого уровня `AP.levelData(n)` генерирует уровень в игре (`js/gen.js`).
- QA: `?qa=1` даёт `window.QA` (`state, step, hits, tap, tapAt, goto`). Риги судят по состоянию, не по пикселям.
  Новый экран — добавить его в `QA.state()` и сценарий в `tools/probe.mjs`.

## Poki — обязательные правила
- Только через `AP.poki`: `gameplayStart/Stop` (чередуются, старт после действия игрока), `commercialBreak`
  (только в `AP.trans`, не на первых уровнях: `CONFIG.level.adFromLevel`), `rewardedBreak(placement)`.
- События: `AP.poki.measure(category, what, action)`; на уровень — `levelStart(n, diff)` и ровно один `levelEnd(n, ok)`.
- **Любое новое или изменённое событие — сразу в EVENTS.md** (риг сверяет лог событий с документом).
- Никаких внешних URL, кроме Poki SDK. Всё (шрифт, арт, звук) — внутри билда.

## Чего не делать
- Не добавлять npm-зависимости в саму игру (только dev-зависимости для ригов).
- Не использовать Python. Не коммитить `dist/`, zip, `EscapeArrows.html`, `shots/`, `node_modules/`.
- Не включать `CONFIG.debug.unlockAll` и `--cheats` в релизной сборке.
