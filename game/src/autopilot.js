// A simple robot player. It plays attract mode behind the title screen and drives the screenshot
// scenes, and the same code is what balances the tides in testing. Every `interval` seconds it
// does one thing a hand could do: squash a pest, patch the weakest structure, build or upgrade the
// next item on a fixed plan, or scoop sand. Its mouse position is exposed for the cursor.
import { GRID } from './config.js';
import { allStructures, cellCentreX, cellCentreY, structureAt } from './beach.js';
import { altClickAt, clickAt, scoop, selectTool } from './player.js';
import { startTideNow } from './game.js';
import { toolCost, upgradeCost } from './walls.js';

const LANE_ORDER = [5, 6, 4, 7, 3, 8, 2, 9, 1, 10, 0, 11];

/** The order a sensible player fills the beach in. */
function buildPlan() {
  const plan = [];
  for (const col of LANE_ORDER.slice(0, 6)) plan.push({ col, row: 2, kind: 'wall' });
  plan.push({ col: 3, row: 3, kind: 'tower' }, { col: 8, row: 3, kind: 'tower' });
  for (const col of LANE_ORDER.slice(6)) plan.push({ col, row: 2, kind: 'wall' });
  for (const col of [4, 7]) plan.push({ col, row: 0, kind: 'moat' });
  plan.push({ col: 5, row: 3, kind: 'tower' });
  for (const col of LANE_ORDER) plan.push({ col, row: 1, kind: 'wall' });
  for (const col of [1, 10, 6, 5]) plan.push({ col, row: 0, kind: 'moat' });
  for (const col of LANE_ORDER) plan.push({ col, row: 3, kind: 'wall' });
  return plan;
}

const PICK_ORDER = ['seaweed', 'wet-sand', 'shell-armour', 'tide-chart', 'keep-mend', 'sharp-shells', 'sand-dollars', 'big-bucket', 'crab-traps', 'flag-charm', 'scarecrow'];

export function createAutopilot(options = {}) {
  const interval = options.interval ?? 0.35;
  const plan = buildPlan();
  const pilot = { x: 640, y: 360, clock: 0, last: 'idle' };

  function moveTo(x, y) {
    pilot.x = x;
    pilot.y = y;
  }

  function squashNearest(game) {
    let best = null;
    for (const e of game.enemies) {
      if (e.state === 'dead' || e.state === 'flee') continue;
      if (!best || e.y > best.y) best = e;
    }
    if (!best) return false;
    moveTo(best.x, best.y);
    return clickAt(game, best.x, best.y);
  }

  function patchWeakest(game) {
    let weakest = null;
    for (const s of allStructures(game.beach)) {
      if (s.kind === 'moat') continue;
      const ratio = s.hp / s.maxHp;
      if (ratio < (options.patchBelow ?? 0.55) && (!weakest || ratio < weakest.hp / weakest.maxHp)) weakest = s;
    }
    if (!weakest || game.sand < 2) return false;
    moveTo(cellCentreX(weakest.col), cellCentreY(weakest.row));
    return clickAt(game, pilot.x, pilot.y);
  }

  function buildNext(game) {
    for (const item of plan) {
      const s = structureAt(game.beach, item.col, item.row);
      if (!s) {
        if (game.sand < toolCost(item.kind)) return false;
        selectTool(game, item.kind);
        moveTo(cellCentreX(item.col), cellCentreY(item.row));
        return clickAt(game, pilot.x, pilot.y);
      }
    }
    return false;
  }

  function upgradeSome(game) {
    let target = null;
    for (const s of allStructures(game.beach)) {
      const cost = upgradeCost(s);
      if (cost === null || game.sand < cost + 4) continue;
      if (s.kind === 'moat') continue;
      const score = (s.kind === 'tower' ? 2 : 0) + (3 - s.level) - Math.abs(s.col - 5.5) * 0.05;
      if (!target || score > target.score) target = { s, score };
    }
    if (!target) return false;
    moveTo(cellCentreX(target.s.col), cellCentreY(target.s.row));
    return altClickAt(game, pilot.x, pilot.y);
  }

  function scoopSomewhere(game) {
    moveTo(GRID.x + 120 + ((game.time * 90) % 500), GRID.y + 4 * GRID.cell + 20);
    return scoop(game, pilot.x, pilot.y);
  }

  pilot.update = function update(game, dt) {
    pilot.clock += dt;
    if (pilot.clock < interval) return;
    pilot.clock = 0;
    if (game.phase === 'build') {
      if (!buildNext(game) && !upgradeSome(game)) {
        if (game.sand < 14 || game.buildLeft > 6) scoopSomewhere(game);
        else if (options.eager !== false && game.buildLeft < 14) startTideNow(game);
      }
      return;
    }
    if (game.phase !== 'tide') return;
    if (squashNearest(game)) return;
    if (patchWeakest(game)) return;
    if (buildNext(game)) return;
    if (game.sand > 24 && upgradeSome(game)) return;
    scoopSomewhere(game);
  };

  /** Pick the best card from the offered three. */
  pilot.pick = function pick(game) {
    let best = 0;
    let bestRank = 99;
    game.choices.forEach((card, index) => {
      const rank = PICK_ORDER.indexOf(card.id);
      if (rank < bestRank) {
        bestRank = rank;
        best = index;
      }
    });
    return best;
  };

  return pilot;
}
