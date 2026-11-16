// The live game: the screen state machine (title, controls, play, upgrade, pause, win, lose), the
// fixed-step loop, attract mode behind the title, and the glue between input, sound and the rules.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { chooseUpgrade, createGame, offerUpgrades, startTideNow, updateGame } from './game.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createAutopilot } from './autopilot.js';
import { altClickAt, clickAt, scoop, selectTool } from './player.js';
import { toolAt } from './hud.js';
import { upgradeCardRect } from './screens.js';
import {
  paint, SCREEN_CONTROLS, SCREEN_LOSE, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_UPGRADE, SCREEN_WIN,
} from './render.js';

const MAX_FRAME = 0.25;
const TOOL_KEYS = { Digit1: 'wall', Digit2: 'tower', Digit3: 'moat' };

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

export function createApp(canvas, status, fixedSeed) {
  const ctx = canvas.getContext('2d');
  const input = createInput(canvas);
  const audio = createAudio();
  let seedCounter = fixedSeed ?? Math.floor(Math.random() * 4294967296);
  let game = createGame(createRandom(seedCounter));
  let attract = createGame(createRandom(7));
  let pilot = createAutopilot();
  let screen = SCREEN_TITLE;
  let best = readBest();
  let newBest = false;
  let seenControls = false;
  let accumulator = 0;
  let last = performance.now();
  let hover = -1;

  function announce(message) {
    status.textContent = message;
  }

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
  }
  window.addEventListener('resize', resize);
  resize();

  function startRun() {
    seedCounter = (seedCounter + 1) >>> 0;
    game = createGame(createRandom(seedCounter));
    accumulator = 0;
    newBest = false;
    screen = SCREEN_PLAY;
    announce('Tide 1. Build walls with the mouse, then press Space.');
  }

  function finishRun(won) {
    screen = won ? SCREEN_WIN : SCREEN_LOSE;
    if (game.score > best) {
      best = game.score;
      newBest = true;
      saveBest(best);
    }
    announce(won ? `The castle stands. Score ${game.score}.` : `Washed away. Score ${game.score}.`);
  }

  function pointer() {
    return input.pointer.inside ? input.pointer : { x: 640, y: 480 };
  }

  function playClick(e) {
    if (e.button === 2) {
      altClickAt(game, e.x, e.y);
      return;
    }
    const tool = toolAt(e.x, e.y);
    if (tool) {
      selectTool(game, tool);
      audio.play('thud');
      return;
    }
    if (!clickAt(game, e.x, e.y) && e.x > 246 && e.x < 1034 && e.y > 170 && e.y < 652) scoop(game, e.x, e.y);
  }

  function handleInput() {
    for (const e of input.take()) {
      audio.unlock();
      if (e.type === 'key' && e.code === 'KeyM') {
        announce(audio.toggleMute() ? 'Sound off.' : 'Sound on.');
        continue;
      }
      if (screen === SCREEN_TITLE) {
        if (e.type === 'click' || e.code === 'Space' || e.code === 'Enter') {
          if (seenControls) startRun();
          else {
            seenControls = true;
            screen = SCREEN_CONTROLS;
          }
        } else if (e.code === 'KeyC') screen = SCREEN_CONTROLS;
      } else if (screen === SCREEN_CONTROLS) {
        if (e.type === 'click' || e.code === 'Space' || e.code === 'Enter') startRun();
      } else if (screen === SCREEN_PLAY) {
        if (e.type === 'click') playClick(e);
        else if (e.code in TOOL_KEYS) selectTool(game, TOOL_KEYS[e.code]);
        else if (e.code === 'Space' && game.phase === 'build') startTideNow(game);
        else if (e.code === 'Space' || e.code === 'KeyE') scoop(game, pointer().x, pointer().y);
        else if (e.code === 'KeyP' || e.code === 'Escape') {
          screen = SCREEN_PAUSE;
          announce('Paused.');
        } else if (e.code === 'KeyR') startRun();
      } else if (screen === SCREEN_UPGRADE) {
        const pick = e.type === 'click' ? [0, 1, 2].find((i) => inside(upgradeCardRect(i), e)) : { Digit1: 0, Digit2: 1, Digit3: 2 }[e.code];
        if (pick !== undefined && game.choices[pick]) {
          chooseUpgrade(game, pick);
          screen = SCREEN_PLAY;
          audio.play('upgrade');
          announce(`Tide ${game.tide}. Build, then press Space.`);
        }
      } else if (screen === SCREEN_PAUSE) {
        if (e.type === 'click' || e.code === 'KeyP' || e.code === 'Escape' || e.code === 'Space') {
          screen = SCREEN_PLAY;
          announce('Playing.');
        } else if (e.code === 'KeyR') startRun();
      } else if (screen === SCREEN_WIN || screen === SCREEN_LOSE) {
        if (e.type === 'click' || e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter') startRun();
      }
    }
  }

  function inside(r, p) {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }

  function stepAttract() {
    if (attract.phase === 'between') {
      offerUpgrades(attract);
      chooseUpgrade(attract, pilot.pick(attract));
    } else if (attract.phase === 'won' || attract.phase === 'lost') {
      attract = createGame(createRandom(Math.floor(Math.random() * 4294967296)));
      pilot = createAutopilot();
    }
    pilot.update(attract, STEP);
    updateGame(attract, STEP);
    attract.events.length = 0;
  }

  function stepPlay() {
    updateGame(game, STEP);
    for (const name of game.events) audio.play(name);
    game.events.length = 0;
    if (game.phase === 'between') {
      offerUpgrades(game);
      screen = SCREEN_UPGRADE;
      announce('Pick an upgrade.');
    } else if (game.phase === 'won') finishRun(true);
    else if (game.phase === 'lost') finishRun(false);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleInput();
    while (accumulator >= STEP) {
      if (screen === SCREEN_TITLE || screen === SCREEN_CONTROLS) stepAttract();
      else if (screen === SCREEN_PLAY) stepPlay();
      else if (screen === SCREEN_WIN || screen === SCREEN_LOSE || screen === SCREEN_UPGRADE) game.fx.time += STEP;
      accumulator -= STEP;
      if (screen !== SCREEN_PLAY && screen !== SCREEN_TITLE && screen !== SCREEN_CONTROLS) accumulator = 0;
    }
    audio.setMood(screen === SCREEN_PLAY && game.phase === 'tide' ? 'tide' : screen === SCREEN_PAUSE ? 'off' : 'calm');
    if (screen === SCREEN_UPGRADE) hover = [0, 1, 2].find((i) => inside(upgradeCardRect(i), input.pointer)) ?? -1;
    const shown = screen === SCREEN_TITLE || screen === SCREEN_CONTROLS ? attract : game;
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#12a1b8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, (canvas.width - FIELD.width * scale) / 2, (canvas.height - FIELD.height * scale) / 2);
    const cursor = input.pointer.inside ? input.pointer : null;
    paint(ctx, { game: shown, screen, time: now / 1000, cursor, best, newBest, hover });
  }

  // Leaving the tab pauses a running game rather than letting the sea keep rolling unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSE;
      announce('Paused.');
    }
  });

  announce('Tidefort. Press Space or click to start.');
  requestAnimationFrame(frame);
}
