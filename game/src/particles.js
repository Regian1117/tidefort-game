// Pure-data juice: splash droplets, sand chunks, foam puffs, floating score text and screen shake.
// Nothing here draws; scene.js and hud.js read the lists. Every spawn takes the game's seeded
// random so the screenshot scenes come out the same each time.

export function createFx() {
  return { parts: [], texts: [], prints: [], shake: 0, shakeX: 0, shakeY: 0, time: 0 };
}

const MAX_PARTS = 600;

function push(fx, p) {
  if (fx.parts.length < MAX_PARTS) fx.parts.push(p);
}

/** Water droplets thrown up where a wave breaks. */
export function spawnSplash(fx, random, x, y, count, power = 1) {
  for (let i = 0; i < count; i += 1) {
    const angle = -Math.PI / 2 + (random() - 0.5) * 2.2;
    const speed = (90 + random() * 220) * power;
    push(fx, {
      kind: 'drop', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 0.5 + random() * 0.4, age: 0, size: 3 + random() * 4, gravity: 620,
    });
  }
}

/** Crumbs of sand when a structure is hit or collapses. */
export function spawnChunks(fx, random, x, y, count, big = false) {
  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    const speed = 60 + random() * (big ? 260 : 150);
    push(fx, {
      kind: 'chunk', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 80,
      life: 0.6 + random() * 0.5, age: 0, size: 4 + random() * (big ? 8 : 5), gravity: 700,
    });
  }
}

/** White foam puffs that drift and fade. */
export function spawnFoam(fx, random, x, y, count) {
  for (let i = 0; i < count; i += 1) {
    push(fx, {
      kind: 'foam', x: x + (random() - 0.5) * 40, y: y + (random() - 0.5) * 10,
      vx: (random() - 0.5) * 50, vy: random() * 30, life: 0.7 + random() * 0.5, age: 0,
      size: 6 + random() * 9, gravity: 0,
    });
  }
}

/** A ring of sparkles for a perfect patch or a caught pest. */
export function spawnSparkle(fx, random, x, y, count, color) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + random() * 0.4;
    const speed = 100 + random() * 120;
    push(fx, {
      kind: 'spark', x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life: 0.5, age: 0, size: 4 + random() * 3, gravity: 0, color,
    });
  }
}

export function floatText(fx, x, y, text, color = '#ffffff', size = 26) {
  fx.texts.push({ x, y, text, color, size, age: 0, life: 1.1 });
}

export function addShake(fx, amount) {
  fx.shake = Math.min(18, Math.max(fx.shake, amount));
}

export function updateFx(fx, random, dt) {
  fx.time += dt;
  for (let i = fx.parts.length - 1; i >= 0; i -= 1) {
    const p = fx.parts[i];
    p.age += dt;
    if (p.age >= p.life) {
      fx.parts.splice(i, 1);
      continue;
    }
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  for (let i = fx.prints.length - 1; i >= 0; i -= 1) {
    fx.prints[i].age += dt;
    if (fx.prints[i].age > 5) fx.prints.splice(i, 1);
  }
  for (let i = fx.texts.length - 1; i >= 0; i -= 1) {
    const t = fx.texts[i];
    t.age += dt;
    t.y -= 38 * dt;
    if (t.age >= t.life) fx.texts.splice(i, 1);
  }
  if (fx.shake > 0.05) {
    fx.shake *= Math.pow(0.002, dt);
    fx.shakeX = (random() - 0.5) * 2 * fx.shake;
    fx.shakeY = (random() - 0.5) * 2 * fx.shake;
  } else {
    fx.shake = 0;
    fx.shakeX = 0;
    fx.shakeY = 0;
  }
}
