// Keyboard and mouse input. Pointer positions are mapped from the window into the 1280x720 play
// space (the canvas is letterboxed). One-shot presses are queued and taken once per frame by the
// loop, so a press between two frames is never lost and never counted twice.
import { FIELD } from './config.js';

export function createInput(canvas) {
  const pointer = { x: -1, y: -1, inside: false };
  let queue = [];

  function toPlay(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const offX = (rect.width - FIELD.width * scale) / 2;
    const offY = (rect.height - FIELD.height * scale) / 2;
    pointer.x = (event.clientX - rect.left - offX) / scale;
    pointer.y = (event.clientY - rect.top - offY) / scale;
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
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    queue.push({ type: 'key', code: event.code });
    if (['Space', 'Enter', 'Digit1', 'Digit2', 'Digit3', 'Tab'].includes(event.code)) event.preventDefault();
  });

  return {
    pointer,
    /** Everything pressed since the last call, oldest first. */
    take() {
      const taken = queue;
      queue = [];
      return taken;
    },
  };
}
