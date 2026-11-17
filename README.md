# tidefort-game

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Regian1117/tidefort-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Regian1117/tidefort-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**TIDEFORT** is a bright, sunny sandcastle-defence game drawn entirely in code on a 2D canvas, with every sound synthesised in WebAudio. No engine, no network, no external assets.

Keep your castle's flag standing through **7 rising tides**. The sea is the star: its waterline surges down the beach on every wave and creeps closer to the castle each tide, so dry land shrinks. Before each tide telegraphed arrows show which lanes will be hit and how hard (big swell, side surge, double crest, rip lane). Sand is scarce: you can only guard part of the beach. Walls stop waves, moats drain weak ones sideways into the run-off, towers shoot pests in nearby lanes. During the tide you run a beach kid (WASD) who refills a bucket at the risky wet line, patches cracks, stomps crabs and swats gulls that dive for the bucket. After every tide pick 1 of 3 upgrades; tide 7 ends with a rogue wave that hits every lane at once.

- **Win:** survive all 7 tides.
- **Lose:** the sea reaches your flag.

### Controls

| Input | Action |
|---|---|
| `1` `2` `3` then click an empty dry cell | build a Wall / Tower / Moat |
| Click (or right-click) a structure | upgrade it (3 levels) |
| `Enter` | start the tide when you are ready |
| `W` `A` `S` `D` | walk the kid (stay out of the surge: it washes you back and spills your bucket) |
| `Space` | context action: fill the bucket at the wet line, patch a cracked structure, swat a gull or log, deposit sand at the castle |
| walk into a crab | stomp it |
| `P` / `M` / `R` | pause / mute / rebuild |

### Code map (`game/src/`)

`main.js` boot and screenshot mode, `app.js` loop and screen state machine, `game.js` state and update, `tides.js` build/tide phases and the creeping waterline, `lanes.js` wave patterns and the telegraphed forecast, `waves.js` the water front rules, `sea.js` the water drawing, `kid.js` the beach kid, `enemies.js`, `walls.js`, `castle.js`, `beach.js` (grid and waterline), `upgrades.js`, `player.js` (mouse building), `score.js`, `particles.js`, `audio.js`, `input.js`, `scene.js` / `structures.js` / `sprites.js` / `dressing.js` / `draw.js` (art), `hud.js`, `screens.js`, `render.js`, `autopilot.js` (attract mode and screenshot robot), `shots.js`, `config.js`, `random.js`.

## Run it

```sh
node serve.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
