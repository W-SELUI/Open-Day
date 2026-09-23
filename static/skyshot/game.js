import {
  analyzeFingerGun,
  createTriggerState,
  getAimRay,
  updateTriggerState,
} from "./fingerGunClassifier.js";

const ROUND_DURATION_MS = 30_000;
const TRACK_INTERVAL_MS = 1_000 / 30;
const PLAYER_COLORS = ["#67e8f9", "#a78bfa"];
const PLAYER_GLOWS = ["rgba(103, 232, 249, 0.58)", "rgba(167, 139, 250, 0.58)"];

const DIFFICULTIES = Object.freeze({
  easy: { speed: 0.13, bombs: 0, duckScale: 1.16 },
  medium: { speed: 0.20, bombs: 1, duckScale: 1.0 },
  hard: { speed: 0.30, bombs: 2, duckScale: 0.88 },
});

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

const elements = {
  video: document.querySelector("#camera"),
  canvas: document.querySelector("#gameCanvas"),
  hud: document.querySelector("#hud"),
  setupOverlay: document.querySelector("#setupOverlay"),
  resultOverlay: document.querySelector("#resultOverlay"),
  errorOverlay: document.querySelector("#errorOverlay"),
  errorText: document.querySelector("#errorText"),
  retryButton: document.querySelector("#retryButton"),
  countdown: document.querySelector("#countdown"),
  countdownValue: document.querySelector("#countdownValue"),
  pauseCard: document.querySelector("#pauseCard"),
  startButton: document.querySelector("#startButton"),
  cameraStatus: document.querySelector("#cameraStatus"),
  timerValue: document.querySelector("#timerValue"),
  timerFill: document.querySelector("#timerFill"),
  soundButton: document.querySelector("#soundButton"),
  trackingPill: document.querySelector("#trackingPill"),
  trackingText: document.querySelector("#trackingText"),
  playerCards: [
    document.querySelector("#playerOneCard"),
    document.querySelector("#playerTwoCard"),
  ],
  playerOneLabel: document.querySelector("#playerOneLabel"),
  score: [
    document.querySelector("#playerOneScore"),
    document.querySelector("#playerTwoScore"),
  ],
  streak: [
    document.querySelector("#playerOneStreak"),
    document.querySelector("#playerTwoStreak"),
  ],
  accuracy: [
    document.querySelector("#playerOneAccuracy"),
    document.querySelector("#playerTwoAccuracy"),
  ],
  resultTitle: document.querySelector("#resultTitle"),
  resultSubtitle: document.querySelector("#resultSubtitle"),
  resultStats: document.querySelector("#resultStats"),
  playAgainButton: document.querySelector("#playAgainButton"),
  setupButton: document.querySelector("#setupButton"),
  collectButton: document.querySelector("#collectButton"),
};

const ctx = elements.canvas.getContext("2d", { alpha: true });

const state = {
  phase: "setup",
  mode: "solo",
  difficulty: "medium",
  cameraReady: false,
  soundEnabled: true,
  stream: null,
  hands: null,
  trackingBusy: false,
  trackingActive: false,
  trackingGeneration: 0,
  lastTrackAt: 0,
  countdownEndsAt: 0,
  roundEndsAt: 0,
  pausedAt: 0,
  lastFrameAt: performance.now(),
  countdownSpoken: null,
  dpr: 1,
  players: [createPlayer(0), createPlayer(1)],
  ducks: [createDuck(0), createDuck(1)],
  bombs: [[], []],
  shotEffects: [],
  impactEffects: [],
};

let audioContext = null;
let ambientGain = null;

function createPlayer(index) {
  return {
    index,
    score: 0,
    shots: 0,
    hits: 0,
    streak: 0,
    bestStreak: 0,
    detection: null,
    smoothedLandmarks: null,
    trigger: createTriggerState(),
  };
}

function createDuck(playerIndex) {
  return {
    playerIndex,
    x: playerIndex === 0 ? 0.34 : 0.66,
    y: 0.45,
    targetX: playerIndex === 0 ? 0.28 : 0.72,
    targetY: 0.34,
    radius: 0.052,
    direction: 1,
    nextWaypointAt: 0,
    hitUntil: 0,
    respawnAt: 0,
  };
}

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function laneBounds(playerIndex) {
  if (state.mode === "solo") return { left: 0.09, right: 0.91 };
  return playerIndex === 0
    ? { left: 0.07, right: 0.46 }
    : { left: 0.54, right: 0.93 };
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}

function resizeCanvas() {
  const rect = elements.canvas.getBoundingClientRect();
  state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = Math.max(1, Math.round(rect.width * state.dpr));
  const height = Math.max(1, Math.round(rect.height * state.dpr));

  if (elements.canvas.width !== width || elements.canvas.height !== height) {
    elements.canvas.width = width;
    elements.canvas.height = height;
  }

  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}

function canvasSize() {
  const rect = elements.canvas.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function setOverlayVisibility(element, visible) {
  element.classList.toggle("hidden", !visible);
}

function setSelectedChoice(selector, value, dataKey) {
  document.querySelectorAll(selector).forEach((button) => {
    const selected = button.dataset[dataKey] === value;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function updateModeUI() {
  const duel = state.mode === "duel";
  elements.playerCards[1].classList.toggle("hidden", !duel);
  elements.playerOneLabel.textContent = duel ? "Player 1" : "Score";
  setSelectedChoice(".mode-choice", state.mode, "mode");
}

function updateDifficultyUI() {
  setSelectedChoice(".difficulty-choice", state.difficulty, "difficulty");
}

function ensureAudio() {
  if (!state.soundEnabled) return null;
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    ambientGain = audioContext.createGain();
    ambientGain.gain.value = 0.022;
    ambientGain.connect(audioContext.destination);

    const ambient = audioContext.createOscillator();
    ambient.type = "sine";
    ambient.frequency.value = 62;
    ambient.connect(ambientGain);
    ambient.start();
  }

  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency, duration = 0.08, volume = 0.05, type = "sine", endFrequency = null) {
  const audio = ensureAudio();
  if (!audio) return;

  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const now = audio.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playShotSound(playerIndex) {
  playTone(playerIndex === 0 ? 190 : 230, 0.07, 0.08, "square", 78);
}

function playHitSound() {
  playTone(520, 0.12, 0.06, "triangle", 880);
  window.setTimeout(() => playTone(760, 0.09, 0.04, "sine", 1050), 55);
}

function playBombSound() {
  playTone(100, 0.28, 0.08, "sawtooth", 42);
}

function resetPlayer(player) {
  player.score = 0;
  player.shots = 0;
  player.hits = 0;
  player.streak = 0;
  player.bestStreak = 0;
  player.detection = null;
  player.smoothedLandmarks = null;
  player.trigger = createTriggerState();
}

function spawnDuck(playerIndex, immediate = false) {
  const duck = state.ducks[playerIndex];
  const bounds = laneBounds(playerIndex);
  duck.x = randomBetween(bounds.left + 0.08, bounds.right - 0.08);
  duck.y = randomBetween(0.24, 0.73);
  duck.radius = 0.052 * DIFFICULTIES[state.difficulty].duckScale;
  duck.hitUntil = 0;
  duck.respawnAt = 0;
  pickDuckWaypoint(duck);
  if (!immediate) duck.nextWaypointAt = performance.now() + 300;
}

function pickDuckWaypoint(duck) {
  const bounds = laneBounds(duck.playerIndex);
  duck.targetX = randomBetween(bounds.left + 0.065, bounds.right - 0.065);
  duck.targetY = randomBetween(0.20, 0.76);
  duck.direction = duck.targetX >= duck.x ? 1 : -1;
  duck.nextWaypointAt = performance.now() + randomBetween(850, 1_650);
}

function createBomb(playerIndex) {
  const bounds = laneBounds(playerIndex);
  return {
    playerIndex,
    x: randomBetween(bounds.left + 0.06, bounds.right - 0.06),
    y: randomBetween(0.29, 0.76),
    radius: 0.029,
    phase: Math.random() * Math.PI * 2,
    hiddenUntil: 0,
  };
}

function spawnBombs() {
  const count = DIFFICULTIES[state.difficulty].bombs;
  const activePlayers = state.mode === "duel" ? 2 : 1;
  state.bombs = [[], []];

  for (let playerIndex = 0; playerIndex < activePlayers; playerIndex += 1) {
    for (let bombIndex = 0; bombIndex < count; bombIndex += 1) {
      let bomb = createBomb(playerIndex);
      let attempts = 0;
      while (
        attempts < 30 &&
        Math.hypot(bomb.x - state.ducks[playerIndex].x, bomb.y - state.ducks[playerIndex].y) < 0.16
      ) {
        bomb = createBomb(playerIndex);
        attempts += 1;
      }
      state.bombs[playerIndex].push(bomb);
    }
  }
}

function resetRoundState() {
  state.players.forEach(resetPlayer);
  state.shotEffects = [];
  state.impactEffects = [];
  spawnDuck(0, true);
  if (state.mode === "duel") spawnDuck(1, true);
  spawnBombs();
  updateHUD();
  updateTrackingStatus();
}

function updateHUD() {
  const activePlayers = state.mode === "duel" ? 2 : 1;
  for (let index = 0; index < activePlayers; index += 1) {
    const player = state.players[index];
    const accuracy = player.shots ? Math.round((player.hits / player.shots) * 100) : 0;
    elements.score[index].textContent = String(player.score);
    elements.streak[index].textContent = `x${player.streak} streak`;
    elements.accuracy[index].textContent = `${accuracy}%`;
  }
}

function smoothLandmarks(player, rawLandmarks) {
  if (!player.smoothedLandmarks) {
    player.smoothedLandmarks = rawLandmarks.map((point) => ({ ...point }));
    return player.smoothedLandmarks;
  }

  const previousWrist = player.smoothedLandmarks[0];
  const currentWrist = rawLandmarks[0];
  const movement = Math.hypot(currentWrist.x - previousWrist.x, currentWrist.y - previousWrist.y);
  const alpha = clamp(0.30 + movement * 8, 0.30, 0.76);

  player.smoothedLandmarks = rawLandmarks.map((point, index) => ({
    x: player.smoothedLandmarks[index].x + (point.x - player.smoothedLandmarks[index].x) * alpha,
    y: player.smoothedLandmarks[index].y + (point.y - player.smoothedLandmarks[index].y) * alpha,
    z: player.smoothedLandmarks[index].z + (point.z - player.smoothedLandmarks[index].z) * alpha,
  }));

  return player.smoothedLandmarks;
}

function chooseCandidate(candidates, playerIndex) {
  const inLane = candidates.filter((candidate) => {
    if (state.mode === "solo") return true;
    return playerIndex === 0 ? candidate.display[9].x < 0.5 : candidate.display[9].x >= 0.5;
  });

  return inLane.sort((a, b) => b.analysis.palmSize - a.analysis.palmSize)[0] || null;
}

function handleHandResults(results) {
  const now = performance.now();
  const landmarks = results.multiHandLandmarks || [];
  const candidates = landmarks.map((raw) => ({
    raw,
    display: raw.map((point) => ({ ...point, x: 1 - point.x })),
    analysis: analyzeFingerGun(raw),
  }));

  const activePlayers = state.mode === "duel" ? 2 : 1;

  for (let playerIndex = 0; playerIndex < activePlayers; playerIndex += 1) {
    const player = state.players[playerIndex];
    const candidate = chooseCandidate(candidates, playerIndex);

    if (!candidate) {
      updateTriggerState(player.trigger, null, now);
      if (player.detection && now - player.detection.lastSeen > 240) player.detection = null;
      continue;
    }

    const smoothed = smoothLandmarks(player, candidate.display);
    player.detection = {
      landmarks: smoothed,
      analysis: candidate.analysis,
      lastSeen: now,
    };

    const triggerResult = updateTriggerState(player.trigger, candidate.analysis, now);
    if (triggerResult.fired && state.phase === "playing") shoot(playerIndex);
  }

  if (state.mode === "solo") {
    state.players[1].detection = null;
    state.players[1].smoothedLandmarks = null;
  }

  updateTrackingStatus();
}

function updateTrackingStatus() {
  const activePlayers = state.mode === "duel" ? 2 : 1;
  const messages = [];
  let readyCount = 0;
  let armedCount = 0;

  for (let index = 0; index < activePlayers; index += 1) {
    const player = state.players[index];
    const prefix = activePlayers === 2 ? `P${index + 1}: ` : "";
    if (!player.detection) {
      messages.push(`${prefix}show hand`);
    } else if (!player.detection.analysis.gunShape) {
      messages.push(`${prefix}fold fingers`);
    } else if (!player.trigger.armed) {
      readyCount += 1;
      messages.push(`${prefix}thumb up to load`);
    } else {
      readyCount += 1;
      armedCount += 1;
      messages.push(`${prefix}locked — thumb down`);
    }
  }

  elements.trackingText.textContent = messages.join("  ·  ");
  elements.trackingPill.classList.toggle("ready", readyCount > 0 && armedCount === 0);
  elements.trackingPill.classList.toggle("armed", armedCount > 0);
}

function rayDistance(origin, direction, target) {
  const targetDx = target.x - origin.x;
  const targetDy = target.y - origin.y;
  const alongRay = targetDx * direction.x + targetDy * direction.y;
  if (alongRay <= 0) return null;
  const closestX = origin.x + direction.x * alongRay;
  const closestY = origin.y + direction.y * alongRay;
  return {
    alongRay,
    fromRay: Math.hypot(closestX - target.x, closestY - target.y),
  };
}

function shotGeometry(playerIndex) {
  const player = state.players[playerIndex];
  const { width, height } = canvasSize();
  const landmarks = player.detection?.landmarks;
  if (!landmarks) return null;

  const direction = getAimRay(landmarks, width, height);
  const tip = landmarks[8];
  const muzzle = {
    x: tip.x * width + direction.x * 18,
    y: tip.y * height + direction.y * 18,
  };
  return { direction, muzzle, width, height };
}

function shoot(playerIndex) {
  const geometry = shotGeometry(playerIndex);
  if (!geometry) return;

  const player = state.players[playerIndex];
  const { direction, muzzle, width, height } = geometry;
  const now = performance.now();
  const maxDistance = Math.hypot(width, height) * 1.25;
  let closest = null;
  player.shots += 1;
  playShotSound(playerIndex);

  state.shotEffects.push({
    playerIndex,
    startX: muzzle.x,
    startY: muzzle.y,
    endX: muzzle.x + direction.x * maxDistance,
    endY: muzzle.y + direction.y * maxDistance,
    startedAt: now,
  });

  const duck = state.ducks[playerIndex];
  if (!duck.hitUntil) {
    const duckHit = rayDistance(muzzle, direction, { x: duck.x * width, y: duck.y * height });
    const duckRadius = duck.radius * Math.min(width, height) * 1.28;
    if (duckHit && duckHit.fromRay <= duckRadius) {
      closest = { type: "duck", hit: duckHit, target: duck };
    }
  }

  for (const bomb of state.bombs[playerIndex]) {
    if (bomb.hiddenUntil > now) continue;
    const bobY = Math.sin(now / 430 + bomb.phase) * 5;
    const bombHit = rayDistance(muzzle, direction, { x: bomb.x * width, y: bomb.y * height + bobY });
    const bombRadius = bomb.radius * Math.min(width, height) * 1.25;
    if (
      bombHit &&
      bombHit.fromRay <= bombRadius &&
      (!closest || bombHit.alongRay < closest.hit.alongRay)
    ) {
      closest = { type: "bomb", hit: bombHit, target: bomb };
    }
  }

  if (closest?.type === "duck") {
    player.hits += 1;
    player.streak += 1;
    player.bestStreak = Math.max(player.bestStreak, player.streak);
    player.score += 100 + Math.min(player.streak - 1, 5) * 10;
    duck.hitUntil = now + 360;
    duck.respawnAt = now + 430;
    state.impactEffects.push({ x: duck.x * width, y: duck.y * height, startedAt: now, color: PLAYER_COLORS[playerIndex] });
    playHitSound();
  } else if (closest?.type === "bomb") {
    player.score = Math.max(0, player.score - 50);
    player.streak = 0;
    closest.target.hiddenUntil = now + 850;
    state.impactEffects.push({
      x: closest.target.x * width,
      y: closest.target.y * height,
      startedAt: now,
      color: "#fb7185",
      bomb: true,
    });
    playBombSound();
  } else {
    player.streak = 0;
  }

  updateHUD();
}

function startRound() {
  ensureAudio();
  resetRoundState();
  state.phase = "countdown";
  state.countdownEndsAt = performance.now() + 3_050;
  state.countdownSpoken = null;
  elements.hud.classList.add("visible");
  elements.setupOverlay.classList.add("hidden");
  elements.resultOverlay.classList.add("hidden");
  elements.countdown.classList.add("visible");
  elements.collectButton.disabled = false;
  elements.collectButton.textContent = "Collect QuestPass stamp";

  if (state.hands) {
    state.hands.setOptions({ maxNumHands: state.mode === "duel" ? 2 : 1 });
  }
}

function beginPlay(now) {
  state.phase = "playing";
  state.roundEndsAt = now + ROUND_DURATION_MS;
  state.lastFrameAt = now;
  elements.countdown.classList.remove("visible");
  playTone(620, 0.14, 0.07, "triangle", 980);
}

function finishRound() {
  if (state.phase !== "playing") return;
  state.phase = "results";
  elements.timerValue.textContent = "0.0";
  elements.timerFill.style.transform = "scaleX(0)";

  const activePlayers = state.mode === "duel" ? state.players : [state.players[0]];
  const roundBest = Math.max(...activePlayers.map((player) => player.score));
  let savedBest = 0;
  try {
    savedBest = Number(localStorage.getItem("neuroverse-skyshot-best")) || 0;
    if (roundBest > savedBest) {
      savedBest = roundBest;
      localStorage.setItem("neuroverse-skyshot-best", String(savedBest));
    }
  } catch (_error) {
    savedBest = roundBest;
  }

  if (state.mode === "duel") {
    const [one, two] = state.players;
    elements.resultTitle.textContent = one.score === two.score
      ? "Dead heat."
      : one.score > two.score ? "Player 1 wins." : "Player 2 wins.";
    elements.resultSubtitle.textContent = `Player 1 scored ${one.score}. Player 2 scored ${two.score}. The sky has chosen.`;
    elements.resultStats.innerHTML = `
      <div class="stat"><strong>${one.score}</strong><span>Player 1</span></div>
      <div class="stat"><strong>${two.score}</strong><span>Player 2</span></div>
      <div class="stat"><strong>${savedBest}</strong><span>Best score</span></div>
    `;
  } else {
    const player = state.players[0];
    const accuracy = player.shots ? Math.round((player.hits / player.shots) * 100) : 0;
    elements.resultTitle.textContent = player.score >= 800 ? "Sky ace." : player.score >= 400 ? "Sharp shooting." : "Mission complete.";
    elements.resultSubtitle.textContent = player.score
      ? "Your finger-gun survived the test. The ducks would like a rematch."
      : "The ducks escaped this timeline. Reload and try another round.";
    elements.resultStats.innerHTML = `
      <div class="stat"><strong>${player.score}</strong><span>Score</span></div>
      <div class="stat"><strong>${accuracy}%</strong><span>Accuracy</span></div>
      <div class="stat"><strong>x${player.bestStreak}</strong><span>Best streak</span></div>
    `;
  }

  window.setTimeout(() => setOverlayVisibility(elements.resultOverlay, true), 420);
}

function showSetup() {
  state.phase = "setup";
  elements.hud.classList.remove("visible");
  elements.resultOverlay.classList.add("hidden");
  elements.setupOverlay.classList.remove("hidden");
  elements.countdown.classList.remove("visible");
  state.players.forEach((player) => {
    player.trigger = createTriggerState();
  });
}

function updateDuck(duck, deltaSeconds, now) {
  if (duck.hitUntil) {
    if (now >= duck.respawnAt) spawnDuck(duck.playerIndex, true);
    return;
  }

  const dx = duck.targetX - duck.x;
  const dy = duck.targetY - duck.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.025 || now >= duck.nextWaypointAt) {
    pickDuckWaypoint(duck);
    return;
  }

  const speed = DIFFICULTIES[state.difficulty].speed;
  const step = Math.min(speed * deltaSeconds, distance);
  duck.x += (dx / distance) * step;
  duck.y += (dy / distance) * step;
}

function drawLaneDivider(width, height) {
  if (state.mode !== "duel") return;
  ctx.save();
  ctx.strokeStyle = "rgba(197, 213, 235, 0.24)";
  ctx.lineWidth = 1;
  ctx.setLineDash([7, 11]);
  ctx.beginPath();
  ctx.moveTo(width / 2, 92);
  ctx.lineTo(width / 2, height - 72);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(197, 213, 235, 0.72)";
  ctx.font = "800 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("STAY IN YOUR LANE", width / 2, 112);
  ctx.restore();
}

function drawDuck(duck, now, width, height) {
  if (duck.hitUntil && now >= duck.hitUntil) return;
  const radius = duck.radius * Math.min(width, height);
  const x = duck.x * width;
  const y = duck.y * height;
  const flap = Math.sin(now / 90 + duck.playerIndex) * 0.34;
  const hitProgress = duck.hitUntil ? clamp(1 - (duck.hitUntil - now) / 360, 0, 1) : 0;

  ctx.save();
  ctx.translate(x, y + hitProgress * 26);
  ctx.rotate(hitProgress * duck.direction * 0.7);
  ctx.scale(duck.direction * (1 + hitProgress * 0.12), 1 + hitProgress * 0.12);
  ctx.shadowColor = PLAYER_GLOWS[duck.playerIndex];
  ctx.shadowBlur = 24;

  ctx.fillStyle = duck.playerIndex === 0 ? "#0f87a8" : "#7655c9";
  ctx.beginPath();
  ctx.ellipse(0, radius * 0.10, radius * 0.92, radius * 0.58, -0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = duck.playerIndex === 0 ? "#67e8f9" : "#c4b5fd";
  ctx.beginPath();
  ctx.ellipse(-radius * 0.18, radius * (0.08 + flap), radius * 0.50, radius * 0.25, -0.55, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(radius * 0.68, -radius * 0.34, radius * 0.39, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#c8ff62";
  ctx.beginPath();
  ctx.moveTo(radius * 0.98, -radius * 0.38);
  ctx.lineTo(radius * 1.42, -radius * 0.25);
  ctx.lineTo(radius * 0.98, -radius * 0.10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#07101f";
  ctx.beginPath();
  ctx.arc(radius * 0.78, -radius * 0.46, Math.max(2, radius * 0.07), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7fbff";
  ctx.beginPath();
  ctx.arc(radius * 0.80, -radius * 0.49, Math.max(1, radius * 0.022), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = duck.playerIndex === 0 ? "#22d3ee" : "#a78bfa";
  ctx.beginPath();
  ctx.moveTo(-radius * 0.78, -radius * 0.06);
  ctx.lineTo(-radius * 1.30, -radius * 0.48);
  ctx.lineTo(-radius * 1.10, radius * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBomb(bomb, now, width, height) {
  if (bomb.hiddenUntil > now) return;
  const radius = bomb.radius * Math.min(width, height);
  const x = bomb.x * width;
  const y = bomb.y * height + Math.sin(now / 430 + bomb.phase) * 5;
  const pulse = 0.94 + Math.sin(now / 150 + bomb.phase) * 0.06;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = "rgba(251, 113, 133, 0.62)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#111827";
  ctx.strokeStyle = "#fb7185";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = Math.max(2, radius * 0.12);
  ctx.beginPath();
  ctx.moveTo(radius * 0.28, -radius * 0.88);
  ctx.quadraticCurveTo(radius * 0.62, -radius * 1.38, radius * 0.84, -radius * 1.08);
  ctx.stroke();
  ctx.fillStyle = Math.sin(now / 75) > 0 ? "#fef08a" : "#fb7185";
  ctx.beginPath();
  ctx.arc(radius * 0.88, -radius * 1.12, Math.max(2, radius * 0.14), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHandGuide(player, now, width, height) {
  const detection = player.detection;
  if (!detection || now - detection.lastSeen > 240) return;
  const landmarks = detection.landmarks;
  const color = PLAYER_COLORS[player.index];

  if (!detection.analysis.gunShape) {
    ctx.save();
    ctx.strokeStyle = `${color}88`;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    for (const [startIndex, endIndex] of CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(landmarks[startIndex].x * width, landmarks[startIndex].y * height);
      ctx.lineTo(landmarks[endIndex].x * width, landmarks[endIndex].y * height);
      ctx.stroke();
    }
    for (const point of landmarks) {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  const direction = getAimRay(landmarks, width, height);
  const muzzle = {
    x: landmarks[8].x * width + direction.x * 18,
    y: landmarks[8].y * height + direction.y * 18,
  };
  const maxDistance = Math.hypot(width, height) * 1.2;
  const crosshair = {
    x: muzzle.x + direction.x * maxDistance,
    y: muzzle.y + direction.y * maxDistance,
  };

  ctx.save();
  const gradient = ctx.createLinearGradient(muzzle.x, muzzle.y, crosshair.x, crosshair.y);
  gradient.addColorStop(0, `${color}c7`);
  gradient.addColorStop(0.56, `${color}48`);
  gradient.addColorStop(1, `${color}00`);
  ctx.strokeStyle = gradient;
  ctx.lineWidth = player.trigger.armed ? 2.2 : 1.2;
  ctx.beginPath();
  ctx.moveTo(muzzle.x, muzzle.y);
  ctx.lineTo(crosshair.x, crosshair.y);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = player.trigger.armed ? 13 : 4;
  ctx.beginPath();
  ctx.arc(muzzle.x, muzzle.y, player.trigger.armed ? 8 : 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawEffects(now) {
  state.shotEffects = state.shotEffects.filter((effect) => now - effect.startedAt < 170);
  state.impactEffects = state.impactEffects.filter((effect) => now - effect.startedAt < 440);

  for (const effect of state.shotEffects) {
    const age = now - effect.startedAt;
    const progress = clamp(age / 170, 0, 1);
    const currentX = effect.startX + (effect.endX - effect.startX) * progress;
    const currentY = effect.startY + (effect.endY - effect.startY) * progress;
    ctx.save();
    ctx.strokeStyle = PLAYER_COLORS[effect.playerIndex];
    ctx.lineWidth = 4 - progress * 2.8;
    ctx.shadowColor = PLAYER_COLORS[effect.playerIndex];
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(effect.startX, effect.startY);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    ctx.restore();
  }

  for (const effect of state.impactEffects) {
    const progress = clamp((now - effect.startedAt) / 440, 0, 1);
    const radius = 12 + progress * (effect.bomb ? 72 : 52);
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = effect.color;
    ctx.fillStyle = effect.color;
    ctx.lineWidth = 3;
    ctx.shadowColor = effect.color;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    for (let ray = 0; ray < 8; ray += 1) {
      const angle = (Math.PI * 2 * ray) / 8;
      ctx.beginPath();
      ctx.moveTo(effect.x + Math.cos(angle) * radius * 0.58, effect.y + Math.sin(angle) * radius * 0.58);
      ctx.lineTo(effect.x + Math.cos(angle) * radius, effect.y + Math.sin(angle) * radius);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function updateCountdown(now) {
  const remaining = Math.max(0, state.countdownEndsAt - now);
  const count = Math.ceil(remaining / 1_000);
  const display = count > 0 ? String(count) : "GO";
  elements.countdownValue.textContent = display;

  if (state.countdownSpoken !== display) {
    state.countdownSpoken = display;
    playTone(display === "GO" ? 660 : 360 + count * 70, 0.09, 0.05, "sine");
  }

  if (remaining <= 0) beginPlay(now);
}

function updateTimer(now) {
  const remaining = Math.max(0, state.roundEndsAt - now);
  const seconds = remaining / 1_000;
  elements.timerValue.textContent = seconds.toFixed(1);
  elements.timerFill.style.transform = `scaleX(${remaining / ROUND_DURATION_MS})`;
  if (remaining <= 0) finishRound();
}

function renderFrame(now) {
  resizeCanvas();
  const { width, height } = canvasSize();
  const deltaSeconds = Math.min((now - state.lastFrameAt) / 1_000, 0.05);
  state.lastFrameAt = now;
  ctx.clearRect(0, 0, width, height);

  if (state.phase === "countdown") updateCountdown(now);
  if (state.phase === "playing") {
    updateTimer(now);
    updateDuck(state.ducks[0], deltaSeconds, now);
    if (state.mode === "duel") updateDuck(state.ducks[1], deltaSeconds, now);
  }

  if (["countdown", "playing", "results"].includes(state.phase)) {
    drawLaneDivider(width, height);
    drawDuck(state.ducks[0], now, width, height);
    if (state.mode === "duel") drawDuck(state.ducks[1], now, width, height);
    state.bombs[0].forEach((bomb) => drawBomb(bomb, now, width, height));
    if (state.mode === "duel") state.bombs[1].forEach((bomb) => drawBomb(bomb, now, width, height));
    state.players[0] && drawHandGuide(state.players[0], now, width, height);
    if (state.mode === "duel") drawHandGuide(state.players[1], now, width, height);
    drawEffects(now);
  }

  requestAnimationFrame(renderFrame);
}

async function trackingLoop(now, generation) {
  if (!state.trackingActive || generation !== state.trackingGeneration) return;
  requestAnimationFrame((nextNow) => trackingLoop(nextNow, generation));

  if (
    !state.cameraReady ||
    state.trackingBusy ||
    document.hidden ||
    now - state.lastTrackAt < TRACK_INTERVAL_MS ||
    elements.video.readyState < 2
  ) {
    return;
  }

  state.lastTrackAt = now;
  state.trackingBusy = true;
  try {
    await state.hands.send({ image: elements.video });
  } catch (error) {
    showCameraError(`Hand tracking stopped: ${error.message || error}`);
  } finally {
    state.trackingBusy = false;
  }
}

function friendlyCameraError(error) {
  if (error?.name === "NotAllowedError") {
    return "Camera permission was blocked. Allow camera access for this site, then try again.";
  }
  if (error?.name === "NotReadableError") {
    return "The camera is already in use by another application. Close it there, then try again.";
  }
  if (error?.name === "NotFoundError") {
    return "No camera was found on this device.";
  }
  return `The camera could not start: ${error?.message || "Unknown camera error"}`;
}

function showCameraError(message) {
  elements.errorText.textContent = message;
  setOverlayVisibility(elements.errorOverlay, true);
  elements.startButton.disabled = true;
  elements.startButton.textContent = "Camera unavailable";
}

async function stopCamera() {
  state.trackingGeneration += 1;
  state.trackingActive = false;
  state.cameraReady = false;
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }
  if (state.hands?.close) {
    try { await state.hands.close(); } catch (_error) { /* best effort */ }
  }
  state.hands = null;
}

async function setupCamera() {
  setOverlayVisibility(elements.errorOverlay, false);
  elements.startButton.disabled = true;
  elements.startButton.textContent = "Preparing camera…";
  elements.cameraStatus.textContent = "Starting local hand tracking…";
  elements.cameraStatus.classList.remove("ready");

  try {
    await stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser does not support camera access.");
    if (typeof window.Hands !== "function") throw new Error("The local MediaPipe runtime did not load.");

    state.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 960 },
        height: { ideal: 540 },
        frameRate: { ideal: 30, max: 30 },
      },
    });

    elements.video.srcObject = state.stream;
    await elements.video.play();

    state.hands = new window.Hands({
      locateFile: (file) => `./mediapipe-hands/${file}`,
    });
    state.hands.setOptions({
      maxNumHands: state.mode === "duel" ? 2 : 1,
      modelComplexity: 0,
      useCpuInference: true,
      selfieMode: false,
      minDetectionConfidence: 0.58,
      minTrackingConfidence: 0.58,
    });
    state.hands.onResults(handleHandResults);

    state.cameraReady = true;
    state.trackingActive = true;
    state.trackingGeneration += 1;
    state.lastTrackAt = 0;
    const generation = state.trackingGeneration;
    requestAnimationFrame((now) => trackingLoop(now, generation));
    elements.startButton.disabled = false;
    elements.startButton.textContent = "Start 30-second round";
    elements.cameraStatus.textContent = "Camera ready · processing stays on this device";
    elements.cameraStatus.classList.add("ready");
  } catch (error) {
    showCameraError(friendlyCameraError(error));
  }
}

document.querySelectorAll(".mode-choice").forEach((button) => {
  button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    updateModeUI();
    if (state.hands) state.hands.setOptions({ maxNumHands: state.mode === "duel" ? 2 : 1 });
  });
});

document.querySelectorAll(".difficulty-choice").forEach((button) => {
  button.addEventListener("click", () => {
    state.difficulty = button.dataset.difficulty;
    updateDifficultyUI();
  });
});

elements.startButton.addEventListener("click", startRound);
elements.playAgainButton.addEventListener("click", startRound);
elements.setupButton.addEventListener("click", showSetup);
elements.retryButton.addEventListener("click", setupCamera);

elements.soundButton.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  elements.soundButton.textContent = state.soundEnabled ? "♪" : "×";
  elements.soundButton.setAttribute("aria-pressed", String(!state.soundEnabled));
  elements.soundButton.setAttribute("aria-label", state.soundEnabled ? "Mute sound" : "Enable sound");
  if (ambientGain && audioContext) {
    ambientGain.gain.setTargetAtTime(state.soundEnabled ? 0.022 : 0, audioContext.currentTime, 0.04);
  }
  if (state.soundEnabled) ensureAudio();
});

elements.collectButton.addEventListener("click", () => {
  elements.collectButton.disabled = true;
  elements.collectButton.textContent = "Stamp collected";
  window.parent.postMessage({ type: "questpass:completed", activity: "skyshot" }, "*");
});

document.addEventListener("visibilitychange", () => {
  const now = performance.now();
  if (document.hidden && ["countdown", "playing"].includes(state.phase)) {
    state.pausedAt = now;
    elements.pauseCard.classList.add("visible");
    return;
  }

  if (!document.hidden && state.pausedAt) {
    const pausedDuration = now - state.pausedAt;
    if (state.phase === "countdown") state.countdownEndsAt += pausedDuration;
    if (state.phase === "playing") state.roundEndsAt += pausedDuration;
    state.pausedAt = 0;
    state.lastFrameAt = now;
    elements.pauseCard.classList.remove("visible");
  }
});

window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", () => {
  state.stream?.getTracks().forEach((track) => track.stop());
});

window.addEventListener("error", (event) => {
  if (state.cameraReady && event.message) showCameraError(`Game error: ${event.message}`);
});

window.addEventListener("unhandledrejection", (event) => {
  const message = event.reason?.message || String(event.reason || "Unknown error");
  if (state.cameraReady) showCameraError(`Game error: ${message}`);
});

updateModeUI();
updateDifficultyUI();
updateHUD();
resizeCanvas();
requestAnimationFrame(renderFrame);
setupCamera();
