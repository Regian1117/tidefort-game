// The beach: the grid of sand cells in front of the castle and the geometry helpers that turn a
// pixel into a lane and row (and back). Cells hold at most one structure.
import { GRID } from './config.js';

export function createBeach() {
  const cells = [];
  for (let row = 0; row < GRID.rows; row += 1) {
    cells.push(new Array(GRID.cols).fill(null));
  }
  return { cells };
}

export function cellLeft(col) {
  return GRID.x + col * GRID.cell;
}

export function cellTop(row) {
  return GRID.y + row * GRID.cell;
}

export function cellCentreX(col) {
  return cellLeft(col) + GRID.cell / 2;
}

export function cellCentreY(row) {
  return cellTop(row) + GRID.cell / 2;
}

/** The {col, row} under a pixel, or null when the pixel is outside the grid. */
export function cellAt(x, y) {
  const col = Math.floor((x - GRID.x) / GRID.cell);
  const row = Math.floor((y - GRID.y) / GRID.cell);
  if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) return null;
  return { col, row };
}

export function structureAt(beach, col, row) {
  if (col < 0 || col >= GRID.cols || row < 0 || row >= GRID.rows) return null;
  return beach.cells[row][col];
}

/** The first solid (wall or tower) a thing coming down `col` meets at or below pixel `y`, or null. */
export function firstSolidBelow(beach, col, y) {
  const start = Math.max(0, Math.floor((y - GRID.y) / GRID.cell));
  for (let row = start; row < GRID.rows; row += 1) {
    const s = beach.cells[row][col];
    if (s && s.kind !== 'moat') return s;
  }
  return null;
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

export function countKind(beach, kind) {
  let n = 0;
  for (const s of allStructures(beach)) if (s.kind === kind) n += 1;
  return n;
}
