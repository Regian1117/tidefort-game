// The pests: hermit crabs that crawl down a lane to steal flag health, gulls that land on a
// structure and peck it, and driftwood logs that ram the first wall in a lane. Click one (or let a
// tower shell it) to hurt it; each has a few hit points.
import { CASTLE, GRID, SCORE, SEA } from './config.js';
import { cellCentreX, cellCentreY, cellTop, allStructures, structureAt } from './beach.js';
import { stealFlag } from './castle.js';
import { damageStructure } from './walls.js';
import { spawnChunks, spawnSparkle, spawnSplash, floatText, addShake } from './particles.js';
import { addScore, bumpCombo } from './score.js';

export function spawnCrab(game) {
  const lane = Math.floor(game.random() * GRID.cols);
  game.enemies.push({
    type: 'crab', state: 'walk', x: cellCentreX(lane), y: SEA.bottom - 6, lane,
    hp: game.tide >= 5 ? 2 : 1, speed: 24 + game.tide * 3, pinch: 0, phase: game.random() * 6.28, radius: 30,
  });
}

export function spawnGull(game) {
  const targets = allStructures(game.beach).filter((s) => s.kind !== 'moat');
  const left = game.random() < 0.5;
  game.enemies.push({
    type: 'gull', state: 'fly', x: left ? GRID.x - 90 : GRID.x + GRID.cols * GRID.cell + 90, y: SEA.top + 20,
    hp: 2, speed: 170, target: targets.length ? targets[Math.floor(game.random() * targets.length)] : null,
    peck: 0, stay: 0, phase: game.random() * 6.28, radius: 32,
  });
}

export function spawnLog(game) {
  const lane = Math.floor(game.random() * GRID.cols);
  game.enemies.push({
    type: 'log', state: 'drift', x: cellCentreX(lane), y: SEA.top + 6, lane, hp: 3,
    speed: 46 + game.tide * 3, spin: game.random() * 6.28, radius: 34,
  });
}

/** One hit on a pest, from a click or a shell. */
export function hurtEnemy(game, e, damage, source) {
  if (e.state === 'dead' || e.state === 'flee') return;
  e.hp -= damage;
  e.flash = 0.15;
  spawnChunks(game.fx, game.random, e.x, e.y, 3);
  if (e.hp > 0) {
    game.events.push('thud');
    return;
  }
  const points = e.type === 'crab' ? SCORE.crab : e.type === 'gull' ? SCORE.gull : SCORE.log;
  addScore(game, points, e.x, e.y - 20, '#ffd23f');
  spawnSparkle(game.fx, game.random, e.x, e.y, 8, '#ffffff');
  game.events.push('squash');
  if (source === 'click') bumpCombo(game);
  if (e.type === 'crab') {
    game.stats.crabs += 1;
    e.state = 'dead';
  } else if (e.type === 'gull') {
    game.stats.gulls += 1;
    e.state = 'flee';
    e.hp = 99;
  } else {
    game.stats.logs += 1;
    spawnSplash(game.fx, game.random, e.x, e.y, 10, 0.8);
    e.state = 'dead';
  }
}

function updateCrab(game, e, dt) {
  e.phase += dt * 8;
  if (e.state === 'flee') {
    e.y -= 110 * dt;
    if (e.y < SEA.bottom - 20) e.state = 'dead';
    return;
  }
  const row = Math.floor((e.y + 22 - GRID.y) / GRID.cell);
  const here = row >= 0 && row < GRID.rows ? structureAt(game.beach, e.lane, row) : null;
  if (here && here.kind === 'moat') {
    if (game.mods.crabTraps) {
      e.hp = 0;
      e.state = 'dead';
      game.stats.crabs += 1;
      addScore(game, SCORE.crab, e.x, e.y - 20, '#ffd23f');
      spawnSplash(game.fx, game.random, e.x, e.y, 8, 0.7);
      floatText(game.fx, e.x, e.y - 44, 'TRAPPED', '#ffffff', 22);
      game.events.push('squash');
      return;
    }
    e.y += e.speed * 0.4 * dt;
  } else if (here && here.kind !== 'moat' && e.y + 20 > cellTop(row) + 18) {
    e.state = 'pinch';
    e.pinch += dt;
    if (e.pinch > 0.55) {
      e.pinch = 0;
      damageStructure(game, here, 4 + game.tide);
      game.events.push('pinch');
    }
    return;
  } else {
    e.state = 'walk';
    e.y += e.speed * dt;
  }
  if (e.y + 22 >= CASTLE.top) {
    stealFlag(game.castle);
    e.state = 'flee';
    addShake(game.fx, 10);
    floatText(game.fx, e.x, CASTLE.top - 16, 'FLAG STOLEN!', '#ff5a4a', 28);
    game.events.push('flag');
    game.stats.leaks += 1;
  }
}

function updateGull(game, e, dt) {
  e.phase += dt * 6;
  if (e.state === 'flee') {
    e.y -= 190 * dt;
    e.x += (e.x < 640 ? -1 : 1) * 120 * dt;
    if (e.y < SEA.top - 60) e.state = 'dead';
    return;
  }
  if (e.state === 'fly') {
    if (!e.target || e.target.hp <= 0 || game.beach.cells[e.target.row][e.target.col] !== e.target) {
      const options = allStructures(game.beach).filter((s) => s.kind !== 'moat');
      e.target = options.length ? options[Math.floor(game.random() * options.length)] : null;
      if (!e.target) {
        e.state = 'flee';
        return;
      }
    }
    const tx = cellCentreX(e.target.col);
    const ty = cellCentreY(e.target.row) - 26;
    const dx = tx - e.x;
    const dy = ty - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 10) {
      e.state = 'peck';
      e.stay = 0;
    } else {
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;
    }
    return;
  }
  if (e.state === 'peck') {
    e.stay += dt;
    e.peck += dt;
    if (!e.target || game.beach.cells[e.target.row][e.target.col] !== e.target || e.stay > 6 * game.mods.gullPeck + 2) {
      e.state = 'flee';
      return;
    }
    if (e.peck > 0.5) {
      e.peck = 0;
      damageStructure(game, e.target, 3.2 * game.mods.gullPeck);
      game.events.push('pinch');
    }
  }
}

function updateLog(game, e, dt) {
  e.spin += dt * 3;
  const row = Math.floor((e.y + 26 - GRID.y) / GRID.cell);
  const here = row >= 0 && row < GRID.rows ? structureAt(game.beach, e.lane, row) : null;
  e.y += e.speed * dt;
  if (here && here.kind !== 'moat' && e.y + 26 > cellTop(row) + 14) {
    damageStructure(game, here, 30 + game.tide * 6);
    addShake(game.fx, 12);
    spawnSplash(game.fx, game.random, e.x, e.y, 12, 1);
    floatText(game.fx, e.x, e.y - 30, 'RAM!', '#ff5a4a', 26);
    e.state = 'dead';
    game.events.push('ram');
    return;
  }
  if (e.y + 26 >= CASTLE.top) {
    stealFlagOrKeep(game, e);
    e.state = 'dead';
  }
}

function stealFlagOrKeep(game, e) {
  game.castle.hp = Math.max(0, game.castle.hp - 20);
  game.castle.flash = 0.35;
  addShake(game.fx, 12);
  floatText(game.fx, e.x, CASTLE.top - 16, '-20 KEEP', '#ff5a4a', 28);
  game.events.push('castle');
  game.stats.leaks += 1;
}

export function updateEnemies(game, dt) {
  for (const e of game.enemies) {
    if (e.flash > 0) e.flash -= dt;
    if (e.state === 'dead') continue;
    if (e.type === 'crab') updateCrab(game, e, dt);
    else if (e.type === 'gull') updateGull(game, e, dt);
    else updateLog(game, e, dt);
  }
  game.enemies = game.enemies.filter((e) => e.state !== 'dead');
}

/** The pest under a pixel, nearest first, or null. Used by clicks. */
export function enemyAt(game, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const e of game.enemies) {
    if (e.state === 'dead' || e.state === 'flee') continue;
    const d = Math.hypot(e.x - x, e.y - y);
    if (d < e.radius + 8 && d < bestDist) {
      best = e;
      bestDist = d;
    }
  }
  return best;
}
