// The screenshot scenes behind ?shot=start|play|late|end. Each one plays the real rules forward
// from a fresh game with the robot (autopilot.js: same controls as a person) until a moment that
// shows what the caption promises, then stops. If that moment never comes the scene throws, so a
// wrong picture is never taken quietly. The same seed always gives the same frame.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { chooseUpgrade, createGame, offerUpgrades, updateGame } from './game.js';
import { createAutopilot } from './autopilot.js';
import { SCREEN_LOSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_WIN } from './render.js';

const LIMIT_SECONDS = 1200;

/** The title card sits over this rectangle; the wave must break outside it to be seen. */
const TITLE_PANEL = { x: 280, y: 88, w: 720, h: 176 };

const surging = (g, minY, minPower) => g.waves.some((w) => w.phase === 'surge' && w.y > minY && w.power >= minPower);
const splashesBelow = (g, y) => g.fx.parts.filter((p) => p.kind === 'drop' && p.y > y).length;

const SCENES = {
  // The title over attract mode: a big wave crashing on the fort, well below the title card.
  start: {
    screen: SCREEN_TITLE,
    ready: (g) => g.tide >= 4 && g.phase === 'tide' && g.structures().length >= 10 && splashesBelow(g, TITLE_PANEL.y + TITLE_PANEL.h + 40) >= 18 && surging(g, g.waterline + 90, 34),
  },
  // Early play: the kid patching a crack while a wave surges, the lanes telegraphed.
  play: {
    screen: SCREEN_PLAY,
    ready: (g) => g.tide >= 2 && g.tide <= 3 && g.phase === 'tide' && g.kid.acting === 'patch' && surging(g, g.waterline + 70, 18) && g.schedule.length > 3,
  },
  // Late play: the end of tide 6, a lane still flooded, the rogue wave next, the upgrade choice.
  late: {
    screen: SCREEN_UPGRADE,
    ready: (g) => g.tide === 6 && g.phase === 'between' && g.beach.flood.flat().filter((t) => t > 0.3).length >= 2,
  },
  // Not a handed-in shot, a check: the rogue wave warning on tide 7.
  rogue: {
    screen: SCREEN_PLAY,
    ready: (g) => g.tide === 7 && g.phase === 'tide' && g.rogueWarning > 0.5 && g.rogueWarning < 3,
  },
  // Not a handed-in shot, a check: the lose screen when nobody plays.
  lose: { screen: SCREEN_LOSE, idle: true, ready: (g) => g.phase === 'lost' },
  // The ending: the win screen after tide 7.
  end: { screen: SCREEN_WIN, ready: (g) => g.phase === 'won' },
};

/** Step the robot's game until `ready(game)`; true when it came, false when the run ended or time ran out. */
function playUntil(game, pilot, ready) {
  for (let i = 0; i < LIMIT_SECONDS / STEP; i += 1) {
    if (game.phase === 'between') {
      offerUpgrades(game);
      if (ready(game)) return true;
      chooseUpgrade(game, pilot.pick(game));
    }
    if (game.phase === 'won' || game.phase === 'lost') return ready(game);
    pilot.update(game, STEP);
    updateGame(game, STEP);
    game.events.length = 0;
    if (ready(game)) return true;
  }
  return false;
}

/** Stage the named scene; returns what to paint: { game, screen, cursor, best, newBest, hover }. */
export function stageShot(name, seed) {
  const scene = SCENES[name] ?? SCENES.start;
  const game = createGame(createRandom(seed));
  const pilot = createAutopilot(scene.idle ? { idle: true } : {});
  if (!playUntil(game, pilot, scene.ready)) throw new Error(`shot "${name}" (seed ${seed}): its moment never came`);
  if (game.phase === 'between' && game.choices.length === 0) offerUpgrades(game);
  return {
    game,
    screen: scene.screen,
    cursor: name === 'late' ? { x: 796, y: 196 } : name === 'play' ? { x: pilot.x, y: pilot.y } : null,
    best: name === 'end' ? Math.max(game.score - 4200, 0) : 18450,
    newBest: name === 'end',
    hover: 1,
  };
}
