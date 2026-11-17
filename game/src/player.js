// What the mouse does: pick a tool, then click a cell to build there, click a structure to upgrade
// it (a right-click upgrades too). The kid's hands (walk, fill, patch, swat) are in kid.js; these
// are driven by input.js in play and by autopilot.js in attract mode and the screenshot scenes.
import { TOOLS } from './config.js';
import { cellAt, structureAt } from './beach.js';
import { buildAt, upgradeStructure } from './walls.js';
import { floatText } from './particles.js';

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

/** Left click at a pixel: build the selected piece on an empty dry cell, or upgrade what is there. */
export function clickAt(game, x, y) {
  if (!canAct(game)) return false;
  const cell = cellAt(x, y);
  if (!cell) return false;
  const s = structureAt(game.beach, cell.col, cell.row);
  if (!s) {
    const r = buildAt(game, cell.col, cell.row, game.tool);
    if (!r.ok) complain(game, x, y, r.reason === 'sand' ? 'NEED SAND' : r.reason === 'water' ? 'UNDER WATER' : '');
    return r.ok;
  }
  const r = upgradeStructure(game, s);
  if (!r.ok) complain(game, x, y, r.reason === 'max' ? 'MAX LEVEL' : 'NEED SAND');
  return r.ok;
}

/** Right click: upgrade the structure under the pixel. */
export function altClickAt(game, x, y) {
  if (!canAct(game)) return false;
  const cell = cellAt(x, y);
  const s = cell ? structureAt(game.beach, cell.col, cell.row) : null;
  if (!s) return false;
  const r = upgradeStructure(game, s);
  if (!r.ok) complain(game, x, y, r.reason === 'max' ? 'MAX LEVEL' : 'NEED SAND');
  return r.ok;
}
