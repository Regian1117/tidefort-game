// One function that paints a whole frame: the beach scene, then the HUD, then the overlay for
// whichever screen is up. The live loop and the screenshot scenes both call it, so a screenshot is
// the real renderer's output.
import { FIELD } from './config.js';
import { drawCursor } from './draw.js';
import { drawScene } from './scene.js';
import { drawHud } from './hud.js';
import { drawControls, drawEnd, drawPause, drawTitle, drawUpgradePick } from './screens.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_CONTROLS = 'controls';
export const SCREEN_PLAY = 'play';
export const SCREEN_UPGRADE = 'upgrade';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

/**
 * Paint `frame` = { game, screen, time, cursor, best, newBest, hover } on a context whose
 * transform already maps the 1280x720 play space onto the canvas.
 */
export function paint(ctx, frame) {
  const { game, screen, time } = frame;
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  const view = { time, cursor: screen === SCREEN_PLAY || screen === SCREEN_TITLE ? frame.cursor : null };
  drawScene(ctx, game, view);
  drawHud(ctx, game, view);
  if (screen === SCREEN_TITLE) drawTitle(ctx, time, frame.best);
  else if (screen === SCREEN_CONTROLS) drawControls(ctx, time);
  else if (screen === SCREEN_UPGRADE) drawUpgradePick(ctx, game, time, frame.hover);
  else if (screen === SCREEN_PAUSE) drawPause(ctx, time);
  else if (screen === SCREEN_WIN) drawEnd(ctx, game, frame.best, true, time, frame.newBest);
  else if (screen === SCREEN_LOSE) drawEnd(ctx, game, frame.best, false, time, frame.newBest);
  if (frame.cursor) drawCursor(ctx, frame.cursor.x, frame.cursor.y);
}
