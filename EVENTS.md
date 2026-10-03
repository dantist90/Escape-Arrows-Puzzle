# События Poki (`PokiSDK.measure`)

Вызов в коде: `AP.poki.measure(category, what, action)` (`js/poki.js`). Значения без `/` и `^`.
Справка Poki: https://developers.poki.com/guide/game-events

**Правило:** любое новое или изменённое событие добавляется сюда в том же коммите.
`tools/probe.mjs` проверяет, что каждое отправленное игрой событие подходит под строку из колонки «Событие».
Запись шаблона: `<N>` — любое значение, `a|b` — одно из вариантов.

## Базовые вызовы SDK
| Вызов | Когда |
|---|---|
| `gameLoadingFinished` | загрузчик закончил, показано лобби |
| `gameplayStart` | вход в уровень (срабатывает после первого действия игрока) |
| `gameplayStop` | выход из уровня, перед любой рекламой |
| `commercialBreak` | переход в уровень под шторкой, начиная с уровня `CONFIG.level.adFromLevel` |
| `rewardedBreak` | кнопки «за рекламу» (этап 3+) |

Показ рекламы Poki считает сам — отдельные события для него не шлём.

Правила, которые проверяет `tools/probe.mjs` по журналу `AP.poki.log`:
- `gameplayStart` / `gameplayStop` строго чередуются; `start` — только после действия игрока.
- Любая реклама идёт при остановленном gameplay; во время рекламы `start` не вызывается (отложенный старт срабатывает после `adEnd`).
- В уровне gameplay идёт, только пока нет открытого окна и уровень не закончен (`js/level.js`, синхронизация в `update`).
- Ревард, который не досмотрели (`rewardedBreak` → `false`), ничего не выдаёт.
- Звук выключен на время рекламы и при свёрнутой вкладке.

## События
| Событие | Когда | Этап |
|---|---|---|
| `level / <N> / start` | уровень N открыт (каждая попытка) | 0 |
| `level / <N> / complete` | уровень N пройден — ровно один исход на попытку | 0 |
| `level / <N> / fail` | сердца кончились без продолжения или выход из уровня | 0 |
| `difficulty / easy\|normal\|hard\|superhard / start` | вместе с `level/N/start`, сложность уровня | 0 |
| `button / play\|tournament\|roadmap\|room\|album\|skins\|tasks / visible` | кнопка лобби показана (раз за визит в лобби) | 0 |
| `button / play\|tournament\|roadmap\|room\|album\|skins\|tasks / interact` | нажатие на кнопку лобби | 0 |
| `rewarded / <placement> / visible` | кнопка за рекламу показана (раз за визит на экран) | 3 |
| `rewarded / <placement> / interact` | нажатие на кнопку за рекламу | 3 |
| `tutorial / step-<k> / start\|complete` | шаг обучения FTUE | 4 |
| `booster / hint\|shield\|wand / use` | бустер в уровне использован | 3 |
| `prebooster / heart\|warmup\|glow / select` | пре-бустер выбран в окне старта | 3 |
| `tournament / run-<n> / start\|complete\|fail` | забег турнира: начат за билет или ревард / доигран / брошен | 5 |
| `tournament / level-<k> / start\|complete\|fail` | уровень k (1..5) забега: открыт / пройден / сдан (сердца кончились или выход) | 5 |
| `roadmap / milestone-<k> / unlocked` | награда Roadmap получена | 5 |
| `room / step-<k> / unlocked` | шаг Комнаты куплен (k — сквозной номер шага по всем комнатам) | 6 |
| `pickup / coin\|bomb\|fire\|heart\|lightning\|key / collect` | стрелка пролетела через предмет на поле и собрала его (ключ открывает замок своего цвета) | 9 |
| `replay / <N> / start\|complete\|fail` | переигровка уровня N из Альбома (свой исход на попытку) | 6 |
| `cosmetic / <id> / unlocked\|equip` | скин стрелок или фон куплен / получен с Roadmap; выбран | 6 |
| `daily / task-<kind> / complete` | награда за задание дня забрана (kind: win, stars3, arrows, booster, tour) | 6 |
| `daily / chest / claimed` | сундук за все 3 задания дня забран | 6 |
Плейсменты ревардов: `continue` (сердце после проигрыша), `ticket` (вход в турнир), `double` (x2 награда), `booster` (бустер бесплатно).

Уровни турнира не шлют `level / <N> / ...` — у них своя воронка `tournament / level-<k>`, чтобы не смешивать с прогрессом по уровням.
