// The pests: hermit crabs that crawl down a lane to steal flag health (the kid stomps them),
// gulls that dive at the kid's bucket to steal sand (or land on a structure and peck it), and
// driftwood logs that ram the first structure in a lane. Towers shoot them in range, and Space
// swats a gull or log next to the kid.
import { CASTLE, GRID, SCORE } from './config.js';
import { cellCentreX, cellCentreY, cellTop, allStructures, structureAt } from './beach.js';
import { stealFlag } from './castle.js';
import { damageStructure } from './walls.js';
import { spawnChunks, spawnSparkle, spawnSplash, floatText, addShake } from './particles.js';
import { addScore, bumpCombo } from './score.js';

export function spawnCrab(game, lane) {
  game.enemies.push({
    type: 'crab', state: 'walk', x: cellCentreX(lane), y: game.waterline + 24, lane,
    hp: game.tide >= 5 ? 2 : 1, speed: 30 + game.tide * 3.5, pinch: 0, phase: game.random() * 6.28, radius: 30, stompCd: 0,
  });
}

export function spawnGull(game) {
  const left = game.random() < 0.5;
  game.enemies.push({
    type: 'gull', state: 'fly', x: left ? -60 : 1340, y: game.waterline - 30, hp: 2, speed: 200, target: null,
    peck: 0, stay: 0, phase: game.random() * 6.28, radius: 34,
  });
}

export function spawnLog(game, lane) {
  game.enemies.push({
    type: 'log', state: 'drift', x: cellCentreX(lane), y: game.waterline + 4, lane, hp: 3,
    speed: 52 + game.tide * 3, spin: game.random() * 6.28, radius: 36,
  });
}

/** One hit on a pest, from a stomp, a swat or a shell. */
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
  addScore(game, points, e.x, e.y - 24, '#ffd23f');
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

function laneRow(e) {
  return Math.floor((e.y + 22 - GRID.y) / GRID.cellH);
}

function updateCrab(game, e, dt) {
  e.phase += dt * 8;
  if (e.stompCd > 0) e.stompCd -= dt;
  if (e.state === 'flee') {
    e.y -= 120 * dt;
    if (e.y < game.waterline) e.state = 'dead';
    return;
  }
  const row = laneRow(e);
  const here = row >= 0 && row < GRID.rows ? structureAt(game.beach, e.lane, row) : null;
  if (here && here.kind !== 'moat' && e.y + 20 > cellTop(row) + 20) {
    e.state = 'pinch';
    e.pinch += dt;
    if (e.pinch > 0.55) {
      e.pinch = 0;
      damageStructure(game, here, 4 + game.tide);
      game.events.push('pinch');
    }
    return;
  }
  e.state = 'walk';
  e.y += e.speed * (here ? 0.5 : 1) * dt;
  if (here && here.kind === 'moat' && game.mods.crabTraps) {
    e.state = 'dead';
    game.stats.crabs += 1;
    addScore(game, SCORE.crab, e.x, e.y - 20, '#ffd23f');
    floatText(game.fx, e.x, e.y - 44, 'TRAPPED', '#ffffff', 22);
    game.events.push('squash');
    return;
  }
  if (e.y + 22 >= CASTLE.top) {
    stealFlag(game.castle);
    e.state = 'flee';
    addShake(game.fx, 10);
    floatText(game.fx, e.x, CASTLE.top - 18, 'FLAG STOLEN!', '#ff5a4a', 28);
    game.events.push('flag');
    game.stats.leaks += 1;
  }
}

function pickStructure(game) {
  const options = allStructures(game.beach).filter((s) => s.kind !== 'moat');
  return options.length ? options[Math.floor(game.random() * options.length)] : null;
}

function updateGull(game, e, dt) {
  e.phase += dt * 6;
  const kid = game.kid;
  if (e.state === 'flee') {
    e.y -= 200 * dt;
    e.x += (e.x < 640 ? -1 : 1) * 130 * dt;
    if (e.y < game.waterline - 90) e.state = 'dead';
    return;
  }
  if (e.state === 'fly') {
    const diveAtKid = kid.carry >= 1 && kid.stun <= 0;
    if (!diveAtKid && (!e.target || game.beach.cells[e.target.row][e.target.col] !== e.target)) {
      e.target = pickStructure(game);
      if (!e.target) {
        e.state = 'flee';
        return;
      }
    }
    const tx = diveAtKid ? kid.x : cellCentreX(e.target.col);
    const ty = diveAtKid ? kid.y - 30 : cellCentreY(e.target.row) - 30;
    const dx = tx - e.x;
    const dy = ty - e.y;
    const d = Math.hypot(dx, dy);
    if (d < 16) {
      if (diveAtKid) {
        const stolen = Math.ceil(Math.min(kid.carry, 5));
        kid.carry -= stolen;
        floatText(game.fx, kid.x, kid.y - 60, `-${stolen} SAND STOLEN`, '#ff5a4a', 24);
        game.stats.stolen += stolen;
        game.events.push('pinch');
        e.state = 'flee';
      } else {
        e.state = 'peck';
        e.stay = 0;
      }
    } else {
      const sp = diveAtKid ? e.speed * 1.25 : e.speed;
      e.x += (dx / d) * sp * dt;
      e.y += (dy / d) * sp * dt;
    }
    return;
  }
  e.stay += dt;
  e.peck += dt;
  if (!e.target || game.beach.cells[e.target.row][e.target.col] !== e.target || e.stay > 6 * game.mods.gullPeck + 2) {
    e.state = 'fly';
    e.target = null;
    return;
  }
  if (e.peck > 0.5) {
    e.peck = 0;
    damageStructure(game, e.target, 3.2 * game.mods.gullPeck);
    game.events.push('pinch');
  }
}

function updateLog(game, e, dt) {
  e.spin += dt * 3;
  const row = laneRow(e);
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
    game.castle.hp = Math.max(0, game.castle.hp - 20);
    game.castle.flash = 0.35;
    addShake(game.fx, 12);
    floatText(game.fx, e.x, CASTLE.top - 18, '-20 KEEP', '#ff5a4a', 28);
    game.events.push('castle');
    game.stats.leaks += 1;
    e.state = 'dead';
  }
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
