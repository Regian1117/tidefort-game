// Full-screen overlays drawn over the beach: title (over live attract play), the controls card,
// the upgrade pick, pause, and the two endings: THE CASTLE STANDS and WASHED AWAY.
import { FIELD, PALETTE, TOTAL_TIDES } from './config.js';
import { flagIcon, icon, outlineText, panel, plainText, roundRectPath } from './draw.js';

const CARD = { w: 350, h: 196, gap: 18, y: 336 };

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function tint(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function button(ctx, text, cx, cy, w, h, time) {
  const pulse = 1 + Math.sin(time * 5) * 0.03;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);
  panel(ctx, -w / 2, -h / 2, w, h, { fill: PALETTE.coral, radius: h / 2 });
  outlineText(ctx, text, 0, h * 0.18, { size: h * 0.55, align: 'center', width: 6 });
  ctx.restore();
}

export function drawTitle(ctx, time, best) {
  tint(ctx, 'rgba(143, 214, 255, 0.14)');
  panel(ctx, 280, 88, 720, 176, { fill: 'rgba(255, 251, 238, 0.9)', radius: 26 });
  flagIcon(ctx, 322, 142, 44, time);
  flagIcon(ctx, 958, 142, 44, time + 1);
  ctx.save();
  ctx.translate(640, 166);
  ctx.rotate(Math.sin(time * 1.4) * 0.012);
  outlineText(ctx, 'TIDEFORT', 0, 0, { size: 92, align: 'center', color: '#ffffff', stroke: PALETTE.coralDark, width: 18, weight: 900 });
  outlineText(ctx, 'TIDEFORT', 0, 0, { size: 92, align: 'center', color: PALETTE.coral, stroke: PALETTE.outline, width: 7, weight: 900 });
  ctx.restore();
  plainText(ctx, 'Hold your sandcastle flag through 7 rising tides', 640, 204, { size: 23, align: 'center', color: PALETTE.ink, weight: 800 });
  button(ctx, 'CLICK TO START', 640, 236, 300, 40, time);
  if (best > 0) plainText(ctx, `BEST ${best.toLocaleString('en-US')}`, 982, 252, { size: 14, align: 'right', color: '#6b5a48', weight: 800 });
}

export function drawControls(ctx, time) {
  tint(ctx, 'rgba(143, 214, 255, 0.35)');
  panel(ctx, 190, 120, 900, 480, { radius: 24 });
  outlineText(ctx, 'HOW TO PLAY', 640, 190, { size: 58, align: 'center', color: PALETTE.coral, stroke: '#ffffff', width: 8 });
  plainText(ctx, 'Keep the flag standing through 7 tides. Waves roll down the lanes and wear your sand away.', 640, 226, { size: 21, align: 'center' });
  const rows = [
    ['1 2 3', 'Pick WALL, TOWER or MOAT, then CLICK a sand cell to build it'],
    ['CLICK', 'on a damaged wall to PATCH it (patch one below 40% for a PERFECT combo)'],
    ['CLICK', 'on a crab, gull or log to squash it. Towers shoot pests for you'],
    ['RIGHT-CLICK', 'upgrade a structure (3 levels, costs sand)'],
    ['SPACE', 'scoop sand in a tide, or start the tide early while building'],
    ['P  M  R', 'pause, mute, rebuild from scratch'],
  ];
  rows.forEach(([keys, text], i) => {
    const y = 278 + i * 46;
    roundRectPath(ctx, 222, y - 28, 170, 38, 10);
    ctx.fillStyle = '#ffe9a8';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = PALETTE.outline;
    ctx.stroke();
    plainText(ctx, keys, 307, y - 2, { size: 21, weight: 900, align: 'center', color: PALETTE.coralDark });
    plainText(ctx, text, 412, y - 1, { size: 19 });
  });
  outlineText(ctx, 'WIN: survive 7 tides   LOSE: the sea reaches your flag', 640, 556, { size: 25, align: 'center', color: '#ffffff', stroke: PALETTE.coralDark, width: 6 });
  button(ctx, 'CLICK TO BEGIN', 640, 592, 300, 44, time);
}

export function upgradeCardRect(index) {
  const total = CARD.w * 3 + CARD.gap * 2;
  return { x: (FIELD.width - total) / 2 + index * (CARD.w + CARD.gap), y: CARD.y, w: CARD.w, h: CARD.h };
}

export function drawUpgradePick(ctx, game, time, hover) {
  tint(ctx, 'rgba(20, 90, 130, 0.3)');
  outlineText(ctx, `TIDE ${game.tide} SURVIVED`, 640, 118, { size: 64, align: 'center', color: '#ffffff', stroke: PALETTE.outline, width: 12 });
  outlineText(ctx, 'Pick ONE upgrade to keep for the rest of the run', 640, 166, { size: 28, align: 'center', color: PALETTE.gold, width: 6 });
  game.choices.forEach((card, i) => {
    const r = upgradeCardRect(i);
    const lift = hover === i ? -8 : 0;
    const top = r.y + lift;
    panel(ctx, r.x, top, r.w, r.h, { fill: hover === i ? '#fffbe6' : PALETTE.panel, radius: 20, line: hover === i ? 5 : 3, stroke: hover === i ? PALETTE.coral : PALETTE.outline });
    roundRectPath(ctx, r.x + 18, top + 28, 84, 84, 42);
    ctx.fillStyle = '#d7f5ef';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = PALETTE.outline;
    ctx.stroke();
    icon(ctx, card.icon, r.x + 60, top + 70, 28);
    plainText(ctx, card.name, r.x + 114, top + 52, { size: 25, weight: 900, color: PALETTE.coralDark });
    ctx.font = '700 18px sans-serif';
    wrap(ctx, card.desc, r.w - 134).forEach((line, li) => {
      plainText(ctx, line, r.x + 114, top + 82 + li * 23, { size: 18, weight: 700 });
    });
    panel(ctx, r.x + r.w / 2 - 70, top + r.h - 52, 140, 38, { fill: PALETTE.coral, radius: 19, shadow: false });
    outlineText(ctx, `PRESS ${i + 1}`, r.x + r.w / 2, top + r.h - 24, { size: 22, align: 'center', color: '#ffffff', width: 5 });
  });
  plainText(ctx, 'Click a card or press 1, 2 or 3', 640, 572, { size: 22, align: 'center', color: '#ffffff', weight: 800 });
  void time;
}

export function drawPause(ctx, time) {
  tint(ctx, 'rgba(255, 255, 255, 0.5)');
  panel(ctx, 400, 220, 480, 240, { radius: 24 });
  outlineText(ctx, 'PAUSED', 640, 320, { size: 84, align: 'center', color: PALETTE.sea, stroke: PALETTE.outline, width: 14 });
  plainText(ctx, 'Press P or click to carry on', 640, 376, { size: 26, align: 'center' });
  plainText(ctx, 'R rebuild from scratch   M mute', 640, 416, { size: 20, align: 'center', color: '#6b5a48' });
  void time;
}

function statRow(ctx, x, y, name, value) {
  plainText(ctx, name, x, y, { size: 21, weight: 800, color: '#6b5a48' });
  plainText(ctx, String(value), x + 300, y, { size: 26, weight: 900, align: 'right' });
}

export function drawEnd(ctx, game, best, won, time, isNewBest) {
  tint(ctx, won ? 'rgba(255, 233, 150, 0.35)' : 'rgba(18, 100, 140, 0.45)');
  panel(ctx, 220, 96, 840, 520, { radius: 28 });
  const title = won ? 'THE CASTLE STANDS' : 'WASHED AWAY';
  outlineText(ctx, title, 640, 192, { size: won ? 76 : 98, align: 'center', color: won ? PALETTE.gold : PALETTE.coral, stroke: PALETTE.outline, width: 16, weight: 900 });
  plainText(ctx, won ? `All ${TOTAL_TIDES} tides survived - your flag still flies!` : `The sea reached your flag on tide ${game.tide} of ${TOTAL_TIDES}`, 640, 232, { size: 25, align: 'center', weight: 800 });
  outlineText(ctx, game.score.toLocaleString('en-US'), 640, 318, { size: 92, align: 'center', color: '#ffffff', stroke: PALETTE.coralDark, width: 16, weight: 900 });
  plainText(ctx, isNewBest ? 'NEW BEST SCORE!' : `BEST ${best.toLocaleString('en-US')}`, 640, 362, { size: 26, weight: 900, align: 'center', color: isNewBest ? PALETTE.coral : '#6b5a48' });
  const s = game.stats;
  statRow(ctx, 306, 412, 'Tides survived', `${s.tidesSurvived}/${TOTAL_TIDES}`);
  statRow(ctx, 306, 446, 'Waves blocked', s.blocked);
  statRow(ctx, 306, 480, 'Pests squashed', s.crabs + s.gulls + s.logs);
  statRow(ctx, 674, 412, 'Perfect patches', s.perfect);
  statRow(ctx, 674, 446, 'Best combo', `x${s.bestCombo}`);
  statRow(ctx, 674, 480, 'Structures built', s.built);
  button(ctx, 'PRESS R TO REBUILD', 640, 556, 460, 58, time);
  plainText(ctx, 'or click anywhere', 640, 596, { size: 16, align: 'center', color: '#6b5a48' });
}
