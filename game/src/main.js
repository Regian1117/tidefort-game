// Boot. Normally this starts the live game (app.js). With ?shot=start|play|late|end&seed=N it
// instead stages that screenshot scene, paints it twice and sets window.__shotReady, so the
// pictures in screenshots/ are real renders of the game's own code.
import { FIELD } from './config.js';
import { createApp } from './app.js';
import { paint } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : undefined;

const canvas = document.getElementById('game');
const status = document.getElementById('status');

function runShot(name) {
  const frame = stageShot(name, seed ?? 1);
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  const ctx = canvas.getContext('2d');
  let painted = 0;
  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    paint(ctx, { ...frame, time: 3.2 });
    painted += 1;
    if (painted < 2) requestAnimationFrame(draw);
    else window.__shotReady = true;
  }
  requestAnimationFrame(draw);
}

if (shot) runShot(shot);
else createApp(canvas, status, seed);
