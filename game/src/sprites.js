// Procedural pictures of every thing on the beach: walls, towers, moats, waves, crabs, gulls,
// logs, shells and particles. Each draws itself at a pixel position with crisp dark outlines.
import { GRID, PALETTE } from './config.js';
import { cellLeft, cellTop } from './beach.js';
import { roundRectPath, starPath } from './draw.js';

const LEVEL_TINT = ['#f4d9a0', '#ecc57f', '#e1ad63'];

function outline(ctx, w = 3) {
  ctx.lineWidth = w;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PALETTE.outline;
}

function levelPips(ctx, x, y, level) {
  for (let i = 0; i < level; i += 1) {
    outline(ctx, 2);
    ctx.fillStyle = PALETTE.gold;
    starPath(ctx, x + i * 13, y, 6.5);
    ctx.fill();
    ctx.stroke();
  }
}

function cracks(ctx, x, y, w, h, damage) {
  if (damage < 0.2) return;
  ctx.strokeStyle = 'rgba(74, 51, 34, 0.75)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.3, y);
  ctx.lineTo(x + w * 0.38, y + h * 0.35);
  ctx.lineTo(x + w * 0.28, y + h * 0.6);
  if (damage > 0.5) {
    ctx.moveTo(x + w * 0.72, y + h * 0.1);
    ctx.lineTo(x + w * 0.6, y + h * 0.45);
    ctx.lineTo(x + w * 0.7, y + h);
  }
  if (damage > 0.75) {
    ctx.moveTo(x + w * 0.5, y + h * 0.2);
    ctx.lineTo(x + w * 0.52, y + h * 0.8);
  }
  ctx.stroke();
}

function healthPip(ctx, s, x, y, w) {
  const f = s.hp / s.maxHp;
  if (f > 0.995) return;
  ctx.fillStyle = 'rgba(43, 42, 58, 0.55)';
  roundRectPath(ctx, x, y, w, 7, 3.5);
  ctx.fill();
  ctx.fillStyle = f > 0.55 ? PALETTE.green : f > 0.3 ? PALETTE.gold : PALETTE.coral;
  roundRectPath(ctx, x, y, Math.max(5, w * f), 7, 3.5);
  ctx.fill();
  outline(ctx, 1.5);
  roundRectPath(ctx, x, y, w, 7, 3.5);
  ctx.stroke();
}

export function drawWall(ctx, s, time) {
  const x = cellLeft(s.col) + 3;
  const y = cellTop(s.row) + 6;
  const w = GRID.cell - 6;
  const h = GRID.cell - 12;
  const damage = 1 - s.hp / s.maxHp;
  const sink = damage * 6;
  ctx.fillStyle = LEVEL_TINT[s.level - 1];
  roundRectPath(ctx, x, y + 14 + sink, w, h - 14 - sink, 8);
  outline(ctx, 3.5);
  ctx.fill();
  ctx.stroke();
  const mw = (w - 8) / 3;
  for (let i = 0; i < 3; i += 1) {
    const mx = x + 2 + i * (mw + 2);
    ctx.fillStyle = LEVEL_TINT[s.level - 1];
    roundRectPath(ctx, mx, y + sink * (i === 1 ? 1.6 : 1), mw, 22, 4);
    ctx.fill();
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(x + 6, y + 24 + sink, w - 12, 5);
  if (s.level >= 2) {
    ctx.fillStyle = '#fff6e4';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(x + 14 + i * 18, y + 40, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }
  if (s.level >= 3) {
    ctx.fillStyle = PALETTE.coral;
    ctx.fillRect(x + 4, y + 22 + sink, w - 8, 4);
  }
  cracks(ctx, x, y + 12, w, h - 12, damage);
  if (s.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.7, s.flash * 4)})`;
    roundRectPath(ctx, x, y + 14 + sink, w, h - 14 - sink, 8);
    ctx.fill();
  }
  healthPip(ctx, s, x + 6, y + h - 4, w - 12);
  levelPips(ctx, x + 10, y + 4 + GRID.cell - 12 - 10, s.level > 1 ? s.level : 0);
  void time;
}

export function drawTower(ctx, s, time) {
  const cx = cellLeft(s.col) + GRID.cell / 2;
  const base = cellTop(s.row) + GRID.cell - 6;
  const damage = 1 - s.hp / s.maxHp;
  const w = 38;
  const h = 44 - damage * 6;
  ctx.fillStyle = LEVEL_TINT[s.level - 1];
  roundRectPath(ctx, cx - w / 2, base - h, w, h, 6);
  outline(ctx, 3.5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(cx - w / 2 + 5, base - h + 6, 7, h - 14);
  cracks(ctx, cx - w / 2, base - h, w, h, damage);
  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 5, base - h + 3);
  ctx.lineTo(cx, base - h - 24);
  ctx.lineTo(cx + w / 2 + 5, base - h + 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1f3d5a';
  roundRectPath(ctx, cx - 5, base - h + 12, 10, 14, 5);
  ctx.fill();
  const barrel = 17;
  const ax = cx + Math.cos(s.aim) * barrel;
  const ay = base - h + 8 + Math.sin(s.aim) * barrel;
  ctx.lineWidth = 8;
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, base - h + 8);
  ctx.lineTo(ax, ay);
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#7fe6e0';
  ctx.beginPath();
  ctx.moveTo(cx, base - h + 8);
  ctx.lineTo(ax, ay);
  ctx.stroke();
  ctx.lineCap = 'butt';
  outline(ctx, 3);
  if (s.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.7, s.flash * 4)})`;
    roundRectPath(ctx, cx - w / 2, base - h, w, h, 6);
    ctx.fill();
  }
  healthPip(ctx, s, cx - 24, base + 1, 48);
  levelPips(ctx, cellLeft(s.col) + 10, cellTop(s.row) + 10, s.level > 1 ? s.level : 0);
  void time;
}

export function drawMoat(ctx, s, time) {
  const x = cellLeft(s.col) + 4;
  const y = cellTop(s.row) + 12;
  const w = GRID.cell - 8;
  const h = GRID.cell - 24;
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = PALETTE.seaDeep;
  outline(ctx, 3.5);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < s.level + 1; i += 1) {
    ctx.beginPath();
    const yy = y + 8 + i * 8;
    ctx.moveTo(x + 4, yy);
    for (let px = 0; px <= w - 8; px += 6) ctx.lineTo(x + 4 + px, yy + Math.sin(time * 3 + px * 0.2 + i) * 2);
    ctx.stroke();
  }
  ctx.restore();
  levelPips(ctx, x + 6, y - 4, s.level > 1 ? s.level : 0);
}

export function drawStructure(ctx, s, time) {
  if (s.kind === 'wall') drawWall(ctx, s, time);
  else if (s.kind === 'tower') drawTower(ctx, s, time);
  else drawMoat(ctx, s, time);
}

/** A wave: a streak of water behind a curling, foam-capped crest. */
export function drawWave(ctx, wave, time) {
  const cx = cellLeft(wave.lane) + GRID.cell / 2;
  const half = (wave.rogue ? GRID.cell / 2 + 1 : 28 + Math.min(4, wave.power * 0.1));
  const y = wave.y;
  const tail = wave.rogue ? 150 : 90 + Math.min(40, wave.power);
  const grad = ctx.createLinearGradient(0, y - tail, 0, y);
  grad.addColorStop(0, 'rgba(18, 161, 184, 0)');
  grad.addColorStop(0.5, 'rgba(18, 161, 184, 0.7)');
  grad.addColorStop(1, 'rgba(18, 161, 184, 0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - half, y - tail, half * 2, tail);
  const bob = Math.sin(time * 9 + wave.wobble) * 2;
  ctx.beginPath();
  ctx.moveTo(cx - half, y - 10);
  ctx.quadraticCurveTo(cx - half * 0.6, y + 14 + bob, cx, y + 16 + bob);
  ctx.quadraticCurveTo(cx + half * 0.6, y + 14 + bob, cx + half, y - 10);
  ctx.closePath();
  ctx.fillStyle = wave.rogue ? '#12a1b8' : PALETTE.sea;
  ctx.fill();
  outline(ctx, 3);
  ctx.strokeStyle = '#0d6f86';
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - half + 4, y - 6);
  ctx.quadraticCurveTo(cx, y + 20 + bob, cx + half - 4, y - 6);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.arc(cx - half + 8 + i * ((half * 2 - 16) / 3), y - 2 + Math.sin(time * 7 + i + wave.wobble) * 3, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawCrab(ctx, e, time) {
  const wig = Math.sin(e.phase) * 3;
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.state === 'flee') ctx.scale(1, -1);
  outline(ctx, 3);
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 3;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(side * 12, -2 + i * 7);
      ctx.lineTo(side * (24 + (i % 2) * 3), 4 + i * 7 + (i % 2 ? wig : -wig));
      ctx.stroke();
    }
  }
  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.ellipse(0, 6, 22, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 3);
  ctx.stroke();
  const pinch = e.state === 'pinch' ? Math.sin(time * 28) * 0.4 : 0;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * 22, -8);
    ctx.rotate(side * (0.4 + pinch));
    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath();
    ctx.ellipse(0, -8, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#f7e6c4';
  ctx.beginPath();
  ctx.arc(0, -2, 14, Math.PI * 0.9, Math.PI * 2.1);
  ctx.quadraticCurveTo(14, 8, 0, 8);
  ctx.quadraticCurveTo(-14, 8, -14, -2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#c99a6a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -1, 6, 0, Math.PI * 1.6);
  ctx.stroke();
  for (const side of [-1, 1]) {
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(side * 7, 12);
    ctx.lineTo(side * 8, 20);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(side * 8, 21, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.beginPath();
    ctx.arc(side * 8, 22, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  if (e.flash > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 22, 15, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGull(ctx, e, time) {
  const flap = e.state === 'peck' ? 0.25 + Math.sin(time * 20) * 0.1 : Math.sin(e.phase * 2.2);
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.state === 'flee' && e.x < 640) ctx.scale(-1, 1);
  outline(ctx, 3);
  ctx.fillStyle = '#ffffff';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 4, 0);
    ctx.quadraticCurveTo(side * 30, -22 - flap * 18, side * 44, -6 - flap * 10);
    ctx.quadraticCurveTo(side * 26, 0, side * 6, 8);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, 4, 15, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(14, -4, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffb02e';
  ctx.beginPath();
  ctx.moveTo(21, -5);
  ctx.lineTo(32, -2);
  ctx.lineTo(21, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(16, -6, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (e.flash > 0) {
    ctx.fillStyle = 'rgba(255, 90, 74, 0.5)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 15, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawLog(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(Math.sin(e.spin) * 0.18);
  outline(ctx, 3.5);
  ctx.fillStyle = '#b07842';
  roundRectPath(ctx, -26, -16, 52, 32, 12);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#7e5128';
  ctx.lineWidth = 2;
  for (const dy of [-6, 2, 9]) {
    ctx.beginPath();
    ctx.moveTo(-18, dy);
    ctx.lineTo(10, dy + 1);
    ctx.stroke();
  }
  ctx.fillStyle = '#e8bd85';
  ctx.beginPath();
  ctx.ellipse(22, 0, 6, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  outline(ctx, 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(22, 0, 2.5, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  if (e.flash > 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    roundRectPath(ctx, -26, -16, 52, 32, 12);
    ctx.fill();
  }
  ctx.restore();
}

export function drawShell(ctx, sh) {
  ctx.fillStyle = '#fff3d6';
  outline(ctx, 2.5);
  ctx.beginPath();
  ctx.arc(sh.x, sh.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawParticle(ctx, p) {
  const k = 1 - p.age / p.life;
  if (p.kind === 'drop') {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + k * 0.5})`;
    ctx.strokeStyle = 'rgba(18, 161, 184, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (p.kind === 'chunk') {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.age * 9);
    ctx.fillStyle = k > 0.5 ? PALETTE.sandDark : PALETTE.sandWet;
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 1.8;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  } else if (p.kind === 'foam') {
    ctx.fillStyle = `rgba(255, 255, 255, ${k * 0.85})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1.2 - k * 0.4), 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = p.color;
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 1.5;
    starPath(ctx, p.x, p.y, p.size * (0.4 + k * 0.8));
    ctx.fill();
    ctx.stroke();
  }
}
