// Small canvas drawing helpers shared by the scene, the HUD and the screens: outlined text,
// rounded panels, bars and a few little icons. Everything is drawn in the 1280x720 logical space.
import { FONT, PALETTE } from './config.js';

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function panel(ctx, x, y, w, h, opts = {}) {
  const { fill = PALETTE.panel, radius = 14, line = 3, stroke = PALETTE.outline, shadow = true } = opts;
  if (shadow) {
    ctx.fillStyle = 'rgba(74, 51, 34, 0.22)';
    roundRectPath(ctx, x + 3, y + 5, w, h, radius);
    ctx.fill();
  }
  roundRectPath(ctx, x, y, w, h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = line;
  ctx.strokeStyle = stroke;
  ctx.stroke();
}

/** Bold text with a dark outline so it reads on sand, water and sky alike. */
export function outlineText(ctx, text, x, y, opts = {}) {
  const { size = 28, color = '#ffffff', stroke = PALETTE.outline, align = 'left', weight = 800, width = size / 4.5 } = opts;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** Plain text, no outline, for dark-on-light card copy. */
export function plainText(ctx, text, x, y, opts = {}) {
  const { size = 20, color = PALETTE.ink, align = 'left', weight = 700 } = opts;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function bar(ctx, x, y, w, h, fraction, color, back = 'rgba(43, 42, 58, 0.35)') {
  const f = Math.max(0, Math.min(1, fraction));
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = back;
  ctx.fill();
  if (f > 0) {
    ctx.save();
    roundRectPath(ctx, x, y, w, h, h / 2);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * f, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(x, y, w * f, h * 0.38);
    ctx.restore();
  }
  roundRectPath(ctx, x, y, w, h, h / 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.outline;
  ctx.stroke();
}

export function mmss(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** A little pennant on a pole: `x, y` is the foot of the pole. */
export function flagIcon(ctx, x, y, size, time, droop = 0) {
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.outline;
  ctx.fillStyle = '#f2e6c8';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - size);
  ctx.stroke();
  const wave = Math.sin(time * 6) * size * 0.06;
  ctx.fillStyle = PALETTE.coral;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.quadraticCurveTo(x + size * 0.4, y - size * 1.02 + wave - droop, x + size * 0.78, y - size * 0.8 + wave + droop);
  ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.7 - wave + droop, x, y - size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

export function starPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
}

/** Small round icons used by the upgrade cards and the HUD. */
export function icon(ctx, name, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineJoin = 'round';
  if (name === 'drop') {
    ctx.fillStyle = PALETTE.sea;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.9, 0, 0, s * 0.8);
    ctx.quadraticCurveTo(-s * 0.9, 0, 0, -s);
    ctx.fill();
    ctx.stroke();
  } else if (name === 'weed') {
    ctx.strokeStyle = '#2f8f4e';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, s);
    ctx.bezierCurveTo(-s, 0, s * 0.6, -s * 0.3, 0, -s);
    ctx.moveTo(s * 0.4, s);
    ctx.bezierCurveTo(s * 0.9, 0, -s * 0.3, -s * 0.4, s * 0.3, -s * 0.9);
    ctx.stroke();
  } else if (name === 'shell') {
    ctx.fillStyle = '#ffb3a0';
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.quadraticCurveTo(-s * 1.3, -s * 0.2, -s * 0.5, -s * 0.8);
    ctx.quadraticCurveTo(0, -s * 1.1, s * 0.5, -s * 0.8);
    ctx.quadraticCurveTo(s * 1.3, -s * 0.2, 0, s);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (const k of [-0.5, 0, 0.5]) {
      ctx.moveTo(0, s * 0.9);
      ctx.lineTo(k * s * 1.1, -s * 0.8);
    }
    ctx.stroke();
  } else if (name === 'bucket') {
    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, -s * 0.5);
    ctx.lineTo(s * 0.8, -s * 0.5);
    ctx.lineTo(s * 0.55, s * 0.9);
    ctx.lineTo(-s * 0.55, s * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -s * 0.5, s * 0.8, Math.PI, 0);
    ctx.stroke();
  } else if (name === 'crab') {
    ctx.fillStyle = PALETTE.coral;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.8, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-s * 0.9, -s * 0.5, s * 0.3, 0, Math.PI * 2);
    ctx.arc(s * 0.9, -s * 0.5, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (name === 'chart') {
    ctx.fillStyle = '#fffaf0';
    roundRectPath(ctx, -s * 0.8, -s * 0.9, s * 1.6, s * 1.8, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = PALETTE.seaDeep;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.2);
    ctx.quadraticCurveTo(-s * 0.2, -s * 0.5, 0, s * 0.1);
    ctx.quadraticCurveTo(s * 0.2, s * 0.6, s * 0.5, -s * 0.3);
    ctx.stroke();
  } else if (name === 'coin') {
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#c99a10';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * s * 0.65, Math.sin(a) * s * 0.65);
      ctx.stroke();
    }
  } else if (name === 'castle') {
    ctx.fillStyle = PALETTE.sandDark;
    ctx.beginPath();
    ctx.rect(-s * 0.9, -s * 0.2, s * 1.8, s * 1.1);
    ctx.rect(-s * 0.9, -s * 0.7, s * 0.5, s * 0.5);
    ctx.rect(s * 0.4, -s * 0.7, s * 0.5, s * 0.5);
    ctx.fill();
    ctx.stroke();
  } else if (name === 'flag') {
    flagIcon(ctx, -s * 0.2, s * 0.9, s * 1.8, 0);
  } else if (name === 'star') {
    ctx.fillStyle = PALETTE.gold;
    starPath(ctx, 0, 0, s);
    ctx.fill();
    ctx.stroke();
  } else if (name === 'gull') {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.9, 0, -s * 0.1);
    ctx.quadraticCurveTo(s * 0.5, -s * 0.9, s, 0);
    ctx.quadraticCurveTo(s * 0.4, s * 0.1, 0, s * 0.35);
    ctx.quadraticCurveTo(-s * 0.4, s * 0.1, -s, 0);
    ctx.fill();
    ctx.stroke();
  } else if (name === 'log') {
    ctx.fillStyle = '#a8703c';
    roundRectPath(ctx, -s, -s * 0.4, s * 2, s * 0.8, s * 0.35);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** The player's shovel cursor; the blade tip sits exactly on (x, y). */
export function drawCursor(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(15, -42);
  ctx.stroke();
  ctx.strokeStyle = '#d9954f';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.lineTo(15, -42);
  ctx.stroke();
  ctx.fillStyle = PALETTE.coral;
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.outline;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-10, -13);
  ctx.quadraticCurveTo(0, -23, 10, -13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(16, -44, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
