// Every tuning number, colour and name in one place. The playfield is a fixed 1280x720 logical
// area that the renderer scales to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const BEST_KEY = 'tidefort-best';

/** The beach grid in front of the castle: lanes run left to right, rows run from the sea down to the castle. */
export const GRID = { cols: 12, rows: 6, cell: 64, x: 256, y: 168 };
export const SEA = { top: 76, bottom: 168 };
export const CASTLE = { top: 552, bottom: 650, x: GRID.x, width: GRID.cols * GRID.cell };

export const TOTAL_TIDES = 7;

export const START_SAND = 46;
export const BUILD_BONUS_SAND = 18;
export const BUILD_SECONDS = 22;

export const CASTLE_HP = 100;
export const FLAG_HP = 5;

/** The three things the player can build, keyed 1 2 3. */
export const TOOLS = [
  { id: 'wall', key: '1', label: 'WALL', cost: 6, blurb: 'blocks waves' },
  { id: 'tower', key: '2', label: 'TOWER', cost: 14, blurb: 'shoots pests' },
  { id: 'moat', key: '3', label: 'MOAT', cost: 8, blurb: 'drains waves' },
];

/** Hit points per level (1..3) for each kind of structure. A moat is a ditch: it never breaks. */
export const STRUCTURE = {
  wall: { hp: [60, 100, 150], upgrade: [0, 9, 15] },
  tower: { hp: [40, 62, 90], upgrade: [0, 14, 22], range: 3.4, reload: [1.7, 1.2, 0.8], damage: [1, 1, 2] },
  moat: { hp: [1, 1, 1], upgrade: [0, 8, 14], absorb: [0.3, 0.45, 0.6] },
};

export const PATCH = { cost: 2, heal: 0.4, perfectBelow: 0.4, perfectBonus: 40 };
export const SCOOP = { sand: 3, cooldown: 0.45 };

export const WAVE = { baseSpeed: 80, speedPerTide: 9, basePower: 20, powerPerTide: 10 };

export const COMBO = { decay: 6, step: 0.25, max: 12 };

export const SCORE = { wave: 10, crab: 60, gull: 45, log: 80, tide: 150, castleHp: 2, flagHp: 100 };

/** What each tide brings: how long it lasts, how many waves, and which pests join in. */
export const TIDE_PLAN = [
  { seconds: 28, waves: 12, crabs: 0, gulls: 0, logs: 0, rogue: 0 },
  { seconds: 32, waves: 17, crabs: 4, gulls: 0, logs: 0, rogue: 0 },
  { seconds: 36, waves: 21, crabs: 5, gulls: 2, logs: 0, rogue: 0 },
  { seconds: 40, waves: 25, crabs: 7, gulls: 3, logs: 2, rogue: 0 },
  { seconds: 44, waves: 29, crabs: 8, gulls: 4, logs: 3, rogue: 0 },
  { seconds: 48, waves: 33, crabs: 10, gulls: 5, logs: 4, rogue: 0 },
  { seconds: 56, waves: 28, crabs: 11, gulls: 5, logs: 4, rogue: 3 },
];

export const PALETTE = {
  outline: '#4a3322',
  sand: '#f4d9a0',
  sandDark: '#e3b975',
  sandWet: '#d9a867',
  sea: '#27c4c4',
  seaDeep: '#12a1b8',
  seaLight: '#7fe6e0',
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
