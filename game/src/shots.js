// The screenshot scenes behind ?shot=start|play|late|end. Each one plays the real rules forward
// from a fresh game with the robot builder (autopilot.js) until a moment worth photographing, so
// a frame is what the game really looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { chooseUpgrade, createGame, offerUpgrades, updateGame } from './game.js';
import { createAutopilot } from './autopilot.js';
import {
  SCREEN_LOSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_WIN,
} from './render.js';

const LIMIT_SECONDS = 900;

/** Step the robot's game forward until `ready(game)` says the moment has come (or time runs out). */
function playUntil(game, pilot, ready) {
  for (let i = 0; i < LIMIT_SECONDS / STEP; i += 1) {
    if (game.phase === 'between') {
      offerUpgrades(game);
      if (ready(game)) return;
      chooseUpgrade(game, pilot.pick(game));
    }
    if (game.phase === 'won' || game.phase === 'lost') return;
    pilot.update(game, STEP);
    updateGame(game, STEP);
    game.events.length = 0;
    if (ready(game)) return;
  }
}

const SCENES = {
  // The title card over attract mode: tide 3, waves breaking, a crab on the beach.
  start: {
    screen: SCREEN_TITLE,
    ready: (g) => g.tide === 3 && g.phase === 'tide' && g.tideTime > 8 && g.waves.length >= 2 && g.fx.parts.length > 10 && g.enemies.length > 0,
  },
  // Early play: tide 2, the player patching a wall while the waves hit.
  play: {
    screen: SCREEN_PLAY,
    ready: (g) => g.tide === 2 && g.phase === 'tide' && g.tideTime > 10 && g.waves.length >= 2 && g.fx.parts.length > 10 && g.combo > 0,
  },
  // Late play: the fort at the end of tide 6, choosing an upgrade.
  late: {
    screen: SCREEN_UPGRADE,
    ready: (g) => g.tide === 6 && g.phase === 'between',
  },
  // Not a handed-in shot, a check: the rogue wave warning on tide 7.
  rogue: {
    screen: SCREEN_PLAY,
    ready: (g) => g.tide === 7 && g.phase === 'tide' && g.rogueWarning > 0.5 && g.rogueWarning < 3,
  },
  // Not a handed-in shot, a check: the lose screen when nobody builds anything.
  lose: {
    screen: SCREEN_LOSE,
    idle: true,
    ready: (g) => g.phase === 'lost',
  },
  // The ending: the win screen after tide 7.
  end: {
    screen: SCREEN_WIN,
    ready: (g) => g.phase === 'won' || g.phase === 'lost',
  },
};

/** Stage the named scene; returns what to paint: { game, screen, cursor, best, newBest, hover }. */
export function stageShot(name, seed) {
  const scene = SCENES[name] ?? SCENES.start;
  const game = createGame(createRandom(seed));
  const pilot = createAutopilot(scene.idle ? { interval: 1e9 } : {});
  playUntil(game, pilot, scene.ready);
  if (game.phase === 'between' && game.choices.length === 0) offerUpgrades(game);
  const screen = name === 'end' && game.phase === 'lost' ? SCREEN_LOSE : scene.screen;
  return {
    game,
    screen,
    cursor: name === 'end' || name === 'lose' ? null : name === 'late' ? { x: 724, y: 476 } : { x: pilot.x, y: pilot.y },
    best: name === 'end' ? Math.max(game.score - 4200, 0) : 18450,
    newBest: name === 'end',
    hover: 1,
  };
}
