// Full-screen overlays drawn over the beach: title (over live attract play), the controls card,
// the upgrade pick, pause, and the two endings: THE CASTLE STANDS and WASHED AWAY.
import { FIELD, PALETTE, TOTAL_TIDES } from './config.js';
import { waterlineFor } from './beach.js';
import { planFor } from './lanes.js';
import { flagIcon, icon, outlineText, panel, plainText, roundRectPath } from './draw.js';

const CARD = { w: 400, h: 120, gap: 20, y: 102 };

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
  plainText(ctx, 'The sea rises every tide. Read the arrows, build, then run the beach as the kid.', 640, 226, { size: 21, align: 'center' });
  const rows = [
    ['1 2 3 + CLICK', 'build a WALL (stops a wave), TOWER (shoots pests) or MOAT (drains waves sideways)'],
    ['CLICK / R-CLICK', 'on a structure to upgrade it. Sand is scarce: you cannot guard every lane'],
    ['W A S D', 'walk the kid. Stay out of the surge or you are washed back and spill your bucket'],
    ['SPACE', 'fill the bucket at the wet line, patch a crack, swat a gull, deposit at the castle'],
    ['WALK INTO', 'a crab to stomp it. Gulls dive for your bucket: swat them'],
    ['ENTER  P  M  R', 'start the tide, pause, mute, rebuild'],
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
  tint(ctx, 'rgba(20, 90, 130, 0.16)');
  drawNextTide(ctx, game, time);
  outlineText(ctx, `TIDE ${game.tide} SURVIVED`, 24, 92, { size: 36, color: '#ffffff', width: 8 });
  outlineText(ctx, 'PICK ONE UPGRADE (click or 1 2 3)', 372, 92, { size: 20, color: PALETTE.gold, width: 5 });
  game.choices.forEach((card, i) => {
    const r = upgradeCardRect(i);
    const top = r.y + (hover === i ? -5 : 0);
    panel(ctx, r.x, top, r.w, r.h, { fill: hover === i ? '#fffbe6' : PALETTE.panel, radius: 16, line: hover === i ? 5 : 3, stroke: hover === i ? PALETTE.coral : PALETTE.outline });
    roundRectPath(ctx, r.x + 12, top + 24, 62, 62, 31);
    ctx.fillStyle = '#d7f5ef';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = PALETTE.outline;
    ctx.stroke();
    icon(ctx, card.icon, r.x + 43, top + 56, 21);
    plainText(ctx, card.name, r.x + 86, top + 34, { size: 22, weight: 900, color: PALETTE.coralDark });
    ctx.font = '700 15px sans-serif';
    wrap(ctx, card.desc, r.w - 104).forEach((line, li) => {
      plainText(ctx, line, r.x + 86, top + 56 + li * 19, { size: 15, weight: 700 });
    });
    panel(ctx, r.x + r.w - 80, top + 8, 68, 24, { fill: PALETTE.coral, radius: 12, shadow: false });
    outlineText(ctx, `[${i + 1}]`, r.x + r.w - 46, top + 26, { size: 17, align: 'center', color: '#ffffff', width: 4 });
  });
}

/** What the next tide brings: the higher waterline as a dashed mark, and a rogue wave notice. */
function drawNextTide(ctx, game, time) {
  const y = waterlineFor(game.tide + 1);
  ctx.strokeStyle = PALETTE.coral;
  ctx.lineWidth = 5;
  ctx.setLineDash([18, 12]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(FIELD.width, y);
  ctx.stroke();
  ctx.setLineDash([]);
  outlineText(ctx, `TIDE ${game.tide + 1} WATERLINE`, 640, y + 22, { size: 18, align: 'center', color: '#ffffff', stroke: PALETTE.coralDark, width: 5 });
  const rogue = planFor(game.tide + 1).rogue;
  if (rogue > 0) {
    const pulse = 1 + Math.sin(time * 6) * 0.03;
    ctx.save();
    ctx.translate(1050, 78);
    ctx.scale(pulse, pulse);
    panel(ctx, -200, -20, 400, 40, { fill: PALETTE.coral, radius: 20, shadow: false });
    outlineText(ctx, `NEXT: ROGUE WAVE x${rogue}, EVERY LANE`, 0, 8, { size: 20, align: 'center', width: 5 });
    ctx.restore();
  }
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
