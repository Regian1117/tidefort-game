// Procedural pictures of the living things and the small stuff on the beach: crabs, gulls, logs,
// the beach kid, tower shells and particles. Each draws itself at a pixel position with crisp dark outlines.
import { PALETTE } from './config.js';
import { outline, roundRectPath, starPath } from './draw.js';

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

/** The beach kid: straw hat, striped swimsuit, a bucket that shows how much sand it holds. */
export function drawKid(ctx, kid, time) {
  const swing = Math.sin(kid.anim) * 6;
  ctx.save();
  ctx.translate(kid.x, kid.y);
  ctx.fillStyle = 'rgba(74, 51, 34, 0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  if (kid.stun > 0) ctx.rotate(Math.sin(time * 30) * 0.25);
  ctx.scale(kid.face, 1);
  outline(ctx, 3);
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(side * 5, 8);
    ctx.lineTo(side * 5 + side * swing * 0.6, 22);
    ctx.stroke();
    ctx.strokeStyle = '#ffcfa0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(side * 5, 8);
    ctx.lineTo(side * 5 + side * swing * 0.6, 22);
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  outline(ctx, 3);
  roundRectPath(ctx, -12, -8, 24, 22, 8);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.coral;
  for (const sy of [-3, 5]) ctx.fillRect(-11, sy, 22, 4);
  ctx.beginPath();
  ctx.arc(0, -18, 11, 0, Math.PI * 2);
  ctx.fillStyle = '#ffcfa0';
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.beginPath();
  ctx.arc(4, -19, 1.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.ellipse(0, -25, 19, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -26, 10, Math.PI, 0);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = PALETTE.coral;
  ctx.fillRect(-10, -28, 20, 4);
  // the bucket, in the front hand; it swings when the kid acts
  const lift = kid.acting ? Math.sin(time * 24) * 5 : 0;
  ctx.save();
  ctx.translate(15, 4 + lift);
  const fill = kid.cap > 0 ? kid.carry / kid.cap : 0;
  outline(ctx, 3);
  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.moveTo(-9, -8);
  ctx.lineTo(9, -8);
  ctx.lineTo(7, 10);
  ctx.lineTo(-7, 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (fill > 0.02) {
    ctx.fillStyle = PALETTE.sandDark;
    ctx.beginPath();
    ctx.ellipse(0, -9, 9, 3 + fill * 6, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  if (kid.stun > 0) {
    ctx.fillStyle = PALETTE.gold;
    starPath(ctx, -10, -44, 6);
    ctx.fill();
    starPath(ctx, 12, -48, 5);
    ctx.fill();
  }
  ctx.restore();
}

export function drawPrint(ctx, p) {
  ctx.fillStyle = 'rgba(122, 79, 29, ' + Math.max(0, 0.32 - p.age * 0.06) + ')';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 5, 3, 0.3 * p.face, 0, Math.PI * 2);
  ctx.fill();
}
