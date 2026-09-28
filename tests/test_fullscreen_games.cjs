const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const games = [
  {
    name: "Hand Puzzle",
    html: "questpass_bridge/hand-puzzle/index.html",
    script: "questpass_bridge/hand-puzzle/neuroverse-fullscreen.js",
    target: "document",
    css: "questpass_bridge/hand-puzzle/style.css",
  },
  {
    name: "Gravity Thief",
    html: "questpass_bridge/gravity-thief/index.html",
    script: "questpass_bridge/gravity-thief/neuroverse-fullscreen.js",
    target: "document",
    css: "questpass_bridge/gravity-thief/style.css",
  },
  {
    name: "Slice Club",
    html: "static/slice-club/index.html",
    script: "static/neuroverse-fullscreen.js",
    target: "#arena",
    css: "static/slice-club/styles.css",
  },
  {
    name: "Vibe Oracle",
    html: "static/vibe-oracle/index.html",
    script: "static/neuroverse-fullscreen.js",
    target: "document",
    css: "static/vibe-oracle/styles.css",
  },
  {
    name: "SkyShot",
    html: "static/skyshot/index.html",
    script: "static/neuroverse-fullscreen.js",
    target: "document",
    css: "static/skyshot/index.html",
  },
];

for (const game of games) {
  const html = read(game.html);
  const css = read(game.css);

  assert.match(html, /viewport-fit=cover/, `${game.name} should support safe fullscreen insets`);
  assert.match(html, /data-neuroverse-fullscreen/, `${game.name} needs a fullscreen control`);
  assert.ok(
    html.includes(`data-fullscreen-target="${game.target}"`),
    `${game.name} should fullscreen the intended surface`,
  );
  assert.match(html, /neuroverse-fullscreen\.js/, `${game.name} should load the shared controller`);
  assert.match(css, /nv-fullscreen-active/, `${game.name} needs an active fullscreen layout`);

  const controller = read(game.script);
  assert.match(controller, /requestFullscreen/, `${game.name} needs the standard Fullscreen API`);
  assert.match(controller, /webkitRequestFullscreen/, `${game.name} needs Safari fullscreen support`);
  assert.match(controller, /webkitExitFullscreen/, `${game.name} needs Safari fullscreen exit support`);
  assert.match(controller, /visualViewport/, `${game.name} should use the visible viewport size`);
  assert.match(controller, /orientationchange/, `${game.name} should react to device rotation`);
  assert.match(controller, /new Event\("resize"\)/, `${game.name} should resize its canvas after fullscreen`);
}

const legacyGameScripts = [
  "questpass_bridge/hand-puzzle/app.js",
  "questpass_bridge/gravity-thief/app.js",
  "static/slice-club/game.js",
  "static/vibe-oracle/oracle.js",
];

for (const relativePath of legacyGameScripts) {
  const source = read(relativePath);
  assert.doesNotMatch(
    source,
    /document\.documentElement\.requestFullscreen|arena\.requestFullscreen/,
    `${relativePath} should not keep a second fullscreen implementation`,
  );
}

const skyshot = read("static/skyshot/index.html");
assert.match(skyshot, /id="fullscreenButton"/, "SkyShot should expose the new fullscreen button");
assert.match(skyshot, /id="setupFullscreenButton"/, "SkyShot should offer fullscreen before the round starts");
assert.match(skyshot, /class="topbar-actions"/, "SkyShot controls should remain grouped responsively");

console.log(`Fullscreen checks passed for ${games.length} MediaPipe games.`);
