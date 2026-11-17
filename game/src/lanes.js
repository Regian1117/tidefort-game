// The tide's plan, rolled before the build phase so the player can read it: which lanes the sea
// will hit, how hard, and which lanes the pests will use. Wave patterns are only different
// schedules of the one wave primitive: single, swell (a big crest with shoulders), double crest,
// cross (a surge sweeping across lanes) and rip (one lane that keeps coming).
import { GRID, TIDE_PLAN, TOTAL_TIDES, WAVE } from './config.js';

export function planFor(tide) {
  return TIDE_PLAN[Math.min(tide, TOTAL_TIDES) - 1];
}

export function basePowerFor(tide) {
  return WAVE.basePower + WAVE.powerPerTide * (tide - 1);
}

const ROGUE_POWER = [48, 66];
export const WARN_LEAD = 4.5;

function pickLane(random, taken) {
  for (let tries = 0; tries < 8; tries += 1) {
    const lane = Math.floor(random() * GRID.cols);
    if (!taken.has(lane) || tries === 7) return lane;
  }
  return 0;
}

function addPattern(events, kind, t, lane, power, name) {
  if (kind === 'wave') events.push({ t, kind: 'wave', lane, power, name });
  else if (kind === 'swell') {
    events.push({ t, kind: 'wave', lane, power: power * 1.55, name });
    if (lane > 0) events.push({ t: t + 0.1, kind: 'wave', lane: lane - 1, power: power * 0.85, name });
    if (lane < GRID.cols - 1) events.push({ t: t + 0.1, kind: 'wave', lane: lane + 1, power: power * 0.85, name });
  } else if (kind === 'double') {
    events.push({ t, kind: 'wave', lane, power: power * 1.1, name });
    events.push({ t: t + 1.25, kind: 'wave', lane, power: power * 1.1, name });
  } else if (kind === 'cross') {
    const dir = lane < GRID.cols / 2 ? 1 : -1;
    const start = dir > 0 ? 0 : GRID.cols - 1;
    for (let i = 0; i < 5; i += 1) events.push({ t: t + i * 0.42, kind: 'wave', lane: start + dir * (i + lane % 3) , power: power * 1.05, name });
  } else if (kind === 'rip') {
    for (let i = 0; i < 4; i += 1) events.push({ t: t + i * 0.8, kind: 'wave', lane, power: power * 0.8, name });
  }
}

/** Roll the whole tide: a time-sorted list of wave, pest and rogue events. */
export function rollPlan(game, tide) {
  const plan = planFor(tide);
  const r = game.random;
  const power = basePowerFor(tide);
  const events = [];
  const patterns = [];
  for (const [kind, count] of Object.entries(plan.mix)) for (let i = 0; i < count; i += 1) patterns.push(kind);
  for (let i = patterns.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [patterns[i], patterns[j]] = [patterns[j], patterns[i]];
  }
  const span = plan.seconds - 7 - (plan.rogue ? 14 : 0);
  const taken = new Set();
  patterns.forEach((kind, i) => {
    const lane = pickLane(r, taken);
    taken.add(lane);
    if (taken.size > 6) taken.clear();
    const t = 3 + (i / patterns.length) * span + r() * 2;
    addPattern(events, kind, t, kind === 'cross' ? Math.floor(r() * 6) : lane, power * (0.9 + r() * 0.2), kind);
  });
  const spread = (n, kind, from) => {
    for (let i = 0; i < n; i += 1) events.push({ t: from + (i / n) * (plan.seconds - from - 10) + r() * 2, kind, lane: Math.floor(r() * GRID.cols) });
  };
  spread(plan.crabs, 'crab', 4);
  spread(plan.gulls, 'gull', 10);
  spread(plan.logs, 'log', 8);
  for (let i = 0; i < plan.rogue; i += 1) {
    const t = plan.seconds - 6 - i * 16;
    events.push({ t: t - WARN_LEAD, kind: 'warn', index: i }, { t, kind: 'rogue', index: i, power: ROGUE_POWER[i] });
  }
  events.sort((a, b) => a.t - b.t);
  return events;
}

/** Per lane summary of a plan for the telegraph arrows: peak strength, number of hits, pests. */
export function forecast(events) {
  const lanes = [];
  for (let c = 0; c < GRID.cols; c += 1) lanes.push({ lane: c, peak: 0, hits: 0, crab: false, log: false, name: '' });
  for (const e of events) {
    if (e.kind === 'wave') {
      const l = lanes[e.lane];
      l.hits += 1;
      if (e.power > l.peak) {
        l.peak = e.power;
        l.name = e.name;
      }
    } else if (e.kind === 'crab') lanes[e.lane].crab = true;
    else if (e.kind === 'log') lanes[e.lane].log = true;
  }
  return lanes;
}

/** The lanes a wave is about to hit within `lead` seconds of the tide clock (for flashing arrows). */
export function imminentLanes(events, tideTime, lead) {
  const lanes = new Set();
  for (const e of events) {
    if (e.t > tideTime + lead) break;
    if (e.kind === 'wave') lanes.add(e.lane);
  }
  return lanes;
}

export function rogueIncoming(events) {
  return events.some((e) => e.kind === 'rogue');
}
