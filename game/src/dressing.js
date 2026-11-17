// Beach life: a striped parasol, towels, a beach ball, shells and starfish scattered on the dry
// sand (the sea drawn after them covers whatever the tide reaches), and a kite over the water.
import { PALETTE } from './config.js';
import { outline, roundRectPath, starPath } from './draw.js';

function towel(ctx, x, y, angle, colours) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  roundRectPath(ctx, -44, -26, 88, 52, 6);
  ctx.fillStyle = colours[0];
  outline(ctx, 3);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = colours[1];
  for (let i = -3; i <= 3; i += 2) ctx.fillRect(i * 12 - 6, -26, 12, 52);
  ctx.restore();
  roundRectPath(ctx, -44, -26, 88, 52, 6);
  ctx.stroke();
  ctx.restore();
}

function parasol(ctx, x, y) {
  ctx.fillStyle = 'rgba(74, 51, 34, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + 20, y + 62, 64, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x + 6, y + 64);
  ctx.stroke();
  ctx.strokeStyle = '#f2e6c8';
  ctx.lineWidth = 3;
  ctx.stroke();
  const r = 70;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.arc(x, y - 6, r, Math.PI + (i * Math.PI) / 6, Math.PI + ((i + 1) * Math.PI) / 6);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? '#ffffff' : PALETTE.coral;
    ctx.fill();
    outline(ctx, 3);
    ctx.stroke();
  }
}

function shell(ctx, x, y, s, tint) {
  ctx.fillStyle = tint;
  outline(ctx, 2.5);
  ctx.beginPath();
  ctx.moveTo(x, y + s);
  ctx.quadraticCurveTo(x - s * 1.3, y - s * 0.1, x - s * 0.5, y - s * 0.8);
  ctx.quadraticCurveTo(x, y - s * 1.1, x + s * 0.5, y - s * 0.8);
  ctx.quadraticCurveTo(x + s * 1.3, y - s * 0.1, x, y + s);
  ctx.fill();
  ctx.stroke();
}

function ball(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  outline(ctx, 3);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = PALETTE.coral;
  ctx.fillRect(-4, -24, 14, 48);
  ctx.fillStyle = PALETTE.skyDeep;
  ctx.fillRect(-26, -4, 52, 12);
  ctx.restore();
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** The things lying on the sand. */
export function drawDressing(ctx) {
  parasol(ctx, 78, 452);
  towel(ctx, 70, 596, -0.12, ['#ffffff', '#27c4c4']);
  towel(ctx, 1196, 478, 0.1, ['#ffe9a8', '#ff5a4a']);
  ball(ctx, 1170, 590);
  for (const [x, y, s, c] of [[300, 560, 9, '#ffb3a0'], [520, 548, 8, '#fff3d6'], [840, 566, 10, '#ffb3a0'], [1000, 552, 8, '#fff3d6'], [130, 380, 8, '#ffb3a0'], [1224, 372, 9, '#fff3d6']]) shell(ctx, x, y, s, c);
  ctx.fillStyle = '#ff8f5a';
  outline(ctx, 3);
  starPath(ctx, 1238, 430, 14);
  ctx.fill();
  ctx.stroke();
  starPath(ctx, 640, 574, 11);
  ctx.fill();
  ctx.stroke();
}

/** A kite bobbing over the sea. */
export function drawKite(ctx, time) {
  const x = 1226 + Math.sin(time * 0.9) * 10;
  const y = 104 + Math.sin(time * 1.3) * 8;
  ctx.strokeStyle = 'rgba(74, 51, 34, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 30);
  ctx.quadraticCurveTo(x - 30, y + 120, 1238, 290);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x + 24, y);
  ctx.lineTo(x, y + 30);
  ctx.lineTo(x - 24, y);
  ctx.closePath();
  ctx.fillStyle = PALETTE.coral;
  outline(ctx, 3);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x, y + 30);
  ctx.moveTo(x - 24, y);
  ctx.lineTo(x + 24, y);
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  for (let i = 1; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.arc(x - 8 * i + Math.sin(time * 4 + i) * 4, y + 30 + i * 11, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
