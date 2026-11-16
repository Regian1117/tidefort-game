// The sea's waves. Each wave rolls down one lane from the sea, crosses moat cells (losing power),
// breaks on the first wall or tower it meets (wearing it down), and anything left over that reaches
// the bottom of the grid hits the castle. A rogue wave is just twelve big waves side by side.
import { CASTLE, GRID, SCORE, SEA, STRUCTURE, WAVE } from './config.js';
import { cellCentreX, cellTop, structureAt } from './beach.js';
import { hitCastle } from './castle.js';
import { damageStructure } from './walls.js';
import { spawnFoam, spawnSplash, addShake, floatText } from './particles.js';
import { addScore } from './score.js';

export function wavePowerFor(tide) {
  return WAVE.basePower + WAVE.powerPerTide * (tide - 1);
}

export function waveSpeedFor(tide, mods) {
  return (WAVE.baseSpeed + WAVE.speedPerTide * (tide - 1)) * mods.waveSpeed;
}

export function spawnWave(game, lane, power, rogue = false) {
  game.waves.push({
    lane, y: SEA.top + 8, power, rogue,
    speed: waveSpeedFor(game.tide, game.mods) * (rogue ? 1.15 : 0.9 + game.random() * 0.25),
    nextRow: 0, dead: false, wobble: game.random() * 6.28,
  });
}

function breakWave(game, wave, x, y, strength) {
  spawnSplash(game.fx, game.random, x, y, 6 + Math.round(strength / 5), 0.6 + Math.min(1, strength / 40));
  spawnFoam(game.fx, game.random, x, y, 3);
  wave.dead = true;
}

export function updateWaves(game, dt) {
  for (const wave of game.waves) {
    if (wave.dead) continue;
    wave.y += wave.speed * dt;
    const x = cellCentreX(wave.lane);
    while (!wave.dead && wave.nextRow < GRID.rows && wave.y >= cellTop(wave.nextRow) + 12) {
      const row = wave.nextRow;
      wave.nextRow += 1;
      const s = structureAt(game.beach, wave.lane, row);
      if (!s) continue;
      if (s.kind === 'moat') {
        wave.power *= 1 - STRUCTURE.moat.absorb[s.level - 1];
        spawnFoam(game.fx, game.random, x, cellTop(row) + 30, 2);
        if (wave.power < 3) {
          breakWave(game, wave, x, cellTop(row) + 30, 3);
          game.stats.blocked += 1;
        }
        continue;
      }
      const result = damageStructure(game, s, wave.power);
      const strength = wave.power;
      if (result.destroyed) {
        wave.power = Math.max(2, wave.power * 0.5 - 2);
        spawnSplash(game.fx, game.random, x, cellTop(row) + 40, 8, 0.9);
      } else {
        breakWave(game, wave, x, cellTop(row) + 6, strength);
        game.stats.blocked += 1;
        addScore(game, SCORE.wave, x, cellTop(row) - 6, '#ffffff');
        game.sand += 1;
      }
    }
    if (!wave.dead && wave.y >= CASTLE.top - 2) {
      const what = hitCastle(game.castle, wave.power);
      breakWave(game, wave, x, CASTLE.top, wave.power + 10);
      addShake(game.fx, what === 'flag' ? 16 : 9);
      floatText(game.fx, x, CASTLE.top - 14, what === 'flag' ? 'FLAG HIT!' : `-${Math.round(wave.power * 0.7)} KEEP`, '#ff5a4a', 28);
      game.events.push(what === 'flag' ? 'flag' : 'castle');
      game.stats.leaks += 1;
    }
  }
  game.waves = game.waves.filter((w) => !w.dead);
}
