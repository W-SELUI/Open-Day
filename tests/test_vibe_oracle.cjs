// Run from the UI project with: node --test tests/test_vibe_oracle.cjs
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const project = join(__dirname, "..");
const oracle = join(project, "static", "vibe-oracle");
const engineSource = readFileSync(join(oracle, "fortune-engine.js"), "utf8");
const executable = engineSource.replace(/\bexport\s+/g, "");
const engine = vm.runInNewContext(
  `${executable}\n({ FORTUNES, selectFortune });`,
);
const { FORTUNES, selectFortune } = engine;

function seededRandom(seed) {
  return () =>
    ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
}

test("The Oracle has 56 complete, unique, short fortunes", () => {
  assert.equal(FORTUNES.length, 56);
  assert.equal(new Set(FORTUNES.map((fortune) => fortune.id)).size, 56);
  assert.equal(new Set(FORTUNES.map((fortune) => fortune.category)).size, 7);
  for (const fortune of FORTUNES) {
    assert.match(fortune.id, /^[a-z0-9-]+$/);
    assert.ok(fortune.category.length > 3);
    assert.equal(fortune.lines.length, 3, fortune.id);
    for (const line of fortune.lines) {
      assert.equal(typeof line, "string");
      assert.ok(line.trim().length >= 12, fortune.id);
      assert.ok(line.trim().length <= 90, `${fortune.id}: ${line}`);
      assert.doesNotMatch(line, /undefined|null|\{\w+\}/i);
    }
  }
});

test("Every category has the same amount of variety", () => {
  const counts = new Map();
  for (const fortune of FORTUNES) {
    counts.set(fortune.category, (counts.get(fortune.category) || 0) + 1);
  }
  assert.deepEqual([...counts.values()], [8, 8, 8, 8, 8, 8, 8]);
});

test("A full deck never repeats and a new deck never repeats consecutively", () => {
  const random = seededRandom(42);
  let history = [];
  const seen = new Set();
  let last;
  for (let index = 0; index < FORTUNES.length; index += 1) {
    const selected = selectFortune(history, random);
    assert.ok(!seen.has(selected.fortune.id), selected.fortune.id);
    seen.add(selected.fortune.id);
    history = Array.from(selected.history);
    last = selected.fortune.id;
  }
  const next = selectFortune(history, random);
  assert.notEqual(next.fortune.id, last);
});

test("Unknown and duplicate saved history cannot break selection", () => {
  const selected = selectFortune(
    ["old-version-id", FORTUNES[0].id, FORTUNES[0].id],
    () => 0,
  );
  assert.ok(FORTUNES.some((fortune) => fortune.id === selected.fortune.id));
  assert.ok(selected.history.every((id) => FORTUNES.some((fortune) => fortune.id === id)));
});

test("Fortunes stay playful and avoid face-based or harmful judgments", () => {
  const copy = JSON.stringify(FORTUNES);
  assert.doesNotMatch(
    copy,
    /skin colou?r|body shape|disabilit|attractiveness|ugly|weight|ethnicity|race|kill yourself/i,
  );
});

test("The hand-only page has all local assets and no profile form", () => {
  const required = [
    "index.html",
    "styles.css",
    "oracle.js",
    "fortune-engine.js",
    "hand-tracker.js",
    "hand-worker.js",
  ];
  required.forEach((file) => assert.ok(existsSync(join(oracle, file)), file));
  const html = readFileSync(join(oracle, "index.html"), "utf8");
  assert.doesNotMatch(html, /<form\b|<input\b|capture\s*=|type=["']file/i);
  assert.match(html, /<video[^>]+id="camera"/);
  assert.match(html, /script type="module" src="oracle\.js(?:\?[^\"]*)?"/);
});

test("QuestPass completion happens only in the final exit function", () => {
  const source = readFileSync(join(oracle, "oracle.js"), "utf8");
  const messages = source.match(/questpass:completed/g) || [];
  assert.equal(messages.length, 1);
  const completionIndex = source.indexOf("questpass:completed");
  const finishIndex = source.indexOf("function finishExperience");
  const revealIndex = source.indexOf("function showReveal");
  assert.ok(revealIndex < finishIndex);
  assert.ok(finishIndex < completionIndex);
});
