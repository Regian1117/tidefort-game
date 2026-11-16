// TIDEFORT hand-in program (Node 22, standard library only). It hands in three things:
//   1. the TIDEFORT game: the static files under game/ (index.html plus its ES modules, procedural
//      art and WebAudio, no library and no network request),
//   2. its 4 screenshots from screenshots/ (the first by name, 1-start.jpg, is the cover),
//   3. dossier.json, the summary the judge reads, written by the vendored make.fun library.
// It copies game/ and screenshots/ to /output, checks that the pieces the gate needs are there, and
// writes /output/dossier.json. Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play it locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const SCREENSHOT_COUNT = 4;
const SCREENSHOT_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png']);

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(repoRoot, 'game');
const screenshotsDir = join(repoRoot, 'screenshots');

/** The screenshot files the dossier will show, in name order (the first is the cover). */
function listScreenshots(): string[] {
  if (!existsSync(screenshotsDir)) return [];
  return readdirSync(screenshotsDir)
    .filter((name) => !name.startsWith('.') && SCREENSHOT_EXTENSIONS.has(extname(name).toLowerCase()))
    .sort();
}

/** Stop before writing anything if the game's entry page or the 4 screenshots are missing. */
function validateEntry(): void {
  if (!existsSync(join(gameDir, 'index.html'))) {
    throw new Error('TIDEFORT: game/index.html is missing, so there is no game to hand in');
  }
  const shots = listScreenshots();
  if (shots.length !== SCREENSHOT_COUNT) {
    throw new Error(`TIDEFORT: expected exactly ${SCREENSHOT_COUNT} screenshots in screenshots/, found ${shots.length}`);
  }
}

validateEntry();

mkdirSync(outputDir, { recursive: true });
cpSync(gameDir, join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
cpSync(screenshotsDir, join(outputDir, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
const dossierJson = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierJson);
