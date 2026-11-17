// The upgrade pick after each tide: three random cards out of the pool, one is kept for the rest
// of the run. Each card nudges a number in `mods` (read by walls, waves and enemies) or heals.
import { repairCastle } from './castle.js';

export function createMods() {
  return {
    erosion: 1, // multiplies the damage waves do to structures
    hpScale: 1, // multiplies structure hit points
    armour: 0, // flat damage shaved off every hit on a structure
    scoopBonus: 0,
    scoopCooldown: 1,
    crabTraps: false, // a crab that walks into a moat is caught
    waveSpeed: 1,
    buildBonus: 0,
    towerRate: 1,
    gullPeck: 1,
  };
}

export const UPGRADES = [
  {
    id: 'wet-sand',
    name: 'Wet-Sand Walls',
    desc: 'Packed damp: waves wear structures down 20% less.',
    icon: 'drop',
    apply: (g) => { g.mods.erosion *= 0.8; },
  },
  {
    id: 'seaweed',
    name: 'Seaweed Bracing',
    desc: 'Every wall and tower gets 25% more hit points.',
    icon: 'weed',
    apply: (g) => { g.mods.hpScale *= 1.25; for (const s of g.structures()) s.hp *= 1.25; },
  },
  {
    id: 'shell-armour',
    name: 'Shell Armour',
    desc: 'Every hit on a structure is 4 points weaker.',
    icon: 'shell',
    apply: (g) => { g.mods.armour += 4; },
  },
  {
    id: 'big-bucket',
    name: 'Bigger Bucket',
    desc: 'The kid carries 4 more sand: fewer risky trips to the waterline.',
    icon: 'bucket',
    apply: (g) => { g.kid.cap += 4; },
  },
  {
    id: 'crab-traps',
    name: 'Crab Traps',
    desc: 'Crabs that crawl into a moat are caught for good.',
    icon: 'crab',
    apply: (g) => { g.mods.crabTraps = true; },
  },
  {
    id: 'tide-chart',
    name: 'Tide Chart',
    desc: 'You read the sea: waves arrive 12% slower.',
    icon: 'chart',
    apply: (g) => { g.mods.waveSpeed *= 0.88; },
  },
  {
    id: 'sand-dollars',
    name: 'Sand Dollars',
    desc: '+10 sand every build phase, and +20 sand right now.',
    icon: 'coin',
    apply: (g) => { g.mods.buildBonus += 10; g.sand += 20; },
  },
  {
    id: 'keep-mend',
    name: 'Keep Mending',
    desc: 'The castle gains 20 max integrity and is fully mended.',
    icon: 'castle',
    apply: (g) => { g.castle.maxHp += 20; repairCastle(g.castle, 999); },
  },
  {
    id: 'flag-charm',
    name: 'Lucky Flag',
    desc: 'The flag gains 1 max health and recovers 2.',
    icon: 'flag',
    apply: (g) => { g.castle.maxFlag += 1; g.castle.flag = Math.min(g.castle.maxFlag, g.castle.flag + 2); },
  },
  {
    id: 'sharp-shells',
    name: 'Sharp Shells',
    desc: 'Towers reload 25% faster.',
    icon: 'star',
    apply: (g) => { g.mods.towerRate *= 0.75; },
  },
  {
    id: 'scarecrow',
    name: 'Gull Scarecrow',
    desc: 'Gulls peck half as hard and give up sooner.',
    icon: 'gull',
    apply: (g) => { g.mods.gullPeck *= 0.5; },
  },
];

/** Three different cards, drawn with the game's seeded random so a seed gives the same choices. */
export function drawChoices(random, taken) {
  const pool = UPGRADES.filter((u) => !(u.id === 'crab-traps' && taken.includes(u.id)));
  const picks = [];
  while (picks.length < 3 && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    picks.push(pool.splice(index, 1)[0]);
  }
  return picks;
}

export function applyUpgrade(game, upgrade) {
  upgrade.apply(game);
  game.taken.push(upgrade.id);
}
