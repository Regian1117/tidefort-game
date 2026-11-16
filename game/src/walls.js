// Structures on the beach: build, upgrade, patch, take damage, and the towers' shooting. A wall
// holds a lane, a tower shoots crabs and gulls, a moat drains the waves that cross it.
import { GRID, PATCH, STRUCTURE, TOOLS } from './config.js';
import { cellCentreX, cellCentreY, structureAt } from './beach.js';
import { spawnChunks, spawnFoam, spawnSparkle, floatText, addShake } from './particles.js';
import { addScore, breakCombo, bumpCombo } from './score.js';

export function maxHpOf(game, kind, level) {
  return STRUCTURE[kind].hp[level - 1] * (kind === 'moat' ? 1 : game.mods.hpScale);
}

export function toolCost(id) {
  return TOOLS.find((t) => t.id === id).cost;
}

export function upgradeCost(s) {
  return s.level >= 3 ? null : STRUCTURE[s.kind].upgrade[s.level];
}

/** Place a new structure; returns { ok, reason }. */
export function buildAt(game, col, row, kind) {
  if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) return { ok: false, reason: 'off' };
  if (structureAt(game.beach, col, row)) return { ok: false, reason: 'taken' };
  const cost = toolCost(kind);
  if (game.sand < cost) return { ok: false, reason: 'sand' };
  game.sand -= cost;
  const hp = maxHpOf(game, kind, 1);
  const s = { kind, level: 1, col, row, hp, maxHp: hp, flash: 0, reload: 0.6, aim: 0, bob: 0 };
  game.beach.cells[row][col] = s;
  game.stats.built += 1;
  const x = cellCentreX(col);
  const y = cellCentreY(row);
  spawnChunks(game.fx, game.random, x, y + 16, 8);
  spawnFoam(game.fx, game.random, x, y, 2);
  game.events.push('build');
  return { ok: true };
}

export function upgradeStructure(game, s) {
  const cost = upgradeCost(s);
  if (cost === null) return { ok: false, reason: 'max' };
  if (game.sand < cost) return { ok: false, reason: 'sand' };
  game.sand -= cost;
  s.level += 1;
  const next = maxHpOf(game, s.kind, s.level);
  s.hp = Math.min(next, s.hp + (next - s.maxHp));
  s.maxHp = next;
  s.flash = 0.25;
  spawnSparkle(game.fx, game.random, cellCentreX(s.col), cellCentreY(s.row), 8, '#ffd23f');
  floatText(game.fx, cellCentreX(s.col), cellCentreY(s.row) - 20, `LEVEL ${s.level}`, '#ffd23f', 24);
  game.events.push('upgrade');
  return { ok: true };
}

/** Pat a damaged structure back into shape. A patch made just before it falls is a perfect one. */
export function patchStructure(game, s) {
  if (s.kind === 'moat' || s.hp >= s.maxHp - 0.5) return { ok: false, reason: 'whole' };
  if (game.sand < PATCH.cost) return { ok: false, reason: 'sand' };
  game.sand -= PATCH.cost;
  const perfect = s.hp / s.maxHp < PATCH.perfectBelow;
  s.hp = Math.min(s.maxHp, s.hp + s.maxHp * PATCH.heal);
  s.flash = 0.2;
  game.stats.patches += 1;
  const x = cellCentreX(s.col);
  const y = cellCentreY(s.row);
  spawnChunks(game.fx, game.random, x, y, 6);
  if (perfect) {
    bumpCombo(game);
    game.stats.perfect += 1;
    addScore(game, PATCH.perfectBonus, x, y - 28, '#ffd23f');
    floatText(game.fx, x, y - 54, 'PERFECT PATCH', '#ffffff', 22);
    spawnSparkle(game.fx, game.random, x, y, 10, '#ffffff');
    game.events.push('perfect');
  } else {
    game.events.push('patch');
  }
  return { ok: true, perfect };
}

/** A hit on a structure. Returns { destroyed, dealt }. */
export function damageStructure(game, s, power) {
  if (s.kind === 'moat') return { destroyed: false, dealt: 0 };
  const dealt = Math.max(1, power * game.mods.erosion - game.mods.armour);
  s.hp -= dealt;
  s.flash = 0.18;
  const x = cellCentreX(s.col);
  const y = cellCentreY(s.row);
  spawnChunks(game.fx, game.random, x, y, 5 + Math.min(8, Math.round(dealt / 6)));
  addShake(game.fx, 3 + Math.min(7, dealt / 5));
  if (s.hp > 0) {
    game.events.push('hit');
    return { destroyed: false, dealt };
  }
  game.beach.cells[s.row][s.col] = null;
  game.stats.lost += 1;
  spawnChunks(game.fx, game.random, x, y, 22, true);
  spawnFoam(game.fx, game.random, x, y, 6);
  addShake(game.fx, 11);
  breakCombo(game);
  floatText(game.fx, x, y - 20, 'CRUMBLED', '#ff5a4a', 24);
  game.events.push('crumble');
  return { destroyed: true, dealt };
}

/** Towers pick the nearest pest in range and throw a shell at it. */
export function updateTowers(game, dt) {
  for (let row = 0; row < GRID.rows; row += 1) {
    for (let col = 0; col < GRID.cols; col += 1) {
      const s = game.beach.cells[row][col];
      if (!s) continue;
      if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
      if (s.kind !== 'tower') continue;
      s.reload -= dt;
      if (s.reload > 0) continue;
      const range = STRUCTURE.tower.range * GRID.cell;
      const tx = cellCentreX(col);
      const ty = cellCentreY(row);
      let best = null;
      let bestDist = range;
      for (const e of game.enemies) {
        if (e.state === 'dead' || e.state === 'flee') continue;
        const d = Math.hypot(e.x - tx, e.y - ty);
        if (d < bestDist) {
          bestDist = d;
          best = e;
        }
      }
      if (!best) continue;
      s.reload = STRUCTURE.tower.reload[s.level - 1] * game.mods.towerRate;
      s.aim = Math.atan2(best.y - ty, best.x - tx);
      game.shells.push({ x: tx, y: ty - 10, target: best, damage: STRUCTURE.tower.damage[s.level - 1], life: 1.2 });
      game.events.push('shoot');
    }
  }
}

/** Shells fly at their target and land with a small pop. */
export function updateShells(game, dt, hurtEnemy) {
  for (let i = game.shells.length - 1; i >= 0; i -= 1) {
    const sh = game.shells[i];
    sh.life -= dt;
    const t = sh.target;
    if (t.state === 'dead' || sh.life <= 0) {
      game.shells.splice(i, 1);
      continue;
    }
    const dx = t.x - sh.x;
    const dy = t.y - sh.y;
    const dist = Math.hypot(dx, dy);
    const step = 520 * dt;
    if (dist <= step + 10) {
      hurtEnemy(game, t, sh.damage, 'shell');
      game.shells.splice(i, 1);
    } else {
      sh.x += (dx / dist) * step;
      sh.y += (dy / dist) * step;
    }
  }
}
