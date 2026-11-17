// The slim HUD. A top bar (tide, timer, sand, bucket, castle, flag, score and combo), two small
// translucent cards over the beach margins (the build tools on the left, this tide's threats on the
// right), a bottom strip with the win/lose rule and the controls, and the big centre banners
// ("TIDE 3 IS COMING", "ROGUE WAVE INCOMING").
import { BARS, COMBO, FIELD, FIRST_BUILD_SECONDS, BUILD_SECONDS, PALETTE, TOOLS, TOTAL_TIDES } from './config.js';
import { bar, flagIcon, icon, mmss, outlineText, panel, plainText, roundRectPath } from './draw.js';
import { comboMultiplier } from './score.js';
import { planFor, tideTimeLeft } from './tides.js';
import { UPGRADES } from './upgrades.js';

const TOOL_BOX = { x: 10, y: 160, w: 134 };

function label(ctx, text, x, y) {
  plainText(ctx, text, x, y, { size: 12, color: '#1f5a7a', weight: 900 });
}

function drawTopBar(ctx, game, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, BARS.top);
  grad.addColorStop(0, PALETTE.skyDeep);
  grad.addColorStop(1, PALETTE.sky);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, BARS.top);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (const [cx, cy, r] of [[560, 14, 20], [586, 22, 15], [1010, 12, 18], [1036, 20, 14]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(1250, 12, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.outline;
  ctx.fillRect(0, BARS.top - 3, FIELD.width, 3);

  panel(ctx, 8, 6, 172, 42, { fill: PALETTE.coral, radius: 12, shadow: false });
  outlineText(ctx, `TIDE ${game.tide}/${TOTAL_TIDES}`, 94, 40, { size: 30, align: 'center', width: 6 });

  const building = game.phase === 'build' || game.phase === 'between';
  const left = game.phase === 'build' ? game.buildLeft : game.phase === 'between' ? 0 : tideTimeLeft(game);
  const total = building ? (game.tide === 1 ? FIRST_BUILD_SECONDS : BUILD_SECONDS) : planFor(game.tide).seconds;
  label(ctx, building ? 'BUILD TIME' : 'TIDE TIMER', 194, 18);
  outlineText(ctx, mmss(left), 194, 46, { size: 28, color: building ? '#fff3b0' : '#ffffff', width: 5 });
  bar(ctx, 268, 30, 70, 14, left / total, building ? PALETTE.gold : PALETTE.seaDeep);

  label(ctx, 'SAND', 356, 18);
  icon(ctx, 'coin', 366, 36, 9);
  outlineText(ctx, String(Math.floor(game.sand)), 382, 46, { size: 28, color: '#fff3b0', width: 5 });

  label(ctx, 'BUCKET', 456, 18);
  icon(ctx, 'bucket', 466, 36, 9);
  bar(ctx, 482, 28, 82, 16, game.kid.carry / game.kid.cap, PALETTE.sandDark, 'rgba(43, 42, 58, 0.4)');
  outlineText(ctx, `${Math.floor(game.kid.carry)}/${game.kid.cap}`, 523, 42, { size: 13, align: 'center', width: 3 });

  label(ctx, 'CASTLE', 590, 18);
  const frac = game.castle.hp / game.castle.maxHp;
  bar(ctx, 590, 24, 150, 22, frac, frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.coral);
  outlineText(ctx, `${Math.ceil(game.castle.hp)}/${game.castle.maxHp}`, 665, 42, { size: 16, align: 'center', width: 4 });

  label(ctx, 'FLAG', 760, 18);
  for (let i = 0; i < game.castle.maxFlag; i += 1) {
    ctx.globalAlpha = i < game.castle.flag ? 1 : 0.28;
    flagIcon(ctx, 766 + i * 25, 52, 28, time + i * 0.4);
  }
  ctx.globalAlpha = 1;

  label(ctx, 'SCORE', 906, 18);
  outlineText(ctx, game.score.toLocaleString('en-US'), 906, 46, { size: 28, width: 5 });
  if (game.combo > 0) {
    panel(ctx, 1040, 8, 150, 40, { fill: PALETTE.gold, radius: 12, shadow: false });
    outlineText(ctx, `COMBO x${comboMultiplier(game).toFixed(2)}`, 1115, 28, { size: 17, align: 'center', width: 4 });
    bar(ctx, 1052, 34, 126, 8, game.comboTimer / COMBO.decay, PALETTE.coral, 'rgba(74, 51, 34, 0.4)');
  } else {
    plainText(ctx, 'STOMP CRABS, PATCH', 1115, 24, { size: 12, color: '#1f5a7a', align: 'center', weight: 900 });
    plainText(ctx, 'LOW WALLS: COMBO', 1115, 40, { size: 12, color: '#1f5a7a', align: 'center', weight: 900 });
  }
}

function toolCard(ctx, game) {
  const { x, y, w } = TOOL_BOX;
  panel(ctx, x, y, w, 40 + TOOLS.length * 46, { fill: 'rgba(255, 251, 238, 0.86)', radius: 14 });
  plainText(ctx, 'BUILD (1-3)', x + w / 2, y + 25, { size: 15, align: 'center', weight: 900, color: PALETTE.coralDark });
  TOOLS.forEach((tool, i) => {
    const ty = y + 36 + i * 46;
    const selected = game.tool === tool.id;
    roundRectPath(ctx, x + 8, ty, w - 16, 40, 10);
    ctx.fillStyle = selected ? '#fff0a8' : '#f7ead0';
    ctx.fill();
    ctx.lineWidth = selected ? 4 : 2.5;
    ctx.strokeStyle = selected ? PALETTE.coral : PALETTE.outline;
    ctx.stroke();
    plainText(ctx, tool.key, x + 22, ty + 28, { size: 22, weight: 900, color: PALETTE.coralDark });
    plainText(ctx, tool.label, x + 40, ty + 18, { size: 15, weight: 900 });
    plainText(ctx, tool.blurb, x + 40, ty + 33, { size: 11, weight: 700, color: '#6b5a48' });
    plainText(ctx, String(tool.cost), x + w - 14, ty + 28, { size: 18, weight: 900, align: 'right', color: game.sand >= tool.cost ? '#2f8f4e' : PALETTE.coral });
  });
}

function threatCard(ctx, game) {
  const x = FIELD.width - 144;
  const y = 160;
  const plan = planFor(game.tide);
  panel(ctx, x, y, 134, 188, { fill: 'rgba(255, 251, 238, 0.86)', radius: 14 });
  plainText(ctx, 'THIS TIDE', x + 67, y + 25, { size: 15, align: 'center', weight: 900, color: PALETTE.coralDark });
  const surges = Object.values(plan.mix).reduce((a, b) => a + b, 0);
  const rows = [['sea', 'SURGES', surges], ['crab', 'CRABS', plan.crabs], ['gull', 'GULLS', plan.gulls], ['log', 'LOGS', plan.logs]];
  rows.forEach(([ic, name, count], i) => {
    const ry = y + 52 + i * 28;
    if (ic === 'sea') {
      ctx.fillStyle = PALETTE.sea;
      ctx.beginPath();
      ctx.arc(x + 20, ry - 6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = PALETTE.outline;
      ctx.stroke();
    } else icon(ctx, ic, x + 20, ry - 6, 9);
    plainText(ctx, name, x + 36, ry, { size: 14, weight: 900, color: count > 0 ? PALETTE.ink : '#a09680' });
    plainText(ctx, count > 0 ? `x${count}` : '-', x + 122, ry, { size: 16, weight: 900, align: 'right', color: count > 0 ? PALETTE.coralDark : '#a09680' });
  });
  if (plan.rogue > 0) {
    roundRectPath(ctx, x + 8, y + 160, 118, 22, 8);
    ctx.fillStyle = '#ffd9d3';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = PALETTE.coral;
    ctx.stroke();
    plainText(ctx, `ROGUE WAVE x${plan.rogue}`, x + 67, y + 176, { size: 12, weight: 900, align: 'center', color: PALETTE.coralDark });
  } else {
    game.taken.slice(-6).forEach((id, i) => {
      const up = UPGRADES.find((u) => u.id === id);
      if (up) icon(ctx, up.icon, x + 20 + (i % 6) * 19, y + 168, 7);
    });
  }
}

function drawBottom(ctx) {
  ctx.fillStyle = PALETTE.outline;
  ctx.fillRect(0, BARS.bottom, FIELD.width, FIELD.height - BARS.bottom);
  ctx.fillStyle = '#fff6dc';
  ctx.fillRect(0, BARS.bottom + 3, FIELD.width, FIELD.height - BARS.bottom - 3);
  outlineText(ctx, 'WIN: survive 7 tides  ·  LOSE: the sea reaches your flag', 640, 700, { size: 24, color: '#ffffff', align: 'center', width: 6, stroke: PALETTE.coralDark });
  plainText(ctx, 'WASD move kid   SPACE fill / patch / swat / deposit   CLICK build / upgrade   1-3 tool   P pause   M mute', 640, 716, { size: 13, align: 'center', color: '#4a3322' });
}

function drawBanner(ctx, game) {
  const b = game.banner;
  if (!b) return;
  ctx.globalAlpha = Math.max(0, Math.min(1, (b.life - b.age) * 2.5, b.age * 5));
  panel(ctx, 340, BARS.top + 8, 600, 74, { fill: b.alert ? PALETTE.coral : 'rgba(255, 251, 238, 0.94)', radius: 18 });
  outlineText(ctx, b.text, 640, BARS.top + 56, { size: 42, align: 'center', color: b.alert ? '#ffffff' : PALETTE.coralDark, stroke: b.alert ? PALETTE.coralDark : '#ffffff', width: 6 });
  plainText(ctx, b.sub, 640, BARS.top + 76, { size: 16, align: 'center', color: b.alert ? '#fff6dc' : '#4a3322' });
  ctx.globalAlpha = 1;
}

export function drawHud(ctx, game, view) {
  drawTopBar(ctx, game, view.time);
  toolCard(ctx, game);
  threatCard(ctx, game);
  drawBottom(ctx);
  drawBanner(ctx, game);
  drawStartButton(ctx, game, view.time);
}

/** Which tool button (if any) sits under a pixel in the left card. */
export function toolAt(x, y) {
  for (let i = 0; i < TOOLS.length; i += 1) {
    const ty = TOOL_BOX.y + 36 + i * 46;
    if (x >= TOOL_BOX.x + 8 && x <= TOOL_BOX.x + TOOL_BOX.w - 8 && y >= ty && y <= ty + 40) return TOOLS[i].id;
  }
  return null;
}

const START_BUTTON = { x: 480, y: 636, w: 320, h: 34 };

/** The "start the tide" pill shown while building; Enter does the same. */
export function drawStartButton(ctx, game, time) {
  if (game.phase !== 'build') return;
  const b = START_BUTTON;
  const pulse = 1 + Math.sin(time * 5) * 0.03;
  ctx.save();
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
  ctx.scale(pulse, pulse);
  panel(ctx, -b.w / 2, -b.h / 2, b.w, b.h, { fill: PALETTE.coral, radius: 17 });
  outlineText(ctx, 'ENTER: START THE TIDE', 0, 7, { size: 19, align: 'center', width: 4 });
  ctx.restore();
}

export function startButtonAt(x, y) {
  const b = START_BUTTON;
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}
