// The sea as rules. The resting waterline plus every moving wave define one water front per lane
// (`game.front`), which the renderer draws as a continuous shape and the kid and pests read.
// A wave surges down its lane from the waterline, losing power per dry row. A wall or tower stops
// it (and wears down, crumbling if the wave is stronger); a moat drains a weak wave sideways to the
// run-off at the edges; anything left reaches the castle. Then the water pulls back, leaving the
// cells it crossed flooded for a while.
import { CASTLE, GRID, SCORE, STRUCTURE, WAVE } from './config.js';
import { cellCentreX, cellTop, firstDryRow, structureAt } from './beach.js';
import { hitCastle } from './castle.js';
import { damageStructure } from './walls.js';
import { spawnFoam, spawnSplash, addShake, floatText } from './particles.js';
import { addScore } from './score.js';

export function surgeSpeed(tide, mods) {
  return (WAVE.surge + WAVE.surgePerTide * (tide - 1)) * mods.waveSpeed;
}

export function spawnWave(game, lane, power, rogue = false) {
  game.waves.push({
    lane, y: game.waterline, power, rogue, phase: 'surge', speed: surgeSpeed(game.tide, game.mods) * (rogue ? 1.1 : 0.92 + game.random() * 0.16),
    nextRow: firstDryRow(game.waterline), side: null, wobble: game.random() * 6.28, hit: false,
  });
}

function floodCell(game, col, row, seconds = 8) {
  if (row >= 0 && row < GRID.rows && game.beach.flood[row][col] < seconds) game.beach.flood[row][col] = seconds;
}

function burst(game, x, y, power) {
  spawnSplash(game.fx, game.random, x, y, 10 + Math.round(power / 3), 0.8 + Math.min(1.4, power / 40));
  spawnFoam(game.fx, game.random, x, y, 4 + Math.round(power / 14));
  addShake(game.fx, 2 + Math.min(8, power / 9));
}

/** Send the wave sideways along `row` toward the nearer edge: the run-off. */
function divert(game, wave, row) {
  wave.phase = 'side';
  wave.dir = wave.lane < (GRID.cols - 1) / 2 ? -1 : 1;
  wave.sideX = cellCentreX(wave.lane);
  wave.sideRow = row;
  game.stats.drained += 1;
  floatText(game.fx, wave.sideX, cellTop(row) + 8, 'DRAINED', '#ffffff', 22);
  game.events.push('drain');
}

function updateSurge(game, wave, dt) {
  wave.y += wave.speed * dt;
  const x = cellCentreX(wave.lane);
  while (wave.phase === 'surge' && wave.nextRow < GRID.rows && wave.y >= cellTop(wave.nextRow) + 10) {
    const row = wave.nextRow;
    wave.nextRow += 1;
    const s = structureAt(game.beach, wave.lane, row);
    if (!s) {
      floodCell(game, wave.lane, row);
      wave.power -= WAVE.rowLoss;
    } else if (s.kind === 'moat') {
      const cap = STRUCTURE.moat.capacity[s.level - 1];
      if (wave.power <= cap) {
        divert(game, wave, row);
        return;
      }
      wave.power -= cap * 0.5;
      floodCell(game, wave.lane, row);
    } else {
      const strength = wave.power;
      const result = damageStructure(game, s, wave.power);
      burst(game, x, cellTop(row) + 6, strength);
      if (result.destroyed) {
        wave.power = Math.max(1, wave.power * 0.45 - 2);
        floodCell(game, wave.lane, row, 4);
      } else {
        wave.phase = 'retreat';
        game.stats.blocked += 1;
        addScore(game, SCORE.wave);
        return;
      }
    }
    if (wave.power <= 0) {
      wave.phase = 'retreat';
      return;
    }
  }
  if (wave.phase === 'surge' && wave.y >= CASTLE.top - 6) {
    const what = hitCastle(game.castle, wave.rogue ? wave.power * 0.6 : wave.power);
    burst(game, x, CASTLE.top, wave.power + 12);
    addShake(game.fx, what === 'flag' ? 16 : 9);
    floatText(game.fx, x, CASTLE.top - 18, what === 'flag' ? 'FLAG HIT!' : `-${Math.round(wave.power * 0.7)} KEEP`, '#ff5a4a', 28);
    game.events.push(what === 'flag' ? 'flag' : 'castle');
    game.stats.leaks += 1;
    wave.phase = 'retreat';
  }
}

function updateSide(game, wave, dt) {
  const prev = Math.floor((wave.sideX - GRID.x) / GRID.cellW);
  wave.sideX += wave.dir * WAVE.sideSpeed * dt;
  const col = Math.floor((wave.sideX - GRID.x) / GRID.cellW);
  if (col < 0 || col >= GRID.cols) {
    spawnSplash(game.fx, game.random, wave.sideX, cellTop(wave.sideRow) + 30, 8, 0.8);
    wave.phase = 'gone';
    return;
  }
  if (col === prev) return;
  floodCell(game, col, wave.sideRow, 2.4);
  wave.power *= 1 - WAVE.sideLoss;
  const s = structureAt(game.beach, col, wave.sideRow);
  if (s && s.kind !== 'moat') {
    damageStructure(game, s, wave.power * 0.6);
    burst(game, cellCentreX(col), cellTop(wave.sideRow) + 30, wave.power * 0.6);
    wave.phase = 'gone';
  }
}

export function updateWaves(game, dt) {
  for (const wave of game.waves) {
    if (wave.phase === 'surge') updateSurge(game, wave, dt);
    else if (wave.phase === 'side') updateSide(game, wave, dt);
    else if (wave.phase === 'retreat') {
      wave.y -= WAVE.retreat * dt;
      if (wave.y <= game.waterline) wave.phase = 'gone';
    }
  }
  game.waves = game.waves.filter((w) => w.phase !== 'gone');
  // The front in each lane: the resting line, or the furthest surging or retreating wave.
  for (let c = 0; c < GRID.cols; c += 1) game.front[c] = game.waterline;
  for (const w of game.waves) if (w.phase !== 'side' && w.y > game.front[w.lane]) game.front[w.lane] = w.y;
}

/** The water front in pixels at a given x (the lanes blend, so a surge has shoulders). */
export function frontAt(game, x) {
  const f = (x - GRID.x) / GRID.cellW - 0.5;
  if (f <= 0 || f >= GRID.cols - 1) {
    const edge = game.front[f <= 0 ? 0 : GRID.cols - 1];
    const away = f <= 0 ? -f : f - (GRID.cols - 1);
    return game.waterline + (edge - game.waterline) * Math.max(0, 1 - away * 0.8);
  }
  const i = Math.floor(f);
  const k = f - i;
  const s = (1 - Math.cos(k * Math.PI)) / 2;
  return game.front[i] * (1 - s) + game.front[i + 1] * s;
}
