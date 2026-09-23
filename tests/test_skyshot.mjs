import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const installedGameDirectory = path.resolve(testDirectory, "../static/skyshot");
const stagedGameDirectory = path.resolve(testDirectory, "../skyshot");
const gameDirectory = existsSync(installedGameDirectory)
  ? installedGameDirectory
  : stagedGameDirectory;

const {
  analyzeFingerGun,
  createTriggerState,
  getAimRay,
  updateTriggerState,
} = await import(pathToFileURL(path.join(gameDirectory, "fingerGunClassifier.js")));

function makeFingerGunLandmarks() {
  const points = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.6, z: 0 }));
  points[0] = { x: 0.5, y: 0.8, z: 0 };
  points[5] = { x: 0.4, y: 0.56, z: 0 };
  points[6] = { x: 0.4, y: 0.42, z: 0 };
  points[7] = { x: 0.4, y: 0.29, z: 0 };
  points[8] = { x: 0.4, y: 0.15, z: 0 };
  points[9] = { x: 0.5, y: 0.55, z: 0 };
  points[10] = { x: 0.5, y: 0.42, z: 0 };
  points[12] = { x: 0.5, y: 0.53, z: 0 };
  points[13] = { x: 0.57, y: 0.57, z: 0 };
  points[14] = { x: 0.57, y: 0.45, z: 0 };
  points[16] = { x: 0.56, y: 0.56, z: 0 };
  points[17] = { x: 0.64, y: 0.59, z: 0 };
  points[18] = { x: 0.64, y: 0.49, z: 0 };
  points[20] = { x: 0.63, y: 0.58, z: 0 };
  points[4] = { x: 0.21, y: 0.43, z: 0 };
  return points;
}

const landmarks = makeFingerGunLandmarks();
const analysis = analyzeFingerGun(landmarks);
assert.equal(analysis.gunShape, true, "The synthetic finger-gun pose should be recognised");
assert.ok(analysis.thumbOpenness > 0.76, "Raised thumb should be considered released");

const aim = getAimRay(landmarks, 1600, 900);
assert.ok(Math.abs(aim.x) < 0.0001, "Straight-up index finger should not drift horizontally");
assert.ok(aim.y < -0.99, "Straight-up index finger should aim upward");

const trigger = createTriggerState();
updateTriggerState(trigger, analysis, 0);
updateTriggerState(trigger, analysis, 16);
assert.equal(trigger.armed, true, "Two stable raised-thumb frames should arm the trigger");

const pressed = { ...analysis, thumbOpenness: 0.4 };
assert.equal(updateTriggerState(trigger, pressed, 32).fired, false, "One noisy pressed frame must not fire");
assert.equal(updateTriggerState(trigger, pressed, 48).fired, true, "Two stable pressed frames should fire once");
assert.equal(updateTriggerState(trigger, pressed, 64).fired, false, "A held thumb must not auto-fire");

const graceTrigger = createTriggerState();
updateTriggerState(graceTrigger, analysis, 0);
updateTriggerState(graceTrigger, analysis, 16);
assert.equal(graceTrigger.armed, true);
updateTriggerState(graceTrigger, null, 32);
assert.equal(graceTrigger.armed, true, "One lost frame should not disarm the player");
for (let frame = 0; frame < 9; frame += 1) {
  updateTriggerState(graceTrigger, null, 48 + frame * 16);
}
assert.equal(graceTrigger.armed, false, "A genuinely lost hand should eventually disarm");

const indexSource = readFileSync(path.join(gameDirectory, "index.html"), "utf8");
const gameSource = readFileSync(path.join(gameDirectory, "game.js"), "utf8");
const referencedIds = [...gameSource.matchAll(/querySelector\("#([^"\n]+)"\)/g)]
  .map((match) => match[1]);

for (const id of referencedIds) {
  assert.match(indexSource, new RegExp(`id=["']${id}["']`), `Missing #${id} in index.html`);
}

assert.match(indexSource, /\.\/mediapipe-hands\/hands\.js/);
assert.match(indexSource, /<script type="module" src="\.\/game\.js"><\/script>/);
assert.equal((gameSource.match(/questpass:completed/g) || []).length, 1,
  "QuestPass completion must have one deliberate message source");
assert.equal(/https?:\/\//.test(gameSource), false, "Game logic must not depend on a remote URL");

for (const asset of [
  "mediapipe-hands/hands.js",
  "mediapipe-hands/hands_solution_simd_wasm_bin.wasm",
  "mediapipe-hands/hand_landmark_lite.tflite",
]) {
  const assetPath = path.join(gameDirectory, asset);
  assert.equal(existsSync(assetPath), true, `Missing local asset: ${asset}`);
  assert.ok(statSync(assetPath).size > 0, `Empty local asset: ${asset}`);
}

console.log("SkyShot gesture, asset, and integration tests passed.");
