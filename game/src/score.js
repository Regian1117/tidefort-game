// Score and combo. Perfect patches and squashed pests build the combo; a structure collapsing or
// the combo timer running out breaks it. The combo multiplies every point scored after it.
import { COMBO } from './config.js';
import { floatText } from './particles.js';

export function comboMultiplier(game) {
  return 1 + game.combo * COMBO.step;
}

export function addScore(game, base, x, y, color = '#ffffff') {
  const points = Math.round(base * comboMultiplier(game));
  game.score += points;
  if (x !== undefined) floatText(game.fx, x, y, `+${points}`, color, base >= 60 ? 32 : 24);
  return points;
}

export function bumpCombo(game) {
  game.combo = Math.min(COMBO.max, game.combo + 1);
  game.comboTimer = COMBO.decay;
  if (game.combo > game.stats.bestCombo) game.stats.bestCombo = game.combo;
}

export function breakCombo(game) {
  game.combo = 0;
  game.comboTimer = 0;
}

export function updateCombo(game, dt) {
  if (game.combo > 0) {
    game.comboTimer -= dt;
    if (game.comboTimer <= 0) breakCombo(game);
  }
}
