import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.resolve(testDirectory, "../static/attract-mode/attract.js"), "utf8");
const styles = readFileSync(path.resolve(testDirectory, "../static/attract-mode/attract.css"), "utf8");

assert.match(source, /IDLE_DELAY\s*=\s*15_000/);
assert.match(source, /SLIDE_DELAY\s*=\s*4_200/);
for (const name of ["Hand Puzzle", "Gravity Thief", "Career Quest", "VibeLink", "Vibe Oracle", "Slice Club", "SkyShot"]) {
  assert.match(source, new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(source, /pointerdown/);
assert.match(source, /pointermove/);
assert.match(source, /aria-hidden/);
assert.doesNotMatch(source, /getUserMedia|AudioContext/,
  "The homepage showcase must not start cameras or audio automatically");
assert.match(styles, /prefers-reduced-motion/);
assert.match(styles, /\.nv-attract\.active/);

console.log("NeuroVerse attract-mode checks passed.");
