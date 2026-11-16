# tidefort-game

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Regian1117/tidefort-game/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Regian1117/tidefort-game/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**TIDEFORT** is a bright, sunny sandcastle-defence game drawn entirely in code on a 2D canvas, with every sound synthesised in WebAudio. No engine, no network, no external assets.

Keep your castle's flag standing through **7 rising tides**. Between tides you spend sand to build walls, towers and moats on a grid in front of the castle. During a tide the waves roll down the lanes and wear your sand away while you patch walls, squash hermit crabs, shoo gulls and break driftwood. After every tide you pick 1 of 3 upgrades, and tide 7 ends with a rogue wave that hits every lane at once.

- **Win:** survive all 7 tides.
- **Lose:** the sea reaches your flag.

### Controls

| Input | Action |
|---|---|
| `1` `2` `3` (or click the palette) | pick Wall / Tower / Moat |
| Click an empty cell | build the selected piece |
| Click a damaged wall or tower | patch it (patch one below 40% for a perfect patch and a combo) |
| Click a crab, gull or log | squash it (towers shoot pests too) |
| Right-click a structure | upgrade it (3 levels) |
| `Space` | scoop sand during a tide, or start the tide early while building |
| `P` / `M` / `R` | pause / mute / rebuild |

### Code map (`game/src/`)

`main.js` boot and screenshot mode, `app.js` loop and screen state machine, `game.js` state and update, `tides.js` build/tide phases and schedules, `waves.js`, `enemies.js`, `walls.js`, `castle.js`, `beach.js` (grid), `upgrades.js`, `player.js` (tools, clicks, scoop), `score.js`, `particles.js`, `audio.js`, `input.js`, `scene.js` / `sprites.js` / `draw.js` (art), `hud.js`, `screens.js`, `render.js`, `autopilot.js` (attract mode and screenshot robot), `shots.js`, `config.js`, `random.js`.

## Run it

```sh
node serve.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
