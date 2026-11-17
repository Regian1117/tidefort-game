// A robot player that uses the same controls a person has: it walks the kid with an intent
// (direction + action) and clicks cells with the mouse functions. It plays attract mode behind the
// title, drives the screenshot scenes, and is what the balance tests use. With `smart` it builds
// from the telegraphed forecast (the lanes the sea will hit hardest first); otherwise it follows a
// fixed layout. `idle` makes it do nothing at all.
import { CASTLE, GRID, KID } from './config.js';
import { allStructures, cellCentreX, cellCentreY, firstDryRow, structureAt } from './beach.js';
import { altClickAt, clickAt, selectTool } from './player.js';
import { startTideNow } from './game.js';
import { forecast, imminentLanes } from './lanes.js';
import { toolCost, upgradeCost } from './walls.js';

const FIXED_LANES = [4, 5, 3, 6, 2, 7, 1, 8, 0, 9];
const PICK_ORDER = ['seaweed', 'wet-sand', 'shell-armour', 'big-bucket', 'tide-chart', 'keep-mend', 'sharp-shells', 'sand-dollars', 'crab-traps', 'flag-charm', 'scarecrow'];

/** The lane (0..9) a pixel x sits in, clamped. */
function laneOf(x) {
  return Math.max(0, Math.min(GRID.cols - 1, Math.floor((x - GRID.x) / GRID.cellW)));
}

export function createAutopilot(options = {}) {
  const interval = options.interval ?? 0.3;
  const pilot = { x: 640, y: 400, clock: 0 };

  /** Ordered build wishes for this tide: { col, row, kind }. */
  function wishes(game) {
    const dry = firstDryRow(game.waterline);
    const last = GRID.rows - 1;
    const list = [];
    if (options.smart === false) {
      for (const col of FIXED_LANES) list.push({ col, row: Math.min(last, dry + 1), kind: 'wall' });
      for (const col of FIXED_LANES) list.push({ col, row: Math.min(last, dry + 2), kind: 'wall' });
      return list;
    }
    const lanes = forecast(game.plan).filter((l) => l.hits > 0 || l.crab || l.log);
    lanes.sort((a, b) => b.peak * Math.max(1, b.hits) - a.peak * Math.max(1, a.hits));
    for (const l of lanes) {
      const row = Math.min(last - 1, dry + 2);
      if (l.peak > 0 && l.peak <= 33 && l.hits === 1 && row - 1 >= dry) list.push({ col: l.lane, row: row - 1, kind: 'moat' });
      else list.push({ col: l.lane, row, kind: 'wall' });
    }
    const crabLane = lanes.find((l) => l.crab);
    if (crabLane) list.splice(2, 0, { col: Math.min(GRID.cols - 1, crabLane.lane + 1), row: last, kind: 'tower' });
    for (const col of FIXED_LANES) list.push({ col, row: Math.min(last - 1, dry + 2), kind: 'wall' });
    return list;
  }

  function mouseTurn(game) {
    for (const w of wishes(game)) {
      if (w.row < firstDryRow(game.waterline)) continue;
      if (structureAt(game.beach, w.col, w.row)) continue;
      if (game.sand < toolCost(w.kind)) return false;
      selectTool(game, w.kind);
      pilot.x = cellCentreX(w.col);
      pilot.y = cellCentreY(w.row);
      return clickAt(game, pilot.x, pilot.y);
    }
    let target = null;
    for (const s of allStructures(game.beach)) {
      const cost = upgradeCost(s);
      if (cost === null || game.sand < cost + 2 || s.kind === 'moat') continue;
      if (!target || s.level < target.level) target = s;
    }
    if (!target) return false;
    pilot.x = cellCentreX(target.col);
    pilot.y = cellCentreY(target.row);
    return altClickAt(game, pilot.x, pilot.y);
  }

  function walk(game, x, y) {
    const kid = game.kid;
    const dx = x - kid.x;
    const dy = y - kid.y;
    const d = Math.hypot(dx, dy);
    game.intent.dx = d > 8 ? dx / d : 0;
    game.intent.dy = d > 8 ? dy / d : 0;
    return d <= 8;
  }

  /** The kid's turn: stay out of the surge, stomp crabs, swat gulls, patch, refill, deposit. */
  function kidTurn(game) {
    const kid = game.kid;
    const intent = game.intent;
    intent.act = false;
    intent.dx = 0;
    intent.dy = 0;
    const danger = imminentLanes(game.schedule, game.tideTime, 2.4);
    for (const w of game.waves) if (w.phase === 'surge') danger.add(w.lane);
    const safeLane = (x) => {
      const c = laneOf(x);
      return !danger.has(c) && !danger.has(c - 1) && !danger.has(c + 1);
    };
    const wet = game.waterline + 26;
    if (kid.stun > 0) return;
    if (!safeLane(kid.x) && kid.y < game.waterline + 110) {
      walk(game, kid.x, game.waterline + 130);
      return;
    }
    let crab = null;
    for (const e of game.enemies) if (e.type === 'crab' && e.state !== 'flee' && (!crab || e.y > crab.y)) crab = e;
    if (crab && Math.hypot(crab.x - kid.x, crab.y - kid.y) < 520 && (safeLane(crab.x) || crab.y > game.waterline + 120)) {
      walk(game, crab.x, crab.y);
      return;
    }
    if (kid.prompt === 'swat') {
      intent.act = true;
      return;
    }
    if (game.sand < 14 && kid.carry >= kid.cap * 0.7 && (options.deposit ?? true)) {
      walk(game, CASTLE.x + CASTLE.width / 2, CASTLE.top - 24);
      intent.act = kid.prompt === 'deposit';
      return;
    }
    let weak = null;
    for (const s of allStructures(game.beach)) {
      if (s.kind === 'moat' || s.hp / s.maxHp > (options.patchBelow ?? 0.7)) continue;
      if (!weak || s.hp / s.maxHp < weak.hp / weak.maxHp) weak = s;
    }
    if (weak && kid.carry >= 2) {
      walk(game, cellCentreX(weak.col), cellCentreY(weak.row) + 24);
      intent.act = kid.prompt === 'patch';
      return;
    }
    const wantFill = weak || kid.carry < kid.cap * 0.6;
    if (wantFill || kid.carry < kid.cap) {
      let fx = weak ? cellCentreX(weak.col) : kid.x;
      for (let k = 0; k < GRID.cols && !safeLane(fx); k += 1) fx += GRID.cellW;
      if (fx > 1200) fx = GRID.x + GRID.cellW / 2;
      const at = walk(game, fx, wet);
      intent.act = kid.prompt === 'fill' && (at || kid.y < wet + 12);
      if (kid.carry >= kid.cap - 0.2 || (weak && kid.carry >= 4) || (!weak && kid.carry >= kid.cap * 0.85)) {
        intent.act = false;
        if (!weak) walk(game, CASTLE.x + CASTLE.width / 2, CASTLE.top - 24);
        else walk(game, cellCentreX(weak.col), cellCentreY(weak.row) + 24);
      }
      return;
    }
    walk(game, CASTLE.x + CASTLE.width / 2, CASTLE.top - 24);
    intent.act = kid.prompt === 'deposit';
  }

  pilot.update = function update(game, dt) {
    if (options.idle) return;
    if (game.phase === 'tide') kidTurn(game);
    else {
      game.intent.dx = 0;
      game.intent.dy = 0;
      game.intent.act = false;
    }
    pilot.clock += dt;
    if (pilot.clock < interval) return;
    pilot.clock = 0;
    if (game.phase === 'build') {
      if (!mouseTurn(game) && game.buildLeft < (options.startAt ?? 20)) startTideNow(game);
    } else if (game.phase === 'tide') mouseTurn(game);
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

  void KID;
  return pilot;
}
