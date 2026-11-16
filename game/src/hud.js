// The always-visible HUD: top bar (tide, timer, sand, castle, flag, score and combo), the tool
// palette and threat card down the sides, and the bottom strip with the win/lose rule and the
// controls. Also the big centre banners ("TIDE 3 IS COMING", "ROGUE WAVE INCOMING").
import { COMBO, FIELD, PALETTE, SCOOP, TIDE_PLAN, TOOLS, TOTAL_TIDES } from './config.js';
import { bar, flagIcon, icon, mmss, outlineText, panel, plainText, roundRectPath } from './draw.js';
import { comboMultiplier } from './score.js';
import { planFor, tideTimeLeft } from './tides.js';
import { UPGRADES } from './upgrades.js';
import { upgradeCost } from './walls.js';
import { structureAt, cellAt } from './beach.js';

function label(ctx, text, x, y) {
  plainText(ctx, text, x, y, { size: 15, color: '#2b5876', weight: 800 });
}

function drawTopBar(ctx, game, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, 76);
  grad.addColorStop(0, PALETTE.skyDeep);
  grad.addColorStop(1, PALETTE.sky);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, 76);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  for (const [cx, cy, r] of [[420, 20, 26], [452, 28, 20], [388, 30, 18], [1090, 18, 24], [1120, 26, 18]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(1248, 14, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 210, 63, 0.35)';
  ctx.beginPath();
  ctx.arc(1248, 14, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.outline;
  ctx.fillRect(0, 74, FIELD.width, 4);

  // TIDE n/7
  panel(ctx, 12, 8, 196, 60, { fill: PALETTE.coral, radius: 14 });
  outlineText(ctx, `TIDE ${game.tide}/${TOTAL_TIDES}`, 110, 52, { size: 38, align: 'center', width: 7 });

  // timer
  const building = game.phase === 'build';
  const left = building ? game.buildLeft : tideTimeLeft(game);
  const total = building ? (game.tide === 1 ? 30 : 22) : planFor(game.tide).seconds;
  label(ctx, building ? 'BUILD TIME' : 'TIDE TIMER', 224, 24);
  outlineText(ctx, mmss(left), 224, 58, { size: 34, color: building ? '#fff3b0' : '#ffffff' });
  bar(ctx, 308, 38, 120, 18, left / total, building ? PALETTE.gold : PALETTE.seaDeep);

  // sand
  label(ctx, 'SAND', 454, 24);
  icon(ctx, 'bucket', 468, 48, 13);
  outlineText(ctx, String(Math.floor(game.sand)), 490, 58, { size: 34, color: '#fff3b0' });

  // castle integrity
  label(ctx, 'CASTLE', 586, 24);
  const frac = game.castle.hp / game.castle.maxHp;
  bar(ctx, 586, 32, 190, 28, frac, frac > 0.5 ? PALETTE.green : frac > 0.25 ? PALETTE.gold : PALETTE.coral);
  outlineText(ctx, `${Math.ceil(game.castle.hp)}/${game.castle.maxHp}`, 681, 54, { size: 22, align: 'center', width: 5 });

  // flag health
  label(ctx, 'FLAG', 800, 24);
  for (let i = 0; i < game.castle.maxFlag; i += 1) {
    ctx.globalAlpha = i < game.castle.flag ? 1 : 0.28;
    flagIcon(ctx, 806 + i * 28, 66, 30, time + i * 0.4);
  }
  ctx.globalAlpha = 1;

  // score and combo
  label(ctx, 'SCORE', 976, 24);
  outlineText(ctx, game.score.toLocaleString('en-US'), 976, 58, { size: 34 });
  if (game.combo > 0) {
    panel(ctx, 1100, 12, 118, 52, { fill: PALETTE.gold, radius: 12, shadow: false });
    outlineText(ctx, `COMBO x${comboMultiplier(game).toFixed(2)}`, 1159, 34, { size: 17, align: 'center', width: 4 });
    bar(ctx, 1112, 44, 94, 12, game.comboTimer / COMBO.decay, PALETTE.coral, 'rgba(74, 51, 34, 0.4)');
  } else {
    plainText(ctx, 'PATCH LOW WALLS', 1159, 30, { size: 13, color: '#2b5876', align: 'center', weight: 800 });
    plainText(ctx, 'TO START A COMBO', 1159, 48, { size: 13, color: '#2b5876', align: 'center', weight: 800 });
  }
}

function toolCard(ctx, game, view) {
  const x = 10;
  const y = 176;
  panel(ctx, x, y, 236, 384, { radius: 16 });
  plainText(ctx, 'BUILD  (keys 1-3)', x + 118, y + 28, { size: 19, align: 'center', weight: 900, color: PALETTE.coralDark });
  TOOLS.forEach((tool, i) => {
    const ty = y + 40 + i * 62;
    const selected = game.tool === tool.id;
    roundRectPath(ctx, x + 10, ty, 216, 54, 12);
    ctx.fillStyle = selected ? '#fff0a8' : '#f7ead0';
    ctx.fill();
    ctx.lineWidth = selected ? 4 : 2.5;
    ctx.strokeStyle = selected ? PALETTE.coral : PALETTE.outline;
    ctx.stroke();
    plainText(ctx, tool.key, x + 26, ty + 36, { size: 28, weight: 900, color: PALETTE.coralDark });
    plainText(ctx, tool.label, x + 56, ty + 24, { size: 21, weight: 900 });
    plainText(ctx, tool.blurb, x + 56, ty + 44, { size: 14, weight: 700, color: '#6b5a48' });
    const afford = game.sand >= tool.cost;
    plainText(ctx, `${tool.cost}`, x + 208, ty + 36, { size: 26, weight: 900, align: 'right', color: afford ? '#2f8f4e' : PALETTE.coral });
  });
  const by = y + 232;
  plainText(ctx, 'CLICK: build / patch / squash', x + 118, by, { size: 15, align: 'center', color: '#2b2a3a' });
  plainText(ctx, 'RIGHT-CLICK: upgrade', x + 118, by + 20, { size: 15, align: 'center', color: '#2b2a3a' });
  // scoop meter
  const ready = game.scoopCooldown <= 0;
  roundRectPath(ctx, x + 10, by + 34, 216, 50, 12);
  ctx.fillStyle = ready ? '#d7f5ef' : '#e8e0d0';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.outline;
  ctx.stroke();
  icon(ctx, 'bucket', x + 36, by + 58, 14);
  plainText(ctx, `SPACE  SCOOP +${SCOOP.sand + game.mods.scoopBonus}`, x + 62, by + 56, { size: 17, weight: 900 });
  bar(ctx, x + 62, by + 64, 150, 10, ready ? 1 : 1 - game.scoopCooldown / (SCOOP.cooldown * game.mods.scoopCooldown), ready ? PALETTE.green : PALETTE.gold);
  // hovered structure
  const hover = view.cursor ? cellAt(view.cursor.x, view.cursor.y) : null;
  const s = hover ? structureAt(game.beach, hover.col, hover.row) : null;
  const iy = by + 104;
  if (s) {
    const cost = upgradeCost(s);
    plainText(ctx, `${s.kind.toUpperCase()}  LV ${s.level}`, x + 118, iy, { size: 18, weight: 900, align: 'center', color: PALETTE.coralDark });
    if (s.kind !== 'moat') plainText(ctx, `${Math.ceil(s.hp)}/${Math.round(s.maxHp)} HP`, x + 118, iy + 20, { size: 15, align: 'center' });
    plainText(ctx, cost === null ? 'MAX LEVEL' : `upgrade: ${cost} sand`, x + 118, iy + 40, { size: 15, align: 'center', color: '#6b5a48' });
  } else {
    plainText(ctx, 'Hover a structure', x + 118, iy + 4, { size: 15, align: 'center', color: '#6b5a48' });
    plainText(ctx, 'to see its health', x + 118, iy + 22, { size: 15, align: 'center', color: '#6b5a48' });
  }
}

function threatCard(ctx, game) {
  const x = 1034;
  const y = 176;
  panel(ctx, x, y, 236, 384, { radius: 16 });
  plainText(ctx, 'THIS TIDE', x + 118, y + 28, { size: 19, align: 'center', weight: 900, color: PALETTE.coralDark });
  const plan = planFor(game.tide);
  const rows = [
    ['sea', 'WAVES', plan.waves, game.stats.blocked],
    ['crab', 'CRABS', plan.crabs, null],
    ['gull', 'GULLS', plan.gulls, null],
    ['log', 'DRIFTWOOD', plan.logs, null],
  ];
  rows.forEach(([ic, name, count], i) => {
    const ry = y + 62 + i * 40;
    if (ic === 'sea') {
      ctx.fillStyle = PALETTE.sea;
      ctx.beginPath();
      ctx.arc(x + 34, ry - 6, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = PALETTE.outline;
      ctx.stroke();
    } else {
      icon(ctx, ic, x + 34, ry - 6, 12);
    }
    const active = count > 0;
    plainText(ctx, name, x + 58, ry, { size: 18, weight: 900, color: active ? PALETTE.ink : '#a09680' });
    plainText(ctx, active ? `x${count}` : '-', x + 222, ry, { size: 20, weight: 900, align: 'right', color: active ? PALETTE.coralDark : '#a09680' });
  });
  let ty = y + 232;
  if (plan.rogue > 0) {
    roundRectPath(ctx, x + 10, ty - 22, 216, 34, 10);
    ctx.fillStyle = '#ffd9d3';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = PALETTE.coral;
    ctx.stroke();
    plainText(ctx, `ROGUE WAVE x${plan.rogue}`, x + 118, ty, { size: 19, weight: 900, align: 'center', color: PALETTE.coralDark });
  } else {
    plainText(ctx, game.tide < 7 ? `Tide ${game.tide + 1} brings ${nextThreat(game.tide)}` : '', x + 118, ty, { size: 14, align: 'center', color: '#6b5a48' });
  }
  ty += 36;
  plainText(ctx, 'BLOCKED', x + 20, ty, { size: 15, weight: 800, color: '#6b5a48' });
  plainText(ctx, String(game.stats.blocked), x + 216, ty, { size: 20, weight: 900, align: 'right' });
  plainText(ctx, 'PESTS SQUASHED', x + 20, ty + 26, { size: 15, weight: 800, color: '#6b5a48' });
  plainText(ctx, String(game.stats.crabs + game.stats.gulls + game.stats.logs), x + 216, ty + 26, { size: 20, weight: 900, align: 'right' });
  plainText(ctx, 'PERFECT PATCHES', x + 20, ty + 52, { size: 15, weight: 800, color: '#6b5a48' });
  plainText(ctx, String(game.stats.perfect), x + 216, ty + 52, { size: 20, weight: 900, align: 'right' });
  // upgrades owned
  game.taken.slice(-8).forEach((id, i) => {
    const up = UPGRADES.find((u) => u.id === id);
    if (up) icon(ctx, up.icon, x + 26 + (i % 8) * 26, ty + 88, 9);
  });
  if (game.taken.length === 0) plainText(ctx, 'upgrades appear here', x + 118, ty + 92, { size: 14, align: 'center', color: '#a09680' });
}

function nextThreat(tide) {
  const now = TIDE_PLAN[tide - 1];
  const next = TIDE_PLAN[tide];
  if (next.rogue > 0) return 'the ROGUE WAVE';
  if (next.logs > 0 && now.logs === 0) return 'driftwood';
  if (next.gulls > 0 && now.gulls === 0) return 'gulls';
  if (next.crabs > 0 && now.crabs === 0) return 'crabs';
  return 'bigger seas';
}

function drawBottom(ctx) {
  ctx.fillStyle = PALETTE.outline;
  ctx.fillRect(0, 654, FIELD.width, 66);
  ctx.fillStyle = '#fff6dc';
  ctx.fillRect(0, 658, FIELD.width, 62);
  outlineText(ctx, 'WIN: survive 7 tides  ·  LOSE: the sea reaches your flag', 640, 686, { size: 29, color: '#ffffff', align: 'center', width: 7, stroke: PALETTE.coralDark });
  plainText(ctx, 'CLICK build/patch/squash   RIGHT-CLICK upgrade   1-3 tool   SPACE scoop / start tide   P pause   M mute', 640, 712, { size: 17, align: 'center', color: '#4a3322' });
}

function drawBanner(ctx, game) {
  const b = game.banner;
  if (!b) return;
  const fade = Math.min(1, (b.life - b.age) * 2.5, b.age * 5);
  ctx.globalAlpha = Math.max(0, fade);
  const w = 640;
  panel(ctx, 640 - w / 2, 84, w, 78, { fill: b.alert ? PALETTE.coral : 'rgba(255, 251, 238, 0.94)', radius: 18 });
  outlineText(ctx, b.text, 640, 128, { size: 46, align: 'center', color: b.alert ? '#ffffff' : PALETTE.coralDark, stroke: b.alert ? PALETTE.coralDark : '#ffffff', width: 6 });
  plainText(ctx, b.sub, 640, 152, { size: 18, align: 'center', color: b.alert ? '#fff6dc' : '#4a3322' });
  ctx.globalAlpha = 1;
}

export function drawHud(ctx, game, view) {
  drawTopBar(ctx, game, view.time);
  toolCard(ctx, game, view);
  threatCard(ctx, game);
  drawBottom(ctx);
  drawBanner(ctx, game);
}

/** Which tool button (if any) sits under a pixel in the left card. */
export function toolAt(x, y) {
  for (let i = 0; i < TOOLS.length; i += 1) {
    const ty = 176 + 40 + i * 62;
    if (x >= 20 && x <= 236 && y >= ty && y <= ty + 54) return TOOLS[i].id;
  }
  return null;
}
