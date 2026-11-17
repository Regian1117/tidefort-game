// The beach kid: the player's body during a tide. Moved with an intent ({ dx, dy, act }) that
// input.js (WASD + Space) and autopilot.js both produce. Space does the one thing that makes
// sense where the kid stands: swat a gull or log, patch a cracked structure, deposit the bucket
// into the castle's stockpile, or fill the bucket at the wet sand line. Walking into a crab
// stomps it. Stand in the surge and you are washed back and spill your bucket.
import { BARS, CASTLE, GRID, KID, PATCH } from './config.js';
import { cellCentreX, cellCentreY, structureAt } from './beach.js';
import { hurtEnemy } from './enemies.js';
import { patchStructure } from './walls.js';
import { frontAt } from './waves.js';
import { addShake, floatText, spawnSplash } from './particles.js';

const FILL_DEPTH = 52;
const SWAT_RANGE = 74;

export function createKid(game) {
  return { x: 640, y: game.waterline + 150, face: 1, carry: 0, cap: KID.carry, stun: 0, cd: 0, anim: 0, prompt: '', acting: '', trail: 0 };
}

export function createIntent() {
  return { dx: 0, dy: 0, act: false };
}

/** The most damaged structure the kid can reach from where it stands, or null. */
function patchTarget(game, kid) {
  let best = null;
  for (let row = 0; row < GRID.rows; row += 1) {
    for (let col = 0; col < GRID.cols; col += 1) {
      const s = structureAt(game.beach, col, row);
      if (!s || s.kind === 'moat' || s.hp >= s.maxHp - 0.5) continue;
      if (Math.abs(cellCentreX(col) - kid.x) > GRID.cellW * 0.62 || Math.abs(cellCentreY(row) + 20 - kid.y) > GRID.cellH * 0.9) continue;
      if (!best || s.hp / s.maxHp < best.hp / best.maxHp) best = s;
    }
  }
  return best;
}

function swatTarget(game, kid) {
  let best = null;
  let bestDist = SWAT_RANGE;
  for (const e of game.enemies) {
    if (e.type === 'crab' || e.state === 'dead' || e.state === 'flee') continue;
    const d = Math.hypot(e.x - kid.x, e.y - kid.y);
    if (d < bestDist) {
      best = e;
      bestDist = d;
    }
  }
  return best;
}

export function kidAtCastle(kid) {
  return kid.y > CASTLE.top - 64 && kid.x > CASTLE.x - 30 && kid.x < CASTLE.x + CASTLE.width + 30;
}

export function kidAtWater(game, kid) {
  return kid.y <= game.waterline + FILL_DEPTH;
}

/** What Space would do right now, for the prompt above the kid. */
function contextAction(game, kid) {
  if (swatTarget(game, kid)) return 'swat';
  if (kid.carry >= PATCH.carry && patchTarget(game, kid)) return 'patch';
  if (kid.carry > 0 && kidAtCastle(kid)) return 'deposit';
  if (kid.carry < kid.cap && kidAtWater(game, kid)) return 'fill';
  return '';
}

export function updateKid(game, dt) {
  const kid = game.kid;
  const intent = game.intent;
  if (kid.cd > 0) kid.cd -= dt;
  kid.acting = '';
  if (kid.stun > 0) {
    kid.stun -= dt;
    kid.prompt = '';
    return;
  }
  let { dx, dy } = intent;
  const len = Math.hypot(dx, dy);
  if (len > 0) {
    dx /= len;
    dy /= len;
    kid.x += dx * KID.speed * dt;
    kid.y += dy * KID.speed * dt;
    kid.anim += dt * 11;
    if (dx !== 0) kid.face = dx > 0 ? 1 : -1;
    kid.trail += dt;
    if (kid.trail > 0.22) {
      kid.trail = 0;
      game.fx.prints.push({ x: kid.x, y: kid.y + 20, face: kid.face, age: 0 });
      if (game.fx.prints.length > 40) game.fx.prints.shift();
    }
  } else kid.anim = 0;
  kid.x = Math.max(26, Math.min(1254, kid.x));
  kid.y = Math.max(game.waterline + 10, Math.min(BARS.bottom - 22, kid.y));

  // Caught by the surge: washed back, bucket spilled.
  if (game.phase === 'tide' && kid.y < frontAt(game, kid.x) - 2) {
    if (kid.carry > 0) floatText(game.fx, kid.x, kid.y - 40, `-${Math.round(kid.carry)} SAND`, '#ff5a4a', 24);
    floatText(game.fx, kid.x, kid.y - 64, 'SPLASHED!', '#ffffff', 28);
    spawnSplash(game.fx, game.random, kid.x, kid.y, 14, 1.2);
    addShake(game.fx, 8);
    kid.carry = 0;
    kid.stun = KID.stun;
    kid.y = Math.min(BARS.bottom - 22, frontAt(game, kid.x) + 50);
    game.stats.splashed += 1;
    game.events.push('splash');
    return;
  }

  // Walking into a crab stomps it.
  for (const e of game.enemies) {
    if (e.type !== 'crab' || e.state === 'dead' || e.state === 'flee') continue;
    if (Math.hypot(e.x - kid.x, e.y - kid.y) < KID.stomp && (e.stompCd ?? 0) <= 0) {
      e.stompCd = 0.45;
      hurtEnemy(game, e, 1, 'click');
    }
  }
  kid.prompt = contextAction(game, kid);
  if (!intent.act) return;
  const todo = kid.prompt;
  if (todo === 'swat' && kid.cd <= 0) {
    kid.cd = 0.3;
    kid.acting = 'swat';
    hurtEnemy(game, swatTarget(game, kid), 1, 'click');
  } else if (todo === 'patch' && kid.cd <= 0) {
    kid.cd = PATCH.cooldown;
    kid.acting = 'patch';
    patchStructure(game, patchTarget(game, kid));
  } else if (todo === 'deposit') {
    const moved = Math.min(kid.carry, KID.fillRate * 2 * dt);
    kid.carry -= moved;
    game.sandFrac = (game.sandFrac ?? 0) + moved;
    while (game.sandFrac >= 1) {
      game.sandFrac -= 1;
      game.sand += 1;
      game.stats.deposited += 1;
    }
    kid.acting = 'deposit';
    if (kid.carry <= 0.01) game.events.push('scoop');
  } else if (todo === 'fill') {
    kid.carry = Math.min(kid.cap, kid.carry + KID.fillRate * dt);
    kid.acting = 'fill';
  }
}
