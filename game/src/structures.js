// Pictures of the three things the player builds: a crenellated sand wall, a round tower with a
// shell cannon, and a moat ditch. Each shows its level in gold stars, cracks as it is hurt, and a
// small health bar once it is damaged.
import { GRID, PALETTE } from './config.js';
import { cellLeft, cellTop } from './beach.js';
import { outline, roundRectPath, starPath } from './draw.js';

const LEVEL_TINT = ['#f6dc9f', '#efc77f', '#e4ad60'];

function pips(ctx, x, y, level) {
  for (let i = 1; i < level; i += 1) {
    outline(ctx, 2);
    ctx.fillStyle = PALETTE.gold;
    starPath(ctx, x + (i - 1) * 15, y, 7.5);
    ctx.fill();
    ctx.stroke();
  }
}

function cracks(ctx, x, y, w, h, damage) {
  if (damage < 0.2) return;
  ctx.strokeStyle = 'rgba(74, 51, 34, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y);
  ctx.lineTo(x + w * 0.38, y + h * 0.35);
  ctx.lineTo(x + w * 0.27, y + h * 0.65);
  if (damage > 0.45) {
    ctx.moveTo(x + w * 0.72, y + h * 0.05);
    ctx.lineTo(x + w * 0.6, y + h * 0.45);
    ctx.lineTo(x + w * 0.7, y + h);
  }
  if (damage > 0.7) {
    ctx.moveTo(x + w * 0.5, y + h * 0.15);
    ctx.lineTo(x + w * 0.54, y + h * 0.85);
  }
  ctx.stroke();
}

function healthBar(ctx, s, x, y, w) {
  const f = s.hp / s.maxHp;
  if (f > 0.995) return;
  ctx.fillStyle = 'rgba(43, 42, 58, 0.6)';
  roundRectPath(ctx, x, y, w, 8, 4);
  ctx.fill();
  ctx.fillStyle = f > 0.55 ? PALETTE.green : f > 0.35 ? PALETTE.gold : PALETTE.coral;
  roundRectPath(ctx, x, y, Math.max(6, w * f), 8, 4);
  ctx.fill();
  outline(ctx, 1.6);
  roundRectPath(ctx, x, y, w, 8, 4);
  ctx.stroke();
}

function flashOver(ctx, s, build) {
  if (s.flash <= 0) return;
  ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.7, s.flash * 4)})`;
  build();
  ctx.fill();
}

export function drawWall(ctx, s) {
  const x = cellLeft(s.col) + 4;
  const y = cellTop(s.row) + 7;
  const w = GRID.cellW - 8;
  const h = GRID.cellH - 12;
  const damage = 1 - s.hp / s.maxHp;
  const sink = damage * 8;
  const tint = LEVEL_TINT[s.level - 1];
  const body = () => roundRectPath(ctx, x, y + 18 + sink, w, h - 18 - sink, 8);
  body();
  ctx.fillStyle = tint;
  outline(ctx, 4);
  ctx.fill();
  ctx.stroke();
  const mw = (w - 14) / 4;
  for (let i = 0; i < 4; i += 1) {
    roundRectPath(ctx, x + 3 + i * (mw + 2.7), y + sink * (i % 2 ? 1.7 : 1), mw, 26, 4);
    ctx.fillStyle = tint;
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(x + 8, y + 27 + sink, w - 16, 5);
  if (s.level >= 2) {
    ctx.fillStyle = '#fff6e4';
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.arc(x + 17 + i * ((w - 34) / 3), y + 41, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }
  if (s.level >= 3) {
    ctx.fillStyle = PALETTE.coral;
    ctx.fillRect(x + 5, y + 31 + sink, w - 10, 4);
  }
  cracks(ctx, x, y + 14, w, h - 14, damage);
  flashOver(ctx, s, body);
  healthBar(ctx, s, x + 8, y + h - 5, w - 16);
  pips(ctx, x + 10, y + 12, s.level);
}

export function drawTower(ctx, s) {
  const cx = cellLeft(s.col) + GRID.cellW / 2;
  const base = cellTop(s.row) + GRID.cellH - 6;
  const damage = 1 - s.hp / s.maxHp;
  const w = 42;
  const h = 46 - damage * 6;
  const body = () => roundRectPath(ctx, cx - w / 2, base - h, w, h, 7);
  body();
  ctx.fillStyle = LEVEL_TINT[s.level - 1];
  outline(ctx, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(cx - w / 2 + 6, base - h + 7, 8, h - 16);
  cracks(ctx, cx - w / 2, base - h, w, h, damage);
  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 6, base - h + 4);
  ctx.lineTo(cx, base - h - 26);
  ctx.lineTo(cx + w / 2 + 6, base - h + 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1f3d5a';
  roundRectPath(ctx, cx - 5, base - h + 14, 10, 14, 5);
  ctx.fill();
  const px = cx;
  const py = base - h + 10;
  ctx.lineCap = 'round';
  for (const [lw, color] of [[9, PALETTE.outline], [4.5, PALETTE.seaLight]]) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(s.aim) * 19, py + Math.sin(s.aim) * 19);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  flashOver(ctx, s, body);
  healthBar(ctx, s, cx - 26, base + 1, 52);
  pips(ctx, cellLeft(s.col) + 10, cellTop(s.row) + 12, s.level);
}

export function drawMoat(ctx, s, time) {
  const x = cellLeft(s.col) + 5;
  const y = cellTop(s.row) + 12;
  const w = GRID.cellW - 10;
  const h = GRID.cellH - 24;
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = PALETTE.seaDeep;
  outline(ctx, 4);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < s.level + 1; i += 1) {
    ctx.beginPath();
    const yy = y + 9 + i * 8;
    for (let px = 0; px <= w - 10; px += 6) {
      const py = yy + Math.sin(time * 3 + px * 0.2 + i) * 2;
      if (px === 0) ctx.moveTo(x + 5, py);
      else ctx.lineTo(x + 5 + px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
  // arrows showing where it drains to: both ways
  ctx.fillStyle = '#ffffff';
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2 + dir * (w / 2 - 6), y + h / 2);
    ctx.lineTo(x + w / 2 + dir * (w / 2 - 18), y + h / 2 - 7);
    ctx.lineTo(x + w / 2 + dir * (w / 2 - 18), y + h / 2 + 7);
    ctx.closePath();
    ctx.fill();
  }
  pips(ctx, x + 6, y - 6, s.level);
}

export function drawStructure(ctx, s, time) {
  if (s.kind === 'wall') drawWall(ctx, s);
  else if (s.kind === 'tower') drawTower(ctx, s);
  else drawMoat(ctx, s, time);
}
