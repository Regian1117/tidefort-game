// Keyboard and mouse input. Pointer positions are mapped from the window into the 1280x720 play
// space (the canvas is letterboxed). Held keys (WASD / arrows to walk the kid, Space to act) give a
// continuous intent; one-shot presses are queued and taken once per frame by the loop, so a press
// between two frames is never lost and never counted twice.
import { FIELD } from './config.js';

const LEFT = new Set(['KeyA', 'ArrowLeft']);
const RIGHT = new Set(['KeyD', 'ArrowRight']);
const UP = new Set(['KeyW', 'ArrowUp']);
const DOWN = new Set(['KeyS', 'ArrowDown']);
const ACT = new Set(['Space', 'KeyE']);

export function createInput(canvas) {
  const pointer = { x: -1, y: -1, inside: false };
  const held = new Set();
  let queue = [];

  function toPlay(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    pointer.x = (event.clientX - rect.left - (rect.width - FIELD.width * scale) / 2) / scale;
    pointer.y = (event.clientY - rect.top - (rect.height - FIELD.height * scale) / 2) / scale;
    pointer.inside = true;
  }

  canvas.addEventListener('pointermove', toPlay);
  canvas.addEventListener('pointerleave', () => {
    pointer.inside = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    toPlay(event);
    queue.push({ type: 'click', x: pointer.x, y: pointer.y, button: event.button });
    event.preventDefault();
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  window.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    held.add(event.code);
    if (!event.repeat) queue.push({ type: 'key', code: event.code });
    if (['Space', 'Enter', 'Digit1', 'Digit2', 'Digit3', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => held.clear());

  const any = (codes) => [...codes].some((code) => held.has(code));

  return {
    pointer,
    /** The kid's walk and action from the keys held right now. */
    intent(out) {
      out.dx = (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0);
      out.dy = (any(DOWN) ? 1 : 0) - (any(UP) ? 1 : 0);
      out.act = any(ACT);
      return out;
    },
    /** Everything pressed since the last call, oldest first. */
    take() {
      const taken = queue;
      queue = [];
      return taken;
    },
  };
}
