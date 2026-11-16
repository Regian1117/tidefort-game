// The game state and its one update. Everything the rules need lives on the object returned by
// createGame; the simulation never touches the DOM, so the same code runs in attract mode, the
// screenshot scenes and a plain node test. Sound reads `game.events` (cleared by the caller).
import { START_SAND } from './config.js';
import { createBeach, allStructures } from './beach.js';
import { createCastle, isFlagDown, updateCastle } from './castle.js';
import { createMods, applyUpgrade, drawChoices } from './upgrades.js';
import { createFx, updateFx } from './particles.js';
import { updateCombo } from './score.js';
import { updateWaves } from './waves.js';
import { updateEnemies, hurtEnemy } from './enemies.js';
import { updateTowers, updateShells } from './walls.js';
import { advanceTide, beginBuild, startTide, updateTide } from './tides.js';

function freshStats() {
  return {
    blocked: 0, crabs: 0, gulls: 0, logs: 0, patches: 0, perfect: 0, built: 0, lost: 0, leaks: 0,
    scooped: 0, clicks: 0, bestCombo: 0, tideBonus: 0, tidesSurvived: 0,
  };
}

export function createGame(random) {
  const game = {
    random,
    tide: 1, phase: 'build', buildLeft: 0, tideTime: 0, schedule: [], rogueWarning: 0,
    beach: null, castle: null, mods: null, fx: createFx(),
    sand: START_SAND, score: 0, combo: 0, comboTimer: 0, scoopCooldown: 0, tool: 'wall',
    waves: [], enemies: [], shells: [], events: [], taken: [], choices: [], banner: null,
    stats: freshStats(), time: 0,
    structures() {
      return allStructures(game.beach);
    },
    reset() {
      game.tide = 1;
      game.beach = createBeach();
      game.castle = createCastle();
      game.mods = createMods();
      game.fx = createFx();
      game.sand = START_SAND;
      game.score = 0;
      game.combo = 0;
      game.comboTimer = 0;
      game.scoopCooldown = 0;
      game.tool = 'wall';
      game.waves = [];
      game.enemies = [];
      game.shells = [];
      game.events = [];
      game.taken = [];
      game.choices = [];
      game.stats = freshStats();
      game.time = 0;
      beginBuild(game);
    },
  };
  game.reset();
  return game;
}

export function updateGame(game, dt) {
  game.time += dt;
  updateFx(game.fx, game.random, dt);
  updateCastle(game.castle, dt);
  if (game.banner) {
    game.banner.age += dt;
    if (game.banner.age > game.banner.life) game.banner = null;
  }
  if (game.scoopCooldown > 0) game.scoopCooldown = Math.max(0, game.scoopCooldown - dt);
  if (game.phase === 'build') {
    updateTowers(game, dt);
    game.buildLeft -= dt;
    if (game.buildLeft <= 0) startTide(game);
    return;
  }
  if (game.phase !== 'tide') return;
  updateCombo(game, dt);
  updateTide(game, dt);
  if (game.phase !== 'tide') return;
  updateWaves(game, dt);
  updateEnemies(game, dt);
  updateTowers(game, dt);
  updateShells(game, dt, hurtEnemy);
  if (isFlagDown(game.castle)) {
    game.phase = 'lost';
    game.events.push('lose');
  }
}

/** Leave the build phase early (Space). */
export function startTideNow(game) {
  if (game.phase === 'build') startTide(game);
}

/** Deal the three upgrade cards after a tide. */
export function offerUpgrades(game) {
  game.choices = drawChoices(game.random, game.taken);
}

/** Keep one of the offered cards and begin the next build phase. */
export function chooseUpgrade(game, index) {
  const card = game.choices[index];
  if (!card) return false;
  applyUpgrade(game, card);
  game.choices = [];
  advanceTide(game);
  return true;
}

