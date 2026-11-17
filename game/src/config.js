// Every tuning number, colour and name in one place. The playfield is a fixed 1280x720 logical
// area that the renderer scales to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const BEST_KEY = 'tidefort-best';

/** Slim bars: the top HUD bar and the bottom strip. The beach fills everything between. */
export const BARS = { top: 56, bottom: 676 };

/** The build grid: lanes run left to right, rows run from the sea down to the castle. */
export const GRID = { cols: 10, rows: 7, cellW: 96, cellH: 64, x: 160, y: 134 };
export const CASTLE = { top: 590, bottom: 676, x: GRID.x, width: GRID.cols * GRID.cellW };

export const TOTAL_TIDES = 7;

/** The resting waterline creeps up the beach every tide: dry land shrinks. */
export const WATERLINE = { first: 150, creep: 28, bob: 5 };

export const START_SAND = 46;
export const BUILD_BONUS_SAND = 16;
export const BUILD_SECONDS = 26;
export const FIRST_BUILD_SECONDS = 34;

export const CASTLE_HP = 100;
export const FLAG_HP = 5;

/** The three things the player can build, keyed 1 2 3. */
export const TOOLS = [
  { id: 'wall', key: '1', label: 'WALL', cost: 8, blurb: 'stops a wave' },
  { id: 'tower', key: '2', label: 'TOWER', cost: 18, blurb: 'shoots pests' },
  { id: 'moat', key: '3', label: 'MOAT', cost: 10, blurb: 'drains sideways' },
];

/** Per level (1..3): wall and tower hit points, tower reload, moat capacity (the biggest wave it can drain). */
export const STRUCTURE = {
  wall: { hp: [80, 130, 190], upgrade: [0, 12, 18] },
  tower: { hp: [44, 70, 100], upgrade: [0, 16, 24], range: 230, reload: [1.6, 1.15, 0.8], damage: [1, 1, 2] },
  moat: { hp: [1, 1, 1], upgrade: [0, 10, 16], capacity: [34, 50, 70] },
};

export const PATCH = { carry: 2, heal: 0.4, perfectBelow: 0.4, perfectBonus: 40, cooldown: 0.4 };

/** The beach kid: speed, bucket size, how fast the bucket fills at the wet line, how long a splash stuns. */
export const KID = { speed: 235, carry: 8, fillRate: 7, stun: 1.1, reach: 78, stomp: 40 };

/** Waves: speed of the surge and of the pull-back, power lost per dry row crossed, sideways drain. */
export const WAVE = { surge: 175, surgePerTide: 10, retreat: 110, rowLoss: 5, sideSpeed: 300, sideLoss: 0.09, basePower: 19, powerPerTide: 2.2 };

export const COMBO = { decay: 6, step: 0.25, max: 12 };

export const SCORE = { wave: 10, crab: 60, gull: 45, log: 80, tide: 150, castleHp: 2, flagHp: 100 };

/**
 * What each tide brings. `mix` counts the wave patterns: wave (one), swell (a big one with
 * shoulders), double (two crests in a lane), cross (a surge sweeping across lanes), rip (a narrow
 * lane that keeps coming). `rogue` is the number of rogue waves that hit every lane at once.
 */
export const TIDE_PLAN = [
  { seconds: 36, mix: { wave: 5, swell: 1 }, crabs: 1, gulls: 0, logs: 0, rogue: 0 },
  { seconds: 40, mix: { wave: 4, swell: 2, double: 1 }, crabs: 3, gulls: 0, logs: 0, rogue: 0 },
  { seconds: 44, mix: { wave: 3, swell: 2, double: 1, cross: 1 }, crabs: 3, gulls: 2, logs: 0, rogue: 0 },
  { seconds: 48, mix: { wave: 3, swell: 2, double: 2, cross: 1, rip: 1 }, crabs: 4, gulls: 2, logs: 1, rogue: 0 },
  { seconds: 52, mix: { wave: 3, swell: 2, double: 2, cross: 2, rip: 1 }, crabs: 5, gulls: 3, logs: 2, rogue: 0 },
  { seconds: 52, mix: { wave: 3, swell: 2, double: 2, cross: 2, rip: 1 }, crabs: 5, gulls: 3, logs: 2, rogue: 0 },
  { seconds: 66, mix: { swell: 2, double: 2, cross: 2, rip: 2 }, crabs: 6, gulls: 4, logs: 2, rogue: 2 },
];

export const PATTERN_NAMES = { wave: 'WAVE', swell: 'BIG SWELL', double: 'DOUBLE CREST', cross: 'SIDE SURGE', rip: 'RIP LANE' };

export const PALETTE = {
  outline: '#4a3322',
  sand: '#f4d9a0',
  sandDark: '#e3b975',
  sandWet: '#c99a5e',
  sea: '#27c4c4',
  seaDeep: '#0f8fb0',
  seaLight: '#8aeae2',
  foam: '#ffffff',
  coral: '#ff5a4a',
  coralDark: '#c93a35',
  sky: '#8fd6ff',
  skyDeep: '#4fb4f0',
  ink: '#2b2a3a',
  gold: '#ffd23f',
  green: '#4cc46a',
  panel: 'rgba(255, 251, 238, 0.92)',
};

export const FONT = "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif";
