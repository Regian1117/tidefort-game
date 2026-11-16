// The rhythm of a run: build phase (a countdown to place sand), then the tide (a timed schedule of
// waves and pests), then the pick-an-upgrade pause. Tide 7 ends in a win. The schedule for a tide
// is rolled once at its start from the game's seeded random.
import { BUILD_BONUS_SAND, BUILD_SECONDS, GRID, SCORE, TIDE_PLAN, TOTAL_TIDES } from './config.js';
import { allStructures, cellCentreX, cellCentreY } from './beach.js';
import { spawnWave, wavePowerFor } from './waves.js';
import { spawnCrab, spawnGull, spawnLog } from './enemies.js';
import { repairCastle } from './castle.js';
import { addScore } from './score.js';
import { addShake, spawnSparkle } from './particles.js';

const FIRST_BUILD_SECONDS = 30;
const ROGUE_TIMES = [14, 30, 46];
const ROGUE_POWER = [44, 70, 100];
const WARN_LEAD = 4;

export function planFor(tide) {
  return TIDE_PLAN[Math.min(tide, TOTAL_TIDES) - 1];
}

export function beginBuild(game) {
  game.phase = 'build';
  game.buildLeft = game.tide === 1 ? FIRST_BUILD_SECONDS : BUILD_SECONDS;
  game.banner = { text: `TIDE ${game.tide} IS COMING`, sub: 'Build with the mouse, then press SPACE', age: 0, life: 3 };
  if (game.tide > 1) game.sand += BUILD_BONUS_SAND + game.mods.buildBonus;
  game.events.push('build-phase');
}

function rollSchedule(game) {
  const plan = planFor(game.tide);
  const r = game.random;
  const events = [];
  const power = wavePowerFor(game.tide);
  let made = 0;
  while (made < plan.waves) {
    const t = 1.5 + (made / plan.waves) * (plan.seconds - 8) + r() * 1.4;
    const lane = Math.floor(r() * GRID.cols);
    events.push({ t, kind: 'wave', lane, power: power * (0.85 + r() * 0.35) });
    made += 1;
    if (made < plan.waves && r() < 0.28 + game.tide * 0.03) {
      const lane2 = Math.min(GRID.cols - 1, Math.max(0, lane + (r() < 0.5 ? 1 : -1)));
      events.push({ t: t + 0.15, kind: 'wave', lane: lane2, power: power * (0.85 + r() * 0.3) });
      made += 1;
    }
  }
  const spread = (n, kind, from) => {
    for (let i = 0; i < n; i += 1) events.push({ t: from + (i / n) * (plan.seconds - from - 10) + r() * 2, kind });
  };
  spread(plan.crabs, 'crab', 5);
  spread(plan.gulls, 'gull', 9);
  spread(plan.logs, 'log', 7);
  for (let i = 0; i < plan.rogue; i += 1) {
    events.push({ t: ROGUE_TIMES[i] - WARN_LEAD, kind: 'warn', index: i });
    events.push({ t: ROGUE_TIMES[i], kind: 'rogue', index: i });
  }
  events.sort((a, b) => a.t - b.t);
  return events;
}

export function startTide(game) {
  game.phase = 'tide';
  game.tideTime = 0;
  game.schedule = rollSchedule(game);
  game.banner = { text: `TIDE ${game.tide} / ${TOTAL_TIDES}`, sub: 'Patch, scoop, squash the pests!', age: 0, life: 2.4 };
  game.events.push('tide-start');
}

function fireEvent(game, ev) {
  if (ev.kind === 'wave') spawnWave(game, ev.lane, ev.power);
  else if (ev.kind === 'crab') spawnCrab(game);
  else if (ev.kind === 'gull') spawnGull(game);
  else if (ev.kind === 'log') spawnLog(game);
  else if (ev.kind === 'warn') {
    game.banner = { text: 'ROGUE WAVE INCOMING', sub: 'Brace the lanes - it hits every lane at once', age: 0, life: WARN_LEAD, alert: true };
    game.rogueWarning = WARN_LEAD;
    game.events.push('warn');
  } else if (ev.kind === 'rogue') {
    for (let lane = 0; lane < GRID.cols; lane += 1) spawnWave(game, lane, ROGUE_POWER[ev.index] * (0.92 + game.random() * 0.16), true);
    addShake(game.fx, 8);
    game.events.push('rogue');
  }
}

export function updateTide(game, dt) {
  game.tideTime += dt;
  if (game.rogueWarning > 0) game.rogueWarning = Math.max(0, game.rogueWarning - dt);
  while (game.schedule.length && game.schedule[0].t <= game.tideTime) fireEvent(game, game.schedule.shift());
  const plan = planFor(game.tide);
  const quiet = game.schedule.length === 0 && game.waves.length === 0 && game.enemies.length === 0;
  if (game.tideTime >= plan.seconds && (quiet || game.tideTime >= plan.seconds + 14)) finishTide(game);
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
  const bonus = addScore(game, SCORE.tide * game.tide, 640, 300, '#ffd23f');
  game.stats.tideBonus += bonus;
  // The sea draws back: every structure dries and firms up a little.
  for (const s of allStructures(game.beach)) {
    if (s.kind === 'moat') continue;
    s.hp = Math.min(s.maxHp, s.hp + s.maxHp * 0.2);
    spawnSparkle(game.fx, game.random, cellCentreX(s.col), cellCentreY(s.row), 4, '#ffffff');
  }
  repairCastle(game.castle, 8);
  game.stats.tidesSurvived = game.tide;
  game.events.push('tide-end');
  if (game.tide >= TOTAL_TIDES) {
    game.score += game.castle.flag * SCORE.flagHp + Math.round(game.castle.hp) * SCORE.castleHp;
    game.phase = 'won';
    game.events.push('win');
  } else {
    game.phase = 'between';
  }
}

export function advanceTide(game) {
  game.tide += 1;
  beginBuild(game);
}
