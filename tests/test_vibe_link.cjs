const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const html = fs.readFileSync(
  path.join(projectRoot, "VibeLink_Rebuilt.html"),
  "utf8",
);
const app = fs.readFileSync(path.join(projectRoot, "app.py"), "utf8");

assert.match(app, /with_name\("VibeLink_Rebuilt\.html"\)/,
  "Streamlit should launch the rebuilt VibeLink experience");
assert.match(html, /@media \(prefers-reduced-motion: reduce\)/,
  "Reduced-motion users should still receive motion-safe CSS");
assert.doesNotMatch(html, /reducedMotion\s*\?\s*12/,
  "Reduced motion must not collapse the story timeline to 12ms");
assert.match(html, /window\.setTimeout\(resolve, milliseconds\)/,
  "Narrative pauses should keep their requested readable duration");
assert.match(html, /await pause\(700\)/,
  "Answer reactions should remain visible long enough to read");
assert.match(html, /for \(let index = 0; index < result\.lines\.length; index \+= 1\)/,
  "The reveal should show every generated punchline");
assert.match(html, /id="revealAdvance"/,
  "The result screen should display a visible Space-key prompt");
assert.match(html, /await waitForRevealAdvance\(/,
  "Each punchline should wait for the audience before advancing");
assert.match(html, /event\.repeat/,
  "Holding Space must not skip multiple reveal messages");
assert.doesNotMatch(html, /\? 800 : 2050/,
  "Punchlines should no longer advance on an automatic timer");

console.log("VibeLink timing and Streamlit integration tests passed.");
