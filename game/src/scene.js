// Paints the beach scene bottom to top: sand and its beach life, the buildable grid, the sea (sea.js),
// flooded cells, the castle, structures, the telegraphed wave arrows, pests, the kid, particles and
// floating text. The slim HUD and the screens are drawn over this by hud.js and screens.js.
import { BARS, CASTLE, FIELD, GRID, PALETTE, TOOLS } from './config.js';
import { cellAt, cellLeft, cellTop, cellCentreX, firstDryRow, structureAt } from './beach.js';
import { flagIcon, outline, outlineText, plainText, roundRectPath } from './draw.js';
import { drawCrab, drawGull, drawKid, drawLog, drawParticle, drawPrint, drawShell } from './sprites.js';
import { drawStructure } from './structures.js';
import { drawFlood, drawRogueShadow, drawSea } from './sea.js';
import { drawDressing, drawKite } from './dressing.js';
import { forecast, imminentLanes } from './lanes.js';
import { toolCost } from './walls.js';

const GRAINS = (() => {
  const grains = [];
  let a = 12345;
  for (let i = 0; i < 600; i += 1) {
    a = (Math.imul(a, 1664525) + 1013904223) | 0;
    const x = (a >>> 8) % FIELD.width;
    a = (Math.imul(a, 1664525) + 1013904223) | 0;
    grains.push({ x, y: BARS.top + ((a >>> 8) % (BARS.bottom - BARS.top)), s: 1.5 + ((a >>> 4) % 3) });
  }
  return grains;
})();

function drawSand(ctx) {
  const grad = ctx.createLinearGradient(0, BARS.top, 0, BARS.bottom);
  grad.addColorStop(0, PALETTE.sandWet);
  grad.addColorStop(0.3, PALETTE.sandDark);
  grad.addColorStop(0.7, PALETTE.sand);
  grad.addColorStop(1, '#fbe9bd');
  ctx.fillStyle = grad;
  ctx.fillRect(0, BARS.top, FIELD.width, BARS.bottom - BARS.top);
  ctx.fillStyle = 'rgba(140, 95, 50, 0.22)';
  for (const g of GRAINS) ctx.fillRect(g.x, g.y, g.s, g.s);
}

/** Faint cell outlines on the dry rows only: this is where you can build. */
function drawGrid(ctx, game, time) {
  const dry = firstDryRow(game.waterline);
  const top = cellTop(dry);
  const h = (GRID.rows - dry) * GRID.cellH;
  ctx.fillStyle = 'rgba(255, 250, 230, 0.2)';
  roundRectPath(ctx, GRID.x - 4, top, GRID.cols * GRID.cellW + 8, h + 2, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(122, 79, 29, 0.34)';
  ctx.lineWidth = 1.6;
  ctx.setLineDash([7, 8]);
  ctx.beginPath();
  for (let c = 0; c <= GRID.cols; c += 1) {
    ctx.moveTo(GRID.x + c * GRID.cellW, top);
    ctx.lineTo(GRID.x + c * GRID.cellW, top + h);
  }
  for (let r = dry; r <= GRID.rows; r += 1) {
    ctx.moveTo(GRID.x, cellTop(r));
    ctx.lineTo(GRID.x + GRID.cols * GRID.cellW, cellTop(r));
  }
  ctx.stroke();
  ctx.setLineDash([]);
  void time;
}

function drawCastle(ctx, game, time) {
  const { x, width, top, bottom } = CASTLE;
  const damage = 1 - game.castle.hp / game.castle.maxHp;
  const bodyTop = top + 34;
  const shade = game.castle.flash > 0 ? '#ffe3d6' : '#e8c27d';
  ctx.fillStyle = 'rgba(74, 51, 34, 0.18)';
  ctx.fillRect(x - 10, bottom - 4, width + 20, 10);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = PALETTE.outline;
  ctx.fillStyle = shade;
  roundRectPath(ctx, x, bodyTop, width, bottom - bodyTop, 10);
  ctx.fill();
  ctx.stroke();
  for (let mx = x + 6; mx < x + width - 28; mx += 56) {
    ctx.fillStyle = shade;
    ctx.fillRect(mx, bodyTop - 14, 28, 16);
    ctx.strokeRect(mx, bodyTop - 14, 28, 16);
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
  roundRectPath(ctx, cx - 20, bottom - 50, 40, 50, 20);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#35566f';
  for (const wx of [cx - 40, cx + 28]) {
    roundRectPath(ctx, wx, top + 24, 12, 18, 6);
    ctx.fill();
  }
  if (damage > 0.15) {
    ctx.fillStyle = 'rgba(122, 79, 29, 0.55)';
    for (let i = 0; i < Math.floor(damage * 9); i += 1) {
      ctx.beginPath();
      ctx.arc(x + 20 + ((i * 131) % (width - 40)), bodyTop + 6 + (i % 3) * 14, 9 + (i % 4) * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  flagIcon(ctx, cx, top + 4, 54, time, game.castle.flag <= 1 ? 8 : 0);
}

const ARROW_COLOURS = [[30, '#27c4c4'], [48, '#ffd23f'], [999, '#ff5a4a']];

/** Telegraphed lanes: an arrow per lane with the strength of its hardest wave, and a count. */
function drawForecast(ctx, game, time) {
  const events = game.phase === 'tide' ? game.schedule : game.plan;
  if (game.phase === 'won' || game.phase === 'lost' || events.length === 0) return;
  const soon = game.phase === 'tide' ? imminentLanes(events, game.tideTime, 2.6) : new Set();
  const base = (game.fx.waterShown ?? game.waterline) - 6;
  for (const l of forecast(events)) {
    if (l.hits === 0 && !l.crab && !l.log) continue;
    const x = cellCentreX(l.lane);
    const alert = soon.has(l.lane);
    ctx.globalAlpha = game.phase === 'tide' && !alert ? 0.55 : 1;
    const bob = alert ? Math.sin(time * 14) * 3 : 0;
    if (l.hits > 0) {
      const colour = ARROW_COLOURS.find(([limit]) => l.peak <= limit)[1];
      const ay = base + bob;
      outline(ctx, 3);
      ctx.fillStyle = alert ? PALETTE.coral : colour;
      ctx.beginPath();
      ctx.moveTo(x - 9, ay - 24);
      ctx.lineTo(x + 9, ay - 24);
      ctx.lineTo(x + 9, ay - 8);
      ctx.lineTo(x + 20, ay - 8);
      ctx.lineTo(x, ay + 14);
      ctx.lineTo(x - 20, ay - 8);
      ctx.lineTo(x - 9, ay - 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      roundRectPath(ctx, x - 25, ay - 62, 50, 31, 11);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.stroke();
      plainText(ctx, String(Math.round(l.peak)), x - (l.hits > 1 ? 6 : 0), ay - 39, { size: 22, weight: 900, align: 'center', color: alert ? PALETTE.coralDark : PALETTE.ink });
      if (l.hits > 1) plainText(ctx, `x${l.hits}`, x + 15, ay - 40, { size: 13, weight: 900, align: 'center', color: PALETTE.coralDark });
      if (l.name && l.name !== 'wave' && game.phase !== 'tide') outlineText(ctx, l.name === 'swell' ? 'SWELL' : l.name === 'double' ? 'DOUBLE' : l.name === 'cross' ? 'SURGE' : 'RIP', x, ay - 68, { size: 13, color: '#ffffff', align: 'center', width: 4 });
    }
    if (l.crab) outlineText(ctx, 'CRAB', x, base + 30, { size: 14, color: '#ffe0d8', align: 'center', width: 4, stroke: PALETTE.coralDark });
    if (l.log) outlineText(ctx, 'LOG', x, base + (l.crab ? 46 : 30), { size: 14, color: '#f3d3a0', align: 'center', width: 4 });
    ctx.globalAlpha = 1;
  }
}

function drawGhost(ctx, game, view) {
  if (!view.cursor || (game.phase !== 'build' && game.phase !== 'tide')) return;
  const cell = cellAt(view.cursor.x, view.cursor.y);
  if (!cell) return;
  const s = structureAt(game.beach, cell.col, cell.row);
  const wet = cell.row < firstDryRow(game.waterline);
  const ok = !wet && (s || game.sand >= toolCost(game.tool));
  const x = cellLeft(cell.col);
  const y = cellTop(cell.row);
  ctx.fillStyle = ok ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 90, 74, 0.35)';
  roundRectPath(ctx, x + 2, y + 2, GRID.cellW - 4, GRID.cellH - 4, 8);
  ctx.fill();
  ctx.strokeStyle = ok ? '#ffffff' : PALETTE.coral;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (!s && !wet) {
    const tool = TOOLS.find((t) => t.id === game.tool);
    ctx.globalAlpha = 0.55;
    drawStructure(ctx, { kind: tool.id, level: 1, col: cell.col, row: cell.row, hp: 1, maxHp: 1, flash: 0, aim: -1.2 }, view.time);
    ctx.globalAlpha = 1;
  }
}

function drawPrompt(ctx, game) {
  const kid = game.kid;
  if (!kid.prompt || game.phase !== 'tide') return;
  const text = `SPACE: ${kid.prompt.toUpperCase()}`;
  ctx.font = '800 16px sans-serif';
  const w = ctx.measureText(text).width + 22;
  roundRectPath(ctx, kid.x - w / 2, kid.y - 78, w, 26, 13);
  ctx.fillStyle = 'rgba(255, 251, 238, 0.95)';
  ctx.fill();
  outline(ctx, 2.5);
  ctx.stroke();
  plainText(ctx, text, kid.x, kid.y - 60, { size: 16, weight: 900, align: 'center', color: PALETTE.coralDark });
}

export function drawScene(ctx, game, view) {
  const time = view.time;
  ctx.fillStyle = PALETTE.sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.save();
  ctx.translate(game.fx.shakeX, game.fx.shakeY);
  drawSand(ctx);
  drawDressing(ctx, time);
  drawGrid(ctx, game, time);
  for (const p of game.fx.prints) drawPrint(ctx, p);
  drawSea(ctx, game, time);
  drawKite(ctx, time);
  drawFlood(ctx, game, time);
  drawRogueShadow(ctx, game, time);
  drawCastle(ctx, game, time);
  drawGhost(ctx, game, view);
  for (const s of game.structures()) drawStructure(ctx, s, time);
  drawForecast(ctx, game, time);
  for (const e of game.enemies) {
    if (e.type === 'crab') drawCrab(ctx, e, time);
    else if (e.type === 'log') drawLog(ctx, e);
  }
  drawKid(ctx, game.kid, time);
  for (const e of game.enemies) if (e.type === 'gull') drawGull(ctx, e, time);
  for (const sh of game.shells) drawShell(ctx, sh);
  for (const p of game.fx.parts) drawParticle(ctx, p);
  drawPrompt(ctx, game);
  for (const t of game.fx.texts) {
    ctx.globalAlpha = Math.min(1, (1 - t.age / t.life) * 2);
    outlineText(ctx, t.text, t.x, t.y, { size: t.size, color: t.color, align: 'center' });
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
