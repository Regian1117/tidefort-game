// The castle at the bottom of the beach: a sand keep with an integrity bar and a flag. Waves that
// get past the grid wear the keep down; once it is gone they take the flag, and the flag falling
// is how the game is lost. Crabs that reach the keep steal flag health too.
import { CASTLE_HP, FLAG_HP } from './config.js';

export function createCastle() {
  return { hp: CASTLE_HP, maxHp: CASTLE_HP, flag: FLAG_HP, maxFlag: FLAG_HP, flash: 0 };
}

/**
 * The sea hits the castle with `power`. Returns what happened: 'keep' when only the keep was worn
 * down, 'flag' when the flag lost health.
 */
export function hitCastle(castle, power) {
  castle.flash = 0.35;
  if (castle.hp > 0) {
    castle.hp = Math.max(0, castle.hp - power * 0.7);
    return 'keep';
  }
  castle.flag = Math.max(0, castle.flag - 1);
  return 'flag';
}

/** A crab steals one point of flag health (it carries the scrap off, so this is not undone). */
export function stealFlag(castle) {
  castle.flash = 0.35;
  castle.flag = Math.max(0, castle.flag - 1);
}

export function repairCastle(castle, amount) {
  castle.hp = Math.min(castle.maxHp, castle.hp + amount);
}

export function isFlagDown(castle) {
  return castle.flag <= 0;
}

export function updateCastle(castle, dt) {
  if (castle.flash > 0) castle.flash = Math.max(0, castle.flash - dt);
}
