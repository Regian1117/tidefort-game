// What the player's hands do: pick a tool, click the beach (squash a pest, patch, upgrade or
// build), scoop sand with the bucket. All of it works on the game state and is driven by
// input.js in play, and by autopilot.js in attract mode and the screenshot scenes.
import { SCOOP, TOOLS } from './config.js';
import { cellAt, structureAt } from './beach.js';
import { enemyAt, hurtEnemy } from './enemies.js';
import { buildAt, patchStructure, upgradeStructure } from './walls.js';
import { floatText, spawnChunks, spawnSparkle } from './particles.js';

function canAct(game) {
  return game.phase === 'build' || game.phase === 'tide';
}

function complain(game, x, y, text) {
  floatText(game.fx, x, y - 10, text, '#ff5a4a', 22);
  game.events.push('nope');
}

export function selectTool(game, id) {
  if (TOOLS.some((t) => t.id === id)) game.tool = id;
}

export function cycleTool(game, step) {
  const index = TOOLS.findIndex((t) => t.id === game.tool);
  game.tool = TOOLS[(index + step + TOOLS.length) % TOOLS.length].id;
}

/** Left click at a pixel. Pests first, then the cell under it. */
export function clickAt(game, x, y) {
  if (!canAct(game)) return false;
  const pest = game.phase === 'tide' ? enemyAt(game, x, y) : null;
  if (pest) {
    hurtEnemy(game, pest, 1, 'click');
    game.stats.clicks += 1;
    return true;
  }
  const cell = cellAt(x, y);
  if (!cell) return false;
  const s = structureAt(game.beach, cell.col, cell.row);
  if (!s) {
    const r = buildAt(game, cell.col, cell.row, game.tool);
    if (!r.ok && r.reason === 'sand') complain(game, x, y, 'NEED SAND');
    return r.ok;
  }
  if (s.kind !== 'moat' && s.hp < s.maxHp - 0.5) {
    const r = patchStructure(game, s);
    if (!r.ok && r.reason === 'sand') complain(game, x, y, 'NEED SAND');
    return r.ok;
  }
  const r = upgradeStructure(game, s);
  if (!r.ok) complain(game, x, y, r.reason === 'max' ? 'MAX LEVEL' : 'NEED SAND');
  return r.ok;
}

/** Right click: upgrade the structure under the pixel even if it is damaged. */
export function altClickAt(game, x, y) {
  if (!canAct(game)) return false;
  const cell = cellAt(x, y);
  if (!cell) return false;
  const s = structureAt(game.beach, cell.col, cell.row);
  if (!s) return false;
  const r = upgradeStructure(game, s);
  if (!r.ok) complain(game, x, y, r.reason === 'max' ? 'MAX LEVEL' : 'NEED SAND');
  return r.ok;
}

/** Scoop sand at a pixel with the bucket; it needs a moment to refill. */
export function scoop(game, x, y) {
  if (!canAct(game) || game.scoopCooldown > 0) return false;
  game.scoopCooldown = SCOOP.cooldown * game.mods.scoopCooldown;
  const gained = SCOOP.sand + game.mods.scoopBonus;
  game.sand += gained;
  game.stats.scooped += gained;
  floatText(game.fx, x, y - 12, `+${gained} SAND`, '#7a4f1d', 22);
  spawnChunks(game.fx, game.random, x, y, 5);
  spawnSparkle(game.fx, game.random, x, y, 5, '#f4d9a0');
  game.events.push('scoop');
  return true;
}
