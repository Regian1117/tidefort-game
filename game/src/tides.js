// The rhythm of a run: build phase (a countdown to place sand, with the tide's plan on show),
// then the tide (a timed schedule of waves and pests), then the pick-an-upgrade pause. Each tide the
// resting waterline creeps up the beach and claims the rows it covers. Tide 7 ends in a win.
// The next tide's plan is rolled as soon as a tide ends, so the pick-an-upgrade screen can show it.
import { BUILD_BONUS_SAND, BUILD_SECONDS, FIRST_BUILD_SECONDS, GRID, SCORE, TOTAL_TIDES } from './config.js';
import { allStructures, cellCentreX, cellCentreY, firstDryRow, waterlineFor } from './beach.js';
import { spawnWave } from './waves.js';
import { spawnCrab, spawnGull, spawnLog } from './enemies.js';
import { repairCastle } from './castle.js';
import { addScore } from './score.js';
import { addShake, floatText, spawnChunks, spawnSparkle } from './particles.js';
import { planFor, rollPlan, WARN_LEAD } from './lanes.js';

export { planFor };

export function beginBuild(game) {
  game.phase = 'build';
  game.buildLeft = game.tide === 1 ? FIRST_BUILD_SECONDS : BUILD_SECONDS;
  game.waterline = waterlineFor(game.tide);
  if (game.plan.length === 0) game.plan = rollPlan(game, game.tide);
  if (game.tide > 1) game.sand += BUILD_BONUS_SAND + game.mods.buildBonus;
  // The risen sea claims the rows it now covers; some of the sand comes back.
  const dry = firstDryRow(game.waterline);
  let claimed = 0;
  for (const s of allStructures(game.beach)) {
    if (s.row >= dry) continue;
    game.beach.cells[s.row][s.col] = null;
    claimed += 1;
    game.sand += 4;
    spawnChunks(game.fx, game.random, cellCentreX(s.col), cellCentreY(s.row), 8, true);
  }
  if (claimed) floatText(game.fx, 640, game.waterline + 40, `THE SEA CLAIMED ${claimed}`, '#ff5a4a', 30);
  game.banner = { text: `TIDE ${game.tide} IS COMING`, sub: 'Read the arrows, build, then press ENTER', age: 0, life: 3.4 };
  game.events.push('build-phase');
}

export function startTide(game) {
  game.phase = 'tide';
  game.tideTime = 0;
  game.schedule = game.plan.slice();
  game.banner = { text: `TIDE ${game.tide} / ${TOTAL_TIDES}`, sub: 'WASD move, SPACE fill / patch / swat', age: 0, life: 2.6 };
  game.events.push('tide-start');
}

function fireEvent(game, ev) {
  if (ev.kind === 'wave') spawnWave(game, ev.lane, ev.power);
  else if (ev.kind === 'crab') spawnCrab(game, ev.lane);
  else if (ev.kind === 'gull') spawnGull(game);
  else if (ev.kind === 'log') spawnLog(game, ev.lane);
  else if (ev.kind === 'warn') {
    game.banner = { text: 'ROGUE WAVE INCOMING', sub: 'It hits every lane at once - brace the beach!', age: 0, life: WARN_LEAD, alert: true };
    game.rogueWarning = WARN_LEAD;
    game.events.push('warn');
  } else if (ev.kind === 'rogue') {
    for (let lane = 0; lane < GRID.cols; lane += 1) spawnWave(game, lane, ev.power * (0.94 + game.random() * 0.12), true);
    addShake(game.fx, 10);
    game.events.push('rogue');
  }
}

export function updateTide(game, dt) {
  game.tideTime += dt;
  if (game.rogueWarning > 0) game.rogueWarning = Math.max(0, game.rogueWarning - dt);
  while (game.schedule.length && game.schedule[0].t <= game.tideTime) fireEvent(game, game.schedule.shift());
  const seconds = planFor(game.tide).seconds;
  const quiet = game.schedule.length === 0 && game.waves.length === 0 && game.enemies.length === 0;
  if (game.tideTime >= seconds && (quiet || game.tideTime >= seconds + 14)) finishTide(game);
}

/** Time left on the tide clock, in seconds, never below zero. */
export function tideTimeLeft(game) {
  return Math.max(0, planFor(game.tide).seconds - game.tideTime);
}

function finishTide(game) {
  game.waves = [];
  game.enemies = [];
  game.shells = [];
  game.schedule = [];
  game.stats.tideBonus += addScore(game, SCORE.tide * game.tide, 640, 330, '#ffd23f');
  for (const s of allStructures(game.beach)) {
    if (s.kind === 'moat') continue;
    s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.15);
    spawnSparkle(game.fx, game.random, cellCentreX(s.col), cellCentreY(s.row), 3, '#ffffff');
  }
  repairCastle(game.castle, 22);
  game.stats.tidesSurvived = game.tide;
  game.events.push('tide-end');
  if (game.tide >= TOTAL_TIDES) {
    game.score += game.castle.flag * SCORE.flagHp + Math.round(game.castle.hp) * SCORE.castleHp;
    game.phase = 'won';
    game.events.push('win');
    return;
  }
  game.phase = 'between';
  game.plan = rollPlan(game, game.tide + 1);
}

export function advanceTide(game) {
  game.tide += 1;
  beginBuild(game);
}
