// Draws the sea as one continuous body of water whose edge follows the game's water front: the
// resting waterline (which creeps up the beach every tide) plus every surge, blended across the
// lanes so a wave has shoulders. A foam line, spray blobs and a dark wet-sand band ride the edge;
// cells the water got through are tinted blue; a rogue wave casts a shadow before it arrives.
import { BARS, FIELD, GRID, PALETTE, WATERLINE } from './config.js';
import { cellLeft, cellTop } from './beach.js';
import { roundRectPath } from './draw.js';
import { WARN_LEAD } from './lanes.js';

/** The displayed front per lane eases toward the true one so the water never teleports. */
function shownFronts(game, time) {
  const fx = game.fx;
  if (!fx.shown) {
    fx.shown = game.front.slice();
    fx.shownLast = time;
  }
  const dt = Math.max(0, Math.min(0.1, time - fx.shownLast));
  fx.shownLast = time;
  for (let c = 0; c < GRID.cols; c += 1) {
    const target = game.front[c];
    const k = target > fx.shown[c] ? 22 : 9;
    fx.shown[c] += (target - fx.shown[c]) * Math.min(1, dt * k);
  }
  fx.waterShown = fx.waterShown === undefined ? game.waterline : fx.waterShown + (game.waterline - fx.waterShown) * Math.min(1, dt * 3);
  return fx.shown;
}

/** Height of the water's edge at pixel x. */
export function surfaceAt(game, x, time) {
  const shown = game.fx.shown ?? game.front;
  const rest = game.fx.waterShown ?? game.waterline;
  const f = (x - GRID.x) / GRID.cellW - 0.5;
  let y;
  if (f <= 0 || f >= GRID.cols - 1) {
    const edge = shown[f <= 0 ? 0 : GRID.cols - 1];
    const away = f <= 0 ? -f : f - (GRID.cols - 1);
    y = rest + (edge - rest) * Math.max(0, 1 - away * 0.7);
  } else {
    const i = Math.floor(f);
    const s = (1 - Math.cos((f - i) * Math.PI)) / 2;
    y = shown[i] * (1 - s) + shown[i + 1] * s;
  }
  return y + Math.sin(x * 0.021 + time * 2.1) * WATERLINE.bob + Math.sin(x * 0.047 - time * 3.3) * 2.2;
}

export function drawSea(ctx, game, time) {
  shownFronts(game, time);
  const rest = game.fx.waterShown;
  const xs = [];
  for (let x = 0; x <= FIELD.width + 8; x += 8) xs.push(x);
  const ys = xs.map((x) => surfaceAt(game, x, time));

  // wet sand just beyond the edge
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  xs.forEach((x, i) => (i === 0 ? ctx.moveTo(x, ys[i] + 16) : ctx.lineTo(x, ys[i] + 16)));
  ctx.strokeStyle = 'rgba(160, 105, 52, 0.38)';
  ctx.lineWidth = 46;
  ctx.stroke();
  ctx.restore();

  // the water body
  ctx.beginPath();
  ctx.moveTo(0, BARS.top);
  ctx.lineTo(FIELD.width, BARS.top);
  for (let i = xs.length - 1; i >= 0; i -= 1) ctx.lineTo(xs[i], ys[i]);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, BARS.top, 0, rest + 70);
  grad.addColorStop(0, PALETTE.seaDeep);
  grad.addColorStop(0.55, PALETTE.sea);
  grad.addColorStop(1, PALETTE.seaLight);
  ctx.fillStyle = grad;
  ctx.fill();

  // swell lines and glints, clipped to the water
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 3;
  for (let band = 0; band < 4; band += 1) {
    ctx.beginPath();
    for (let x = 0; x <= FIELD.width; x += 10) {
      const y = BARS.top + 26 + band * ((rest - BARS.top) / 4.4) + Math.sin(x * 0.014 + time * (0.9 + band * 0.25) + band * 2) * 6;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (let i = 0; i < 22; i += 1) {
    ctx.fillRect((i * 83 + time * 22 * (1 + (i % 3) * 0.3)) % FIELD.width, BARS.top + 12 + ((i * 47) % Math.max(40, rest - 90)), 12, 3);
  }
  ctx.restore();

  // foam: a bright band along the edge plus drifting blobs
  for (const [lw, alpha, off] of [[16, 0.4, 5], [8, 0.98, 0]]) {
    ctx.beginPath();
    xs.forEach((x, i) => (i === 0 ? ctx.moveTo(x, ys[i] + off) : ctx.lineTo(x, ys[i] + off)));
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = lw;
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  for (let i = 0; i < xs.length; i += 2) {
    const r = 3 + ((i * 7) % 5);
    ctx.beginPath();
    ctx.arc(xs[i] + Math.sin(time * 3 + i) * 3, ys[i] + 7 + Math.sin(time * 2 + i * 1.7) * 3, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // a deeper crest line where a surge is well beyond the resting line
  ctx.strokeStyle = 'rgba(15, 143, 176, 0.55)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  let drawing = false;
  xs.forEach((x, i) => {
    if (ys[i] > rest + 30) {
      if (!drawing) ctx.moveTo(x, ys[i] - 12);
      else ctx.lineTo(x, ys[i] - 12);
      drawing = true;
    } else drawing = false;
  });
  ctx.stroke();
}

/** Blue tint over every cell the water got through, fading as it drains. */
export function drawFlood(ctx, game, time) {
  for (let row = 0; row < GRID.rows; row += 1) {
    for (let col = 0; col < GRID.cols; col += 1) {
      const t = game.beach.flood[row][col];
      if (t <= 0) continue;
      const a = Math.min(1, t / 1.6) * 0.62;
      const x = cellLeft(col);
      const y = cellTop(row);
      ctx.fillStyle = `rgba(39, 190, 214, ${a})`;
      roundRectPath(ctx, x + 1, y + 1, GRID.cellW - 2, GRID.cellH - 2, 10);
      ctx.fill();
      ctx.strokeStyle = `rgba(255, 255, 255, ${a})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = 6; px < GRID.cellW - 6; px += 6) {
        const py = y + GRID.cellH / 2 + Math.sin(time * 5 + px * 0.25 + col) * 3;
        if (px === 6) ctx.moveTo(x + px, py);
        else ctx.lineTo(x + px, py);
      }
      ctx.stroke();
    }
  }
}

/** The rogue wave's shadow: a dark band rolling in under the waterline, growing as it nears. */
export function drawRogueShadow(ctx, game, time) {
  if (game.rogueWarning <= 0) return;
  const k = 1 - game.rogueWarning / WARN_LEAD;
  const rest = game.fx.waterShown ?? game.waterline;
  const depth = 60 + k * 150;
  const pulse = 0.5 + 0.5 * Math.sin(time * 9);
  const grad = ctx.createLinearGradient(0, rest, 0, rest + depth);
  grad.addColorStop(0, `rgba(8, 60, 110, ${0.5 + 0.2 * pulse})`);
  grad.addColorStop(1, 'rgba(8, 60, 110, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, rest, FIELD.width, depth);
  ctx.strokeStyle = `rgba(255, 90, 74, ${0.55 + 0.4 * pulse})`;
  ctx.lineWidth = 5;
  ctx.setLineDash([22, 14]);
  ctx.beginPath();
  ctx.moveTo(0, rest + depth);
  ctx.lineTo(FIELD.width, rest + depth);
  ctx.stroke();
  ctx.setLineDash([]);
}
