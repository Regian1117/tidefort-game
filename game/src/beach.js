// The beach: the grid of sand cells in front of the castle, the geometry helpers that turn a pixel
// into a lane and row (and back), and the resting waterline that creeps up the beach each tide.
// Cells hold at most one structure and a flood timer (water that got through keeps them blue).
import { GRID, WATERLINE } from './config.js';

export function createBeach() {
  const cells = [];
  const flood = [];
  for (let row = 0; row < GRID.rows; row += 1) {
    cells.push(new Array(GRID.cols).fill(null));
    flood.push(new Array(GRID.cols).fill(0));
  }
  return { cells, flood };
}

export function cellLeft(col) {
  return GRID.x + col * GRID.cellW;
}

export function cellTop(row) {
  return GRID.y + row * GRID.cellH;
}

export function cellCentreX(col) {
  return cellLeft(col) + GRID.cellW / 2;
}

export function cellCentreY(row) {
  return cellTop(row) + GRID.cellH / 2;
}

/** The {col, row} under a pixel, or null when the pixel is outside the grid. */
export function cellAt(x, y) {
  const col = Math.floor((x - GRID.x) / GRID.cellW);
  const row = Math.floor((y - GRID.y) / GRID.cellH);
  if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) return null;
  return { col, row };
}

export function structureAt(beach, col, row) {
  if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) return null;
  return beach.cells[row][col];
}

/** The pixel line where the sea rests at the start of tide `tide`. */
export function waterlineFor(tide) {
  return WATERLINE.first + (tide - 1) * WATERLINE.creep;
}

/** The first row that is still dry sand when the sea rests at `waterline`. */
export function firstDryRow(waterline) {
  return Math.max(0, Math.min(GRID.rows, Math.ceil((waterline - GRID.y) / GRID.cellH)));
}

/** Every structure on the beach as a flat list. */
export function allStructures(beach) {
  const list = [];
  for (let row = 0; row < GRID.rows; row += 1) {
    for (let col = 0; col < GRID.cols; col += 1) {
      if (beach.cells[row][col]) list.push(beach.cells[row][col]);
    }
  }
  return list;
}

/** Age the flood timers (the blue fades as the water drains). */
export function drainFlood(beach, dt) {
  for (const row of beach.flood) {
    for (let col = 0; col < row.length; col += 1) if (row[col] > 0) row[col] = Math.max(0, row[col] - dt);
  }
}
