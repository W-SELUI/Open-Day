import { FORTUNES, selectFortune } from "./fortune-engine.js";
import {
  HAND_CONNECTIONS,
  HandTracker,
  fistScore,
  openPalmScore,
  palmPoint,
  smoothLandmarks,
} from "./hand-tracker.js";

const $ = (id) => document.getElementById(id);
const app = $("app");
const root = document.documentElement;
const video = $("camera");
const canvas = $("handCanvas");
const context = canvas.getContext("2d");

const HOLD_DURATION = 3000;
const ALIGN_DURATION = 480;
const FIST_CONFIRM_DURATION = 180;
const LOST_HAND_GRACE = 360;
const RELEASE_GRACE = 420;
const EXIT_HOLD_DURATION = 1450;

let state = "boot";
let runId = 0;
let frameId = 0;
let lastFrame = performance.now();
let rawLandmarks = null;
let landmarks = null;
let lastLandmarkTime = 0;
let previousLandmarkTime = 0;
let currentMetrics = null;
let openDwell = 0;
let alignDwell = 0;
let fistDwell = 0;
let charge = 0;
let releaseStarted = 0;
let exitProgress = 0;
let exitEnabled = false;
let completionSent = false;
let sound = false;
let audio = null;
let fortune = FORTUNES[0];
let scanStarted = 0;
let lastScanStep = -1;
let lastAnnouncement = "";
let cameraStarting = false;

const tracker = new HandTracker(video, receiveLandmarks, showCameraError);

function setState(next) {
  if (state === next) return;
  state = next;
  app.dataset.state = next;
  announceState(next);
}

function setText(id, text) {
  const element = $(id);
  if (element.textContent !== text) element.textContent = text;
}

function setInstruction(main, sub = "") {
  setText("instruction", main);
  setText("subInstruction", sub);
}

function announce(message) {
  if (message === lastAnnouncement) return;
  setText("announcer", message);
  lastAnnouncement = message;
}

function announceState(next) {
  const copy = {
    seeking: "The Oracle is ready. Show one open palm.",
    align: "Move your open palm into the crystal.",
    ready: "Close your hand and hold to seal your fate.",
    charging: "Connection started. Hold your fist steady.",
    scanning: "The Oracle is reading your future.",
    reveal: "Your fortune has arrived.",
  };
  if (copy[next]) announce(copy[next]);
}

function cameraBadge(kind, text) {
  const badge = $("cameraBadge");
  badge.classList.remove("live", "error");
  if (kind) badge.classList.add(kind);
  setText("cameraBadgeText", text);
}

function receiveLandmarks(next, capturedAt) {
  const now = performance.now();
  if (!next) {
    rawLandmarks = null;
    return;
  }
  rawLandmarks = next;
  landmarks = smoothLandmarks(
    landmarks,
    next,
    previousLandmarkTime ? now - previousLandmarkTime : 42,
  );
  previousLandmarkTime = now;
  lastLandmarkTime = now;
  void capturedAt;
}

function showCameraError(message) {
  cameraStarting = false;
  rawLandmarks = null;
  landmarks = null;
  cameraBadge("error", "CAMERA PAUSED");
  setState("error");
  setInstruction(message, "Allow camera access and retry. Staff can press Space as a backup.");
  $("retryButton").hidden = false;
  $("handHint").hidden = true;
}

async function startCamera() {
  if (cameraStarting) return;
  cameraStarting = true;
  const token = ++runId;
  resetInteraction(false);
  setState("boot");
  $("retryButton").hidden = true;
  cameraBadge("", "AWAKENING");
  setInstruction(
    "Waking the Oracle…",
    "Allow camera access. Frames stay on this device and are never saved.",
  );

  try {
    const ready = await tracker.start((status) => cameraBadge("", status));
    if (token !== runId || !ready) return;
    cameraStarting = false;
    cameraBadge("live", "HAND TRACKING LIVE");
    setState("seeking");
    setInstruction(
      "Show one open palm",
      "Keep your hand visible and face the camera.",
    );
  } catch (error) {
    if (token === runId) showCameraError(error.message);
  }
}

function resetInteraction(clearFortune = true) {
  openDwell = 0;
  alignDwell = 0;
  fistDwell = 0;
  charge = 0;
  releaseStarted = 0;
  exitProgress = 0;
  exitEnabled = false;
  completionSent = false;
  scanStarted = 0;
  lastScanStep = -1;
  root.style.setProperty("--charge", "0");
  root.style.setProperty("--exit", "0");
  $("scanReadout").hidden = true;
  $("revealScreen").hidden = true;
  $("revealScreen").className = "reveal-screen";
  $("oracleScreen").hidden = false;
  $("exitPrompt").hidden = true;
  if (clearFortune) fortune = FORTUNES[0];
}

function visibleHand(now) {
  return landmarks && now - lastLandmarkTime <= LOST_HAND_GRACE;
}

function screenPoint(point) {
  return {
    x: (1 - point.x) * window.innerWidth,
    y: point.y * window.innerHeight,
  };
}

function measureHand(now) {
  if (!visibleHand(now)) return null;
  const aspect = video.videoWidth && video.videoHeight
    ? video.videoWidth / video.videoHeight
    : 4 / 3;
  const palm = screenPoint(palmPoint(landmarks));
  const orb = $("orb").getBoundingClientRect();
  const center = { x: orb.left + orb.width / 2, y: orb.top + orb.height / 2 };
  const distance = Math.hypot(palm.x - center.x, palm.y - center.y);
  return {
    palm,
    open: openPalmScore(landmarks, aspect),
    fist: fistScore(landmarks, aspect),
    inside: distance < orb.width * 0.68,
  };
}

function updateSeeking(metrics, delta) {
  if (!metrics) {
    openDwell = 0;
    setInstruction("Show one open palm", "Step into good light and face the camera.");
    return;
  }
  if (metrics.open >= 0.72) {
    openDwell += delta;
    setInstruction("The Oracle sees you", "Keep your palm open for a moment.");
    if (openDwell >= 320) {
      openDwell = 0;
      setState("align");
      pulseSound("found");
    }
  } else {
    openDwell = Math.max(0, openDwell - delta * 1.4);
    setInstruction("Open your hand", "Spread your fingers so the Oracle can recognise your palm.");
  }
}

function updateAlign(metrics, delta) {
  if (!metrics) {
    alignDwell = 0;
    setState("seeking");
    return;
  }
  if (metrics.open < 0.58) {
    alignDwell = Math.max(0, alignDwell - delta * 1.5);
    setInstruction("Keep your palm open", "The crystal is waiting for your energy.");
    return;
  }
  if (!metrics.inside) {
    alignDwell = Math.max(0, alignDwell - delta);
    setInstruction("Guide your palm into the crystal", "Follow the glowing hand constellation.");
    return;
  }
  alignDwell += delta;
  setInstruction("Energy detected", "Hold your open palm inside the crystal.");
  if (alignDwell >= ALIGN_DURATION) {
    alignDwell = 0;
    setState("ready");
    setInstruction("Close your hand", "Make a fist and hold it steady for three seconds.");
    pulseSound("ready");
  }
}

function updateReady(metrics, delta) {
  if (!metrics) {
    fistDwell = 0;
    setInstruction("Bring your hand back", "Keep it near the centre of the crystal.");
    return;
  }
  if (!metrics.inside) {
    fistDwell = 0;
    setState("align");
    setInstruction("Move your palm back into the crystal", "Then close your hand.");
    return;
  }
  if (metrics.fist >= 0.72) {
    fistDwell += delta;
    if (fistDwell >= FIST_CONFIRM_DURATION) {
      fistDwell = 0;
      releaseStarted = 0;
      setState("charging");
      setInstruction("Hold your fist steady", "Do not release until the ring is complete.");
      pulseSound("grab");
    }
  } else {
    fistDwell = Math.max(0, fistDwell - delta * 1.8);
    setInstruction("Close your hand", "Make a fist and hold it steady for three seconds.");
  }
}

function updateCharging(metrics, delta, now) {
  const stable = metrics && metrics.inside && metrics.fist >= 0.58;
  if (stable) {
    releaseStarted = 0;
    charge = Math.min(1, charge + delta / HOLD_DURATION);
    const seconds = Math.max(1, Math.ceil((1 - charge) * HOLD_DURATION / 1000));
    setInstruction(
      charge > 0.72 ? "The future is almost locked" : `Hold steady · ${seconds}`,
      "The ring keeps its progress through tiny tracking interruptions.",
    );
    if (charge >= 1) beginScan();
  } else {
    if (!releaseStarted) releaseStarted = now;
    const elapsed = now - releaseStarted;
    if (elapsed <= RELEASE_GRACE) {
      setInstruction("Connection flickered…", "Hold the fist inside the crystal.");
    } else {
      charge = Math.max(0, charge - delta / 2100);
      setInstruction(
        metrics?.inside ? "Close your hand again" : "Bring your fist back to the crystal",
        "The Oracle is keeping part of your progress.",
      );
      if (elapsed > 1250 && charge <= 0.04) {
        releaseStarted = 0;
        charge = 0;
        setState(metrics ? "align" : "seeking");
        setInstruction(
          "You let go",
          "The Oracle now suspects you are hiding something. Try again.",
        );
      }
    }
  }
  root.style.setProperty("--charge", charge.toFixed(4));
}

function beginScan() {
  if (state === "scanning") return;
  setState("scanning");
  charge = 1;
  root.style.setProperty("--charge", "1");
  scanStarted = performance.now();
  lastScanStep = -1;
  $("scanReadout").hidden = false;
  fortune = takeFortune();
  pulseSound("scan");
}

function updateScan(now) {
  const elapsed = now - scanStarted;
  const duration = 6500;
  const progress = Math.min(1, elapsed / duration);
  const eased = 1 - Math.pow(1 - progress, 2.2);
  const percent = Math.min(99, Math.floor(eased * 100));
  $("scanBar").style.width = `${percent}%`;
  setText("scanPercent", `${percent}%`);

  const steps = [
    [0, "READING YOUR AURA", "SIGNAL 09"],
    [1250, "CHECKING TOMORROW…", "TIMELINE 27"],
    [2600, "SEARCHING FOR BAD DECISIONS…", "CHAOS 54"],
    [3950, "CONTACTING THE GROUP CHAT…", "WITNESS 76"],
    [5150, "ONE WARNING FOUND", "SEALED 94"],
  ];
  let nextStep = 0;
  for (let index = 0; index < steps.length; index += 1) {
    if (elapsed >= steps[index][0]) nextStep = index;
  }
  if (nextStep !== lastScanStep) {
    lastScanStep = nextStep;
    setInstruction(steps[nextStep][1], "The result cannot be appealed.");
    setText("scanCode", steps[nextStep][2]);
    pulseSound("tick");
  }
  if (progress >= 1) showReveal();
}

function takeFortune() {
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem("vibe-oracle.history") || "[]");
    if (!Array.isArray(history)) history = [];
  } catch {
    history = [];
  }
  const selected = selectFortune(history);
  try {
    localStorage.setItem("vibe-oracle.history", JSON.stringify(selected.history));
  } catch {
    /* Rotation still works for this run when storage is unavailable. */
  }
  return selected.fortune;
}

function showReveal() {
  if (state === "reveal") return;
  setState("reveal");
  $("scanBar").style.width = "100%";
  setText("scanPercent", "100%");
  setText("fortuneCategory", fortune.category);
  setText("fortuneLineOne", fortune.lines[0]);
  setText("fortuneLineTwo", fortune.lines[1]);
  setText("fortuneLineThree", fortune.lines[2]);
  $("flash").classList.remove("fire");
  void $("flash").offsetWidth;
  $("flash").classList.add("fire");
  $("oracleScreen").hidden = true;
  const reveal = $("revealScreen");
  reveal.hidden = false;
  reveal.className = "reveal-screen";
  pulseSound("reveal");

  const token = runId;
  schedule(token, 260, () => reveal.classList.add("show-stamp"));
  schedule(token, 560, () => reveal.classList.add("show-category"));
  schedule(token, 1250, () => {
    reveal.classList.add("show-one");
    pulseSound("line");
  });
  schedule(token, 2550, () => {
    reveal.classList.add("show-two");
    pulseSound("line");
  });
  schedule(token, 4000, () => {
    reveal.classList.add("show-three");
    pulseSound("punchline");
    announce(`${fortune.lines[0]} ${fortune.lines[1]} ${fortune.lines[2]}`);
  });
  schedule(token, 6400, () => {
    $("exitPrompt").hidden = false;
    exitEnabled = true;
  });
}

function schedule(token, delay, callback) {
  setTimeout(() => {
    if (token === runId) callback();
  }, delay);
}

function updateExit(metrics, delta) {
  if (!exitEnabled || completionSent) return;
  if (metrics?.open >= 0.72) {
    exitProgress = Math.min(1, exitProgress + delta / EXIT_HOLD_DURATION);
  } else {
    exitProgress = Math.max(0, exitProgress - delta / 850);
  }
  root.style.setProperty("--exit", exitProgress.toFixed(4));
  if (exitProgress >= 1) finishExperience();
}

function finishExperience() {
  if (completionSent) return;
  completionSent = true;
  exitEnabled = false;
  tracker.stop();
  $("curtain").classList.add("close");
  pulseSound("complete");
  announce("Fortune sealed. QuestPass stamp collected.");
  setTimeout(() => {
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "questpass:completed", activity: "vibe_oracle" },
        "*",
      );
    } else {
      restartStandalone();
    }
  }, 560);
}

function restartStandalone() {
  runId += 1;
  $("curtain").classList.remove("close");
  resetInteraction();
  setState(tracker.active ? "seeking" : "boot");
  if (tracker.active) {
    setInstruction("Show one open palm", "The Oracle is ready for another visitor.");
  } else {
    void startCamera();
  }
}

function drawHand(now) {
  const ratio = Math.min(1.6, window.devicePixelRatio || 1);
  const width = Math.floor(window.innerWidth * ratio);
  const height = Math.floor(window.innerHeight * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const visible = visibleHand(now);
  $("handHint").hidden = !visible || state === "scanning" || state === "reveal";
  if (!visible) return;
  const points = landmarks.map(screenPoint);
  const alpha = Math.max(0, 1 - (now - lastLandmarkTime) / (LOST_HAND_GRACE + 80));
  const metrics = currentMetrics;
  const active = metrics?.inside && ["align", "ready", "charging"].includes(state);
  const colour = active ? "#dfff8f" : "#7be8ff";

  context.save();
  context.globalAlpha = alpha;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = colour;
  context.fillStyle = colour;
  context.shadowColor = colour;
  context.shadowBlur = active ? 18 : 10;
  context.lineWidth = active ? 2.3 : 1.6;
  context.beginPath();
  for (const [from, to] of HAND_CONNECTIONS) {
    context.moveTo(points[from].x, points[from].y);
    context.lineTo(points[to].x, points[to].y);
  }
  context.stroke();

  points.forEach((point, index) => {
    const important = [0, 4, 8, 12, 16, 20].includes(index);
    context.beginPath();
    context.arc(point.x, point.y, important ? 3.3 : 2.1, 0, Math.PI * 2);
    context.fill();
  });

  if (metrics) {
    const glow = 24 + Math.sin(now / 160) * 3 + charge * 12;
    const gradient = context.createRadialGradient(
      metrics.palm.x,
      metrics.palm.y,
      2,
      metrics.palm.x,
      metrics.palm.y,
      glow,
    );
    gradient.addColorStop(0, active ? "#dfff8faa" : "#7be8ffaa");
    gradient.addColorStop(1, "transparent");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(metrics.palm.x, metrics.palm.y, glow, 0, Math.PI * 2);
    context.fill();
    $("handHint").style.left = `${metrics.palm.x}px`;
    $("handHint").style.top = `${metrics.palm.y}px`;
  }
  context.restore();
}

function update(now) {
  const delta = Math.min(80, Math.max(0, now - lastFrame));
  lastFrame = now;
  currentMetrics = measureHand(now);

  if (state === "seeking") updateSeeking(currentMetrics, delta);
  else if (state === "align") updateAlign(currentMetrics, delta);
  else if (state === "ready") updateReady(currentMetrics, delta);
  else if (state === "charging") updateCharging(currentMetrics, delta, now);
  else if (state === "scanning") updateScan(now);
  else if (state === "reveal") updateExit(currentMetrics, delta);

  drawHand(now);
  frameId = requestAnimationFrame(update);
}

function audioContext() {
  if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
  if (audio.state === "suspended") void audio.resume();
  return audio;
}

function pulseSound(kind) {
  if (!sound) return;
  try {
    const ctx = audioContext();
    const patterns = {
      found: [330, 0.12],
      ready: [440, 0.16],
      grab: [220, 0.24],
      scan: [165, 0.42],
      tick: [520, 0.07],
      reveal: [196, 0.5],
      line: [620, 0.1],
      punchline: [330, 0.34],
      complete: [740, 0.34],
    };
    const [frequency, duration] = patterns[kind] || patterns.tick;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    oscillator.type = kind === "scan" ? "sawtooth" : "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      kind === "complete" ? frequency * 1.8 : frequency * 1.08,
      now + duration,
    );
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "scan" ? 0.025 : 0.045, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  } catch {
    sound = false;
  }
}

function toggleSound() {
  sound = !sound;
  $("soundButton").setAttribute("aria-pressed", String(sound));
  $("soundButton").setAttribute("aria-label", sound ? "Turn sound off" : "Turn sound on");
  $("soundButton").textContent = sound ? "♪" : "♫";
  if (sound) {
    audioContext();
    pulseSound("ready");
  }
}

function staffAdvance() {
  if (["boot", "error", "seeking", "align", "ready", "charging"].includes(state)) {
    runId += 1;
    cameraStarting = false;
    tracker.stop();
    rawLandmarks = null;
    landmarks = null;
    cameraBadge("", "STAFF DEMO MODE");
    charge = 1;
    root.style.setProperty("--charge", "1");
    beginScan();
  } else if (state === "reveal" && exitEnabled) {
    finishExperience();
  }
}

$("retryButton").addEventListener("click", () => void startCamera());
$("soundButton").addEventListener("click", toggleSound);
document.querySelector(".brand").addEventListener("dblclick", staffAdvance);
window.addEventListener("neuroverse:fullscreenerror", () => {
  setInstruction("Fullscreen is unavailable", "The Oracle will still work in this view.");
});

document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    staffAdvance();
  } else if (event.key.toLowerCase() === "m") {
    toggleSound();
  } else if (event.key.toLowerCase() === "r") {
    restartStandalone();
  } else if (event.key === "Enter" && state === "reveal" && exitEnabled) {
    finishExperience();
  }
});

window.addEventListener("pagehide", () => {
  cancelAnimationFrame(frameId);
  tracker.stop();
});

frameId = requestAnimationFrame(update);
setTimeout(() => void startCamera(), 180);
