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
| `room / step-<k> / unlocked` | шаг Комнаты куплен | 6 |

Плейсменты ревардов: `continue` (сердце после проигрыша), `ticket` (вход в турнир), `double` (x2 награда), `booster` (бустер бесплатно).

Уровни турнира не шлют `level / <N> / ...` — у них своя воронка `tournament / level-<k>`, чтобы не смешивать с прогрессом по уровням.
