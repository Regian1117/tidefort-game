// Paints the beach scene: sky strip, animated sea with a foam line, the sand grid, the castle,
// every structure, wave, pest and particle, and the hover ghost under the mouse. The HUD and the
// screens are drawn on top of this by hud.js and screens.js.
import { CASTLE, FIELD, GRID, PALETTE, SEA, TOOLS } from './config.js';
import { cellAt, cellLeft, cellTop, structureAt } from './beach.js';
import { flagIcon, outlineText, roundRectPath } from './draw.js';
import { drawCrab, drawGull, drawLog, drawParticle, drawShell, drawStructure, drawWave } from './sprites.js';
import { toolCost } from './walls.js';

const GRAINS = (() => {
  const grains = [];
  let a = 12345;
  for (let i = 0; i < 520; i += 1) {
    a = (Math.imul(a, 1664525) + 1013904223) | 0;
    const x = (a >>> 8) % FIELD.width;
    a = (Math.imul(a, 1664525) + 1013904223) | 0;
    const y = SEA.bottom + ((a >>> 8) % (FIELD.height - SEA.bottom));
    grains.push({ x, y, s: 1.5 + ((a >>> 4) % 3) });
  }
  return grains;
})();

function drawSea(ctx, time, game) {
  const grad = ctx.createLinearGradient(0, SEA.top, 0, SEA.bottom);
  grad.addColorStop(0, PALETTE.seaDeep);
  grad.addColorStop(0.55, PALETTE.sea);
  grad.addColorStop(1, PALETTE.seaLight);
  ctx.fillStyle = grad;
  ctx.fillRect(0, SEA.top, FIELD.width, SEA.bottom - SEA.top + 12);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3;
  for (let band = 0; band < 3; band += 1) {
    ctx.beginPath();
    const y0 = SEA.top + 22 + band * 26;
    for (let x = 0; x <= FIELD.width; x += 10) {
      const y = y0 + Math.sin(x * 0.018 + time * (1.2 + band * 0.3) + band * 2) * 4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // sun glints
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 14; i += 1) {
    const gx = (i * 97 + time * 18) % FIELD.width;
    const gy = SEA.top + 10 + ((i * 53) % 70);
    ctx.fillRect(gx, gy, 10, 3);
  }
  // rogue-wave warning swell
  if (game.rogueWarning > 0) {
    const pulse = 0.25 + 0.2 * Math.sin(time * 12);
    ctx.fillStyle = `rgba(255, 90, 74, ${pulse})`;
    ctx.fillRect(0, SEA.top, FIELD.width, SEA.bottom - SEA.top);
  }
}

function shoreline(time) {
  const path = new Path2D();
  path.moveTo(0, SEA.bottom - 14);
  for (let x = 0; x <= FIELD.width; x += 8) path.lineTo(x, SEA.bottom + 4 + Math.sin(x * 0.03 + time * 1.5) * 5);
  path.lineTo(FIELD.width, SEA.bottom - 14);
  path.closePath();
  return path;
}

function drawSand(ctx, time) {
  const top = SEA.bottom;
  const grad = ctx.createLinearGradient(0, top, 0, FIELD.height);
  grad.addColorStop(0, PALETTE.sandWet);
  grad.addColorStop(0.12, PALETTE.sandDark);
  grad.addColorStop(0.4, PALETTE.sand);
  grad.addColorStop(1, '#f9e6b8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, top - 14, FIELD.width, FIELD.height - top + 14);
  ctx.fillStyle = 'rgba(140, 95, 50, 0.22)';
  for (const g of GRAINS) ctx.fillRect(g.x, g.y, g.s, g.s);
  const path = shoreline(time);
  ctx.fillStyle = '#ffffff';
  ctx.fill(path);
  ctx.strokeStyle = 'rgba(18, 161, 184, 0.65)';
  ctx.lineWidth = 3;
  ctx.stroke(path);
}

function drawGrid(ctx, game, view) {
  const gx = GRID.x;
  const gy = GRID.y;
  const gw = GRID.cols * GRID.cell;
  const gh = GRID.rows * GRID.cell;
  roundRectPath(ctx, gx - 6, gy - 4, gw + 12, gh + 8, 10);
  ctx.fillStyle = 'rgba(255, 246, 220, 0.38)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(74, 51, 34, 0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(122, 79, 29, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 7]);
  ctx.beginPath();
  for (let c = 1; c < GRID.cols; c += 1) {
    ctx.moveTo(gx + c * GRID.cell, gy);
    ctx.lineTo(gx + c * GRID.cell, gy + gh);
  }
  for (let r = 1; r < GRID.rows; r += 1) {
    ctx.moveTo(gx, gy + r * GRID.cell);
    ctx.lineTo(gx + gw, gy + r * GRID.cell);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  // pest warnings: a bobbing marker at the top of a lane while a log or crab is on its way
  for (const e of game.enemies) {
    if (e.type === 'log' && e.y < GRID.y + 10) {
      const x = cellLeft(e.lane) + GRID.cell / 2;
      outlineText(ctx, '!', x, SEA.bottom + 40 + Math.sin(view.time * 10) * 3, { size: 40, color: PALETTE.coral, align: 'center' });
    }
  }
}

function drawCastle(ctx, game, view) {
  const { x, width, top, bottom } = CASTLE;
  const damage = 1 - game.castle.hp / game.castle.maxHp;
  const bodyTop = top + 36;
  ctx.fillStyle = 'rgba(74, 51, 34, 0.18)';
  ctx.fillRect(x - 10, bottom - 4, width + 20, 12);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = PALETTE.outline;
  const shade = game.castle.flash > 0 ? '#ffe3d6' : '#e8c27d';
  ctx.fillStyle = shade;
  roundRectPath(ctx, x, bodyTop, width, bottom - bodyTop, 10);
  ctx.fill();
  ctx.stroke();
  const merlon = 28;
  for (let mx = x + 6; mx < x + width - merlon; mx += merlon * 2) {
    ctx.fillStyle = shade;
    ctx.fillRect(mx, bodyTop - 14, merlon, 16);
    ctx.strokeRect(mx, bodyTop - 14, merlon, 16);
  }
  for (const tx of [x - 14, x + width - 46]) {
    ctx.fillStyle = shade;
    roundRectPath(ctx, tx, top + 6, 60, bottom - top - 6, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath();
    ctx.moveTo(tx - 6, top + 10);
    ctx.lineTo(tx + 30, top - 14);
    ctx.lineTo(tx + 66, top + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#35566f';
    roundRectPath(ctx, tx + 23, top + 26, 14, 20, 7);
    ctx.fill();
  }
  const cx = x + width / 2;
  ctx.fillStyle = shade;
  roundRectPath(ctx, cx - 56, top + 4, 112, bottom - top - 4, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#6b4526';
  roundRectPath(ctx, cx - 20, bottom - 52, 40, 52, 20);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#35566f';
  for (const wx of [cx - 40, cx + 28]) {
    roundRectPath(ctx, wx, top + 24, 12, 18, 6);
    ctx.fill();
  }
  // damage: gouges and a lowered look as integrity falls
  if (damage > 0.15) {
    ctx.fillStyle = 'rgba(122, 79, 29, 0.55)';
    const bites = Math.floor(damage * 9);
    for (let i = 0; i < bites; i += 1) {
      const bx = x + 20 + ((i * 131) % (width - 40));
      ctx.beginPath();
      ctx.arc(bx, bodyTop + 6 + (i % 3) * 14, 9 + (i % 4) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const lowFlag = game.castle.flag <= 1;
  flagIcon(ctx, cx, top + 4, 54, view.time, lowFlag ? 8 : 0);
}

export function drawScene(ctx, game, view) {
  const time = view.time;
  ctx.fillStyle = PALETTE.sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.save();
  ctx.translate(game.fx.shakeX, game.fx.shakeY);
  drawSea(ctx, time, game);
  drawSand(ctx, time);
  drawGrid(ctx, game, view);
  drawCastle(ctx, game, view);
  // hover ghost
  if (view.cursor && (game.phase === 'build' || game.phase === 'tide')) {
    const cell = cellAt(view.cursor.x, view.cursor.y);
    if (cell) {
      const s = structureAt(game.beach, cell.col, cell.row);
      const x = cellLeft(cell.col);
      const y = cellTop(cell.row);
      const ok = s ? true : game.sand >= toolCost(game.tool);
      ctx.fillStyle = ok ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 90, 74, 0.35)';
      roundRectPath(ctx, x + 2, y + 2, GRID.cell - 4, GRID.cell - 4, 8);
      ctx.fill();
      ctx.strokeStyle = ok ? '#ffffff' : PALETTE.coral;
      ctx.lineWidth = 3;
      ctx.stroke();
      if (!s) {
        const tool = TOOLS.find((t) => t.id === game.tool);
        ctx.globalAlpha = 0.55;
        drawStructure(ctx, { kind: tool.id, level: 1, col: cell.col, row: cell.row, hp: 1, maxHp: 1, flash: 0, aim: -1.2 }, time);
        ctx.globalAlpha = 1;
      }
    }
  }
  for (const s of game.structures()) drawStructure(ctx, s, time);
  for (const w of game.waves) drawWave(ctx, w, time);
  for (const e of game.enemies) {
    if (e.type === 'crab') drawCrab(ctx, e, time);
    else if (e.type === 'log') drawLog(ctx, e);
  }
  for (const e of game.enemies) if (e.type === 'gull') drawGull(ctx, e, time);
  for (const sh of game.shells) drawShell(ctx, sh);
  for (const p of game.fx.parts) drawParticle(ctx, p);
  for (const t of game.fx.texts) {
    const k = 1 - t.age / t.life;
    ctx.globalAlpha = Math.min(1, k * 2);
    outlineText(ctx, t.text, t.x, t.y, { size: t.size, color: t.color, align: 'center' });
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
