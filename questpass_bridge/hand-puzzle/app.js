import { Puzzle, MeasureGesture, measureSquare, fitSquare, cellAt, cellCenter, formatTime } from './game.js';
import { HandTracker } from './tracker.js';
import { Renderer } from './renderer.js';

const $ = id => document.getElementById(id);
const video = $('camera');
const state = { phase: 'idle', stream: null, frame: null, photo: null, puzzle: null, hands: [], held: null, input: 'hands', measuring: false, lockTimes: new Map(), elapsed: 0, started: 0, pausedAt: null, selectedCell: null, readyToGrab: false };
const tracker = new HandTracker();
const measuring = new MeasureGesture();
const renderer = new Renderer($('gameCanvas'), video, old => {
  if (state.frame) state.frame = fitSquare((state.frame.x + state.frame.size / 2) / old.width * renderer.width, (state.frame.y + state.frame.size / 2) / old.height * renderer.height, state.frame.size * Math.min(renderer.width / old.width, renderer.height / old.height), renderer.width, renderer.height);
  state.held = null;
});
let worker = null, detector = null, inferenceBusy = false, lastInference = 0, lastVideoTime = -1;
let session = 0, starting = false, handReady = false, trackingWarning = '', trackingStarted = 0;
let lastHandResult = 0, lastDraw = 0, animationId = 0, pointerDrag = null, winTimer = null;
let soundEnabled = true, audio = null;
let bestTime = 0;
const pageParams = new URLSearchParams(window.location.search);
const streamlitComponentMode = pageParams.has('streamlitUrl') && window.parent !== window;
const questPassMode = (pageParams.get('questpass') === '1' || streamlitComponentMode) && window.parent !== window;

function sendToStreamlit(type, data) {
  if (!streamlitComponentMode) return;
  window.parent.postMessage({ isStreamlitMessage: true, type, ...data }, '*');
}

function sizeForStreamlit() {
  sendToStreamlit('streamlit:setFrameHeight', {
    // The full game screen includes the controls and the short how-to strip.
    // A stable minimum avoids a clipped or blank-looking component on load.
    height: Math.max(930, document.documentElement.scrollHeight),
  });
}

if (streamlitComponentMode) {
  sendToStreamlit('streamlit:componentReady', { apiVersion: 1 });
  window.addEventListener('load', () => requestAnimationFrame(sizeForStreamlit));
  window.addEventListener('resize', sizeForStreamlit);
}
// Keep tracking on the main thread. This is a little more predictable across
// laptop browsers and iOS than transferring video frames through a worker.
const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const useWorkerTracking = false;
try { bestTime = Number(localStorage.getItem('hand-puzzle.best.v1')) || 0; soundEnabled = localStorage.getItem('hand-puzzle.sound.v1') !== 'off'; } catch { /* Storage is optional. */ }

function setText(id, value) { if ($(id).textContent !== value) $(id).textContent = value; }
function status(text) { setText('statusText', text); }
function refreshSound() { $('soundButton').setAttribute('aria-pressed', String(soundEnabled)); $('soundButton').setAttribute('aria-label', soundEnabled ? 'Turn sound off' : 'Turn sound on'); }
function unlockAudio() {
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); void audio.resume().catch(() => {}); } catch { /* Audio is not needed for play. */ }
}
function chime(kind = 'snap') {
  if (!soundEnabled || !audio || audio.state !== 'running') return;
  const notes = kind === 'win' ? [523.25, 659.25, 783.99, 1046.5] : kind === 'snap' ? [587.33, 880] : kind === 'capture' ? [440, 660] : [330];
  notes.forEach((frequency, i) => { const oscillator = audio.createOscillator(), gain = audio.createGain(), time = audio.currentTime + i * .085; oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(.045, time + .012); gain.gain.exponentialRampToValueAtTime(.001, time + .2); oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(time); oscillator.stop(time + .23); });
}
function showUI() {
  const live = !!state.stream, playing = state.phase === 'solving' || state.phase === 'won', pointer = state.input === 'pointer';
  $('welcome').hidden = live;
  $('targetCard').hidden = !playing; $('scoreboard').hidden = !playing;
  $('statusPill').hidden = !live || state.phase === 'won'; $('trackingBadge').hidden = !live || pointer || state.phase === 'won';
  $('inputButton').hidden = !live; $('resetButton').hidden = !playing;
  $('stopButton').hidden = !live && !starting; $('captureButton').hidden = !live || state.phase !== 'measuring' || !pointer;
  $('keyboardControls').hidden = !live || !pointer || state.phase !== 'measuring';
  $('accessibleBoard').hidden = !live || !pointer || state.phase !== 'solving';
  $('movesLabel').hidden = !playing;
  $('collectStampButton').hidden = !(questPassMode && state.phase === 'won');
  $('cameraBadge').classList.toggle('live', live); $('cameraBadge').lastElementChild.textContent = live ? 'CAMERA LIVE' : 'CAMERA OFF';
  $('framePhase').classList.toggle('active', !playing); $('solvePhase').classList.toggle('active', playing);
  setText('inputButton', pointer ? 'Use hand gestures' : 'Use mouse / touch');
  setText('controlLabel', live ? (pointer ? 'MOUSE / TOUCH CONTROLS' : 'HAND GESTURES ON') : 'GOOD LIGHT. BOTH HANDS. LET’S GO.');
  refreshScore();
}
function refreshScore() {
  setText('progressValue', `${state.puzzle?.progress ?? 0} / 9`);
  setText('movesLabel', `${state.puzzle?.moves ?? 0} moves`);
  setText('timeValue', formatTime(state.elapsed));
}
function frameAgain() {
  clearTimeout(winTimer); winTimer = null; $('winOverlay').hidden = true;
  state.phase = 'measuring'; state.frame = renderer.defaultFrame(); state.photo = null; state.puzzle = null;
  state.held = null; state.selectedCell = null; state.elapsed = 0; state.pausedAt = null; state.measuring = false; state.readyToGrab = false;
  state.lockTimes.clear(); measuring.reset(); tracker.reset(); state.hands = [];
  $('accessibleBoard').replaceChildren();
  $('targetCanvas').getContext('2d').clearRect(0, 0, 240, 240);
  $('sizeControl').value = String(state.frame.size / Math.min(renderer.width, renderer.height));
  status(state.input === 'hands' ? 'Show both hands · Pinch your thumb and index fingers' : 'Drag the frame, then choose Capture frame');
  showUI();
}
function stopCamera() {
  session++; starting = false; clearTimeout(winTimer); winTimer = null;
  cancelAnimationFrame(animationId); animationId = 0;
  worker?.terminate(); worker = null; detector?.close(); detector = null;
  state.stream?.getTracks().forEach(track => { track.onended = null; track.stop(); });
  video.pause(); video.srcObject = null;
  state.stream = null; state.phase = 'idle'; state.hands = []; state.held = null; state.photo = null; state.puzzle = null; state.frame = null;
  state.pausedAt = null; state.elapsed = 0; pointerDrag = null;
  handReady = false; inferenceBusy = false; lastVideoTime = -1; trackingWarning = ''; lastHandResult = 0;
  tracker.reset(); measuring.reset(); renderer.particles = [];
  $('winOverlay').hidden = true; $('accessibleBoard').replaceChildren();
  $('targetCanvas').getContext('2d').clearRect(0, 0, 240, 240);
  $('startButton').disabled = false; $('startButton').querySelector('span').textContent = 'Enable camera & play';
  $('startError').hidden = true;
  renderer.ctx.clearRect(0, 0, renderer.width, renderer.height); showUI();
}
function cameraError(error) {
  const messages = {
    NotAllowedError: 'Camera permission is off. Allow camera access for this page in your browser, then try again.',
    NotFoundError: 'No camera was found. Connect a webcam and try again.',
    NotReadableError: 'Your camera is busy. Close other apps using it, then try again.',
    OverconstrainedError: 'This camera could not start with these settings. Try another camera.',
    SecurityError: 'Open this game over HTTPS or localhost to use your camera.',
  };
  return messages[error.name] || 'The camera could not start. Check its connection and browser permission, then try again.';
}
async function startCamera() {
  if (starting || state.stream) return;
  starting = true; const token = ++session; unlockAudio();
  $('startError').hidden = true; $('startButton').disabled = true;
  $('startButton').querySelector('span').textContent = 'Waiting for your camera…'; showUI();
  try {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: 'SecurityError' });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } } });
    if (token !== session) { stream.getTracks().forEach(track => track.stop()); return; }
    state.stream = stream; video.srcObject = stream; await video.play();
    if (token !== session) return;
    stream.getVideoTracks()[0].onended = () => { stopCamera(); $('startError').hidden = false; setText('startError', 'The camera disconnected. Reconnect it and try again.'); };
    starting = false; state.input = 'hands'; frameAgain(); status('Warming up hand tracking…');
    trackingStarted = performance.now(); animationId = requestAnimationFrame(loop);
    // Camera rendering starts immediately while the local vision model loads.
    void initializeTracking(token);
  } catch (error) {
    if (token !== session) return;
    stopCamera(); $('startError').hidden = false; setText('startError', cameraError(error));
    $('startButton').querySelector('span').textContent = 'Try camera again';
  }
}
async function initializeTracking(token) {
  trackingWarning = '';
  try {
    // The main-thread path is smoother for this game because it avoids frame
    // transfer stutter. Keep the capability checks as a safety net for older
    // browsers, but deliberately skip the worker on every device.
    if (!useWorkerTracking || isAppleMobile || !window.Worker || !window.OffscreenCanvas || !window.createImageBitmap) throw new Error('Use the main-thread tracker on this browser');
    const candidate = new Worker(new URL('./tracking-worker.js', import.meta.url), { type: 'module' });
    worker = candidate;
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Hand tracking took too long to load')), 30000);
      candidate.onerror = () => { clearTimeout(timeout); reject(new Error('Worker could not load')); };
      candidate.onmessage = ({ data }) => {
        if (token !== session) { clearTimeout(timeout); return; }
        if (data.type === 'ready') { clearTimeout(timeout); resolve(); }
        else if (data.type === 'result') { inferenceBusy = false; receiveHands(data.landmarks, performance.now()); }
        else if (data.type === 'error') { clearTimeout(timeout); if (handReady) trackingFailed(); else reject(new Error(data.message)); }
      };
      candidate.postMessage({ type: 'init' });
    });
    if (token !== session) { candidate.terminate(); return; }
    candidate.onerror = () => { if (token === session) trackingFailed(); };
    handReady = true;
  } catch {
    if (token !== session) return;
    worker?.terminate(); worker = null;
    try {
      const { FilesetResolver, HandLandmarker } = await import('./vendor/vision_bundle.mjs');
      if (token !== session) return;
      // The classic loader is more reliable in iOS Safari/WebKit than the
      // module-WASM loader, while remaining compatible with modern browsers.
      const files = await FilesetResolver.forVisionTasks(new URL('./vendor/wasm', import.meta.url).href);
      const options = { baseOptions: { modelAssetPath: new URL('./vendor/hand_landmarker.task', import.meta.url).href }, runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: .6, minHandPresenceConfidence: .55, minTrackingConfidence: .5 };
      let next;
      try { next = await HandLandmarker.createFromOptions(files, { ...options, baseOptions: { ...options.baseOptions, delegate: 'GPU' } }); }
      catch { next = await HandLandmarker.createFromOptions(files, options); }
      if (token !== session) { next.close(); return; }
      detector = next; handReady = true;
    } catch { if (token === session) trackingFailed(); }
  }
  if (token === session && handReady && state.phase === 'measuring') status('Show both hands · Pinch your thumb and index fingers');
}
function trackingFailed() {
  worker?.terminate(); worker = null; detector?.close(); detector = null;
  handReady = false; inferenceBusy = false; state.hands = []; state.held = null;
  trackingWarning = 'Hand tracking could not load. Use mouse / touch, or restart the camera to retry.';
  status(trackingWarning); setText('trackingText', 'Tracking unavailable');
}
function receiveHands(landmarks, now) {
  if (!state.stream || state.pausedAt !== null || state.input !== 'hands' || $('helpDialog').open) return;
  lastHandResult = now;
  state.hands = tracker.update(landmarks, now, video.videoWidth / video.videoHeight);
  setText('trackingText', state.hands.length ? `${state.hands.length} ${state.hands.length === 1 ? 'hand' : 'hands'} tracked` : 'Looking for hands');
  $('trackingBadge').classList.toggle('detected', state.hands.length > 0);
  if (state.phase === 'measuring') {
    const action = measuring.update(state.hands, now); state.measuring = action === 'measuring' || action === 'releasing';
    if (action === 'measuring') { state.frame = measureSquare(renderer.point(state.hands[0].point), renderer.point(state.hands[1].point), renderer.width, renderer.height); status('Move your hands to size the frame · Open either pinch to capture'); }
    else if (action === 'capture') capture();
    else if (action === 'releasing') status('Hold open… capturing your moment');
    else if (state.hands.length < 2) status('Show both hands · Pinch your thumb and index fingers');
    else status('Pinch with both hands, then spread them diagonally');
  } else if (state.phase === 'solving') {
    if (!state.readyToGrab) { if (now - state.started > 550 && state.hands.length && state.hands.every(hand => !hand.pinching)) state.readyToGrab = true; status('Open your fingers, then pinch over a tile to pick it up'); return; }
    if (state.held) {
      const hand = state.hands.find(hand => hand.id === state.held.handId);
      if (!hand) { if (now - state.held.lastSeen > 220) { state.held = null; status('Hand lost · Tile returned. Show your hand and pinch again.'); } return; }
      state.held.lastSeen = now;
      if (hand.pinching) { state.held.point = renderer.point(hand.point); state.held.releaseAt = null; status('Move over another tile · Release to swap'); }
      else {
        state.held.releaseAt ??= now;
        if (now - state.held.releaseAt > 90) releaseTile();
      }
    } else {
      for (const hand of state.hands) if (hand.justPinched && grabTile(renderer.point(hand.point), hand.id, now)) break;
      if (!state.held) status('Pinch a tile · Move it · Release to swap');
    }
  }
}
function capture() {
  if (state.phase !== 'measuring' || !state.frame || video.readyState < 2 || state.pausedAt !== null) return;
  state.photo = renderer.capture(state.frame); state.puzzle = new Puzzle(); state.phase = 'solving';
  state.started = performance.now(); state.elapsed = 0; state.held = null; state.selectedCell = null; state.readyToGrab = false;
  state.lockTimes.clear(); measuring.reset();
  const target = $('targetCanvas'); target.getContext('2d').drawImage(state.photo, 0, 0, target.width, target.height);
  chime('capture'); status('Pinch a tile · Move it · Release to swap'); showUI(); updateAccessibleBoard();
}
function grabTile(point, handId = 'pointer', now = performance.now()) {
  if (state.phase !== 'solving' || state.held || state.pausedAt !== null) return false;
  const cell = cellAt(point, state.frame);
  if (cell < 0 || state.puzzle.locked(cell)) return false;
  state.held = { cell, handId, point, lastSeen: now, releaseAt: null };
  chime('pick'); return true;
}
function releaseTile() {
  if (!state.held) return;
  const { cell, point } = state.held; state.held = null;
  swapTiles(cell, cellAt(point, state.frame));
}
function swapTiles(from, to) {
  if (state.phase !== 'solving' || state.pausedAt !== null) return;
  const before = state.puzzle.progress;
  if (!state.puzzle.swap(from, to)) { status('Try another unlocked tile'); return; }
  for (const cell of [from, to]) if (state.puzzle.locked(cell)) { state.lockTimes.set(cell, performance.now()); renderer.burst(cellCenter(cell, state.frame)); }
  chime(state.puzzle.progress > before ? 'snap' : 'pick'); refreshScore(); updateAccessibleBoard();
  if (state.puzzle.won) finishPuzzle();
}
function finishPuzzle() {
  state.phase = 'won'; state.elapsed = performance.now() - state.started; state.held = null; refreshScore();
  chime('win'); renderer.burst({ x: state.frame.x + state.frame.size / 2, y: state.frame.y + state.frame.size / 2 }, 65);
  const isBest = !bestTime || state.elapsed < bestTime;
  if (isBest) { bestTime = state.elapsed; try { localStorage.setItem('hand-puzzle.best.v1', String(bestTime)); } catch { /* The score still works in private browsing. */ } }
  setText('finalTime', formatTime(state.elapsed)); setText('finalMoves', String(state.puzzle.moves));
  setText('bestResult', isBest ? 'A new personal best. Nice hands!' : `Personal best: ${formatTime(bestTime)}`);
  showUI();
  winTimer = setTimeout(() => { if (state.phase === 'won') { $('winOverlay').hidden = false; $('playAgainButton').focus({ preventScroll: true }); } }, renderer.reduceMotion ? 150 : 1100);
}

function updateAccessibleBoard() {
  if (!state.puzzle || !state.photo) return;
  const image = state.photo.toDataURL('image/jpeg', .85);
  const focused = document.activeElement?.dataset.cell;
  $('accessibleBoard').replaceChildren(...state.puzzle.board.map((tile, cell) => {
    const button = document.createElement('button'); button.type = 'button'; button.dataset.cell = String(cell);
    button.textContent = String(cell + 1); button.disabled = state.puzzle.locked(cell);
    button.setAttribute('aria-label', `Position ${cell + 1}, photo piece ${tile + 1}${button.disabled ? ', correct' : '. Select to swap.'}`);
    button.setAttribute('aria-pressed', String(state.selectedCell === cell));
    button.style.backgroundImage = `url(${image})`; button.style.backgroundPosition = `${tile % 3 * 50}% ${Math.floor(tile / 3) * 50}%`;
    button.addEventListener('click', () => { if (state.selectedCell === null) { state.selectedCell = cell; updateAccessibleBoard(); } else { const from = state.selectedCell; state.selectedCell = null; swapTiles(from, cell); updateAccessibleBoard(); } });
    return button;
  }));
  if (focused !== undefined) $('accessibleBoard').querySelector(`[data-cell="${focused}"]`)?.focus({ preventScroll: true });
}

function loop(now) {
  if (!state.stream) return;
  const dt = Math.min(40, now - (lastDraw || now)); lastDraw = now;
  if (state.pausedAt === null) {
    if (state.phase === 'solving') { state.elapsed = now - state.started; setText('timeValue', formatTime(state.elapsed)); }
    if (state.input === 'hands' && handReady && state.phase !== 'won' && !inferenceBusy && now - lastInference > (worker ? 34 : 65) && video.currentTime !== lastVideoTime && video.readyState >= 2) {
      lastInference = now; lastVideoTime = video.currentTime;
      if (worker) {
        inferenceBusy = true; const activeWorker = worker, token = session;
        createImageBitmap(video, { resizeWidth: 512, resizeHeight: Math.round(512 * video.videoHeight / video.videoWidth), resizeQuality: 'low' }).then(bitmap => {
          if (token !== session || worker !== activeWorker) { bitmap.close(); return; }
          activeWorker.postMessage({ type: 'frame', bitmap, time: now }, [bitmap]);
        }).catch(() => { if (token === session) { inferenceBusy = false; trackingFailed(); } });
      } else if (detector) {
        try { receiveHands(detector.detectForVideo(video, now).landmarks, performance.now()); } catch { trackingFailed(); }
      }
    }
    if (state.input === 'hands' && state.hands.length && now - lastHandResult > 300) {
      state.hands = []; state.held = null; state.measuring = false; measuring.reset(); tracker.reset();
      setText('trackingText', 'Looking for hands'); $('trackingBadge').classList.remove('detected');
    }
    if (!handReady && state.input === 'hands' && !trackingWarning) { setText('trackingText', 'Loading hand tracking'); if (now - trackingStarted > 12000) status('Still loading hand tracking… You can use mouse / touch while you wait.'); }
    if (inferenceBusy && now - lastInference > 10000) trackingFailed();
  }
  renderer.draw(state, now, dt); animationId = requestAnimationFrame(loop);
}

function changeInput() {
  state.input = state.input === 'hands' ? 'pointer' : 'hands'; state.held = null; state.hands = []; state.selectedCell = null;
  pointerDrag = null; state.measuring = false; state.readyToGrab = false; tracker.reset(); measuring.reset();
  if (state.input === 'pointer') status(state.phase === 'measuring' ? 'Drag the frame, then choose Capture frame' : 'Drag a tile onto another to swap · Or select the numbered tiles below');
  else status(trackingWarning || (handReady ? 'Show your hands to the camera' : 'Warming up hand tracking…'));
  showUI(); if (state.puzzle) updateAccessibleBoard();
}
function pointerPoint(event) { const rect = $('gameCanvas').getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; }
$('gameCanvas').addEventListener('pointerdown', event => {
  if (!state.stream || state.input !== 'pointer' || state.pausedAt !== null || pointerDrag || event.button !== 0) return;
  const point = pointerPoint(event); unlockAudio();
  if (state.phase === 'measuring') { pointerDrag = { type: 'frame', id: event.pointerId, offsetX: point.x - state.frame.x, offsetY: point.y - state.frame.y }; state.measuring = true; }
  else if (grabTile(point)) pointerDrag = { type: 'tile', id: event.pointerId };
  if (pointerDrag) { $('gameCanvas').setPointerCapture(event.pointerId); event.preventDefault(); }
});
$('gameCanvas').addEventListener('pointermove', event => {
  if (!pointerDrag || pointerDrag.id !== event.pointerId || state.pausedAt !== null) return;
  const point = pointerPoint(event);
  if (pointerDrag.type === 'frame') state.frame = fitSquare(point.x - pointerDrag.offsetX + state.frame.size / 2, point.y - pointerDrag.offsetY + state.frame.size / 2, state.frame.size, renderer.width, renderer.height);
  else if (state.held) state.held.point = point;
});
$('gameCanvas').addEventListener('pointerup', event => {
  if (!pointerDrag || pointerDrag.id !== event.pointerId) return;
  if (pointerDrag.type === 'tile' && state.held) { state.held.point = pointerPoint(event); releaseTile(); }
  pointerDrag = null; state.measuring = false;
  if ($('gameCanvas').hasPointerCapture(event.pointerId)) $('gameCanvas').releasePointerCapture(event.pointerId);
});
for (const event of ['pointercancel', 'lostpointercapture']) $('gameCanvas').addEventListener(event, () => { pointerDrag = null; state.held = null; state.measuring = false; });
$('gameCanvas').addEventListener('keydown', event => {
  if (state.input !== 'pointer' || state.phase !== 'measuring' || state.pausedAt !== null) return;
  if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Enter',' '].includes(event.key)) return;
  event.preventDefault();
  if (event.key === 'Enter' || event.key === ' ') { capture(); return; }
  const step = event.shiftKey ? 30 : 10, frame = state.frame;
  state.frame = fitSquare(frame.x + frame.size / 2 + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), frame.y + frame.size / 2 + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0), frame.size + (event.key === '-' ? -step : ['+','='].includes(event.key) ? step : 0), renderer.width, renderer.height);
  $('sizeControl').value = String(state.frame.size / Math.min(renderer.width, renderer.height));
});
$('sizeControl').addEventListener('input', event => {
  if (state.phase !== 'measuring') return;
  const frame = state.frame;
  state.frame = fitSquare(frame.x + frame.size / 2, frame.y + frame.size / 2, Number(event.target.value) * Math.min(renderer.width, renderer.height), renderer.width, renderer.height);
});
$('startButton').addEventListener('click', startCamera);
$('stopButton').addEventListener('click', stopCamera);
$('finishButton').addEventListener('click', stopCamera);
$('captureButton').addEventListener('click', capture);
$('inputButton').addEventListener('click', changeInput);
$('resetButton').addEventListener('click', frameAgain);
$('playAgainButton').addEventListener('click', frameAgain);
$('collectStampButton').addEventListener('click', () => {
  if (!questPassMode) return;
  if (streamlitComponentMode) {
    sendToStreamlit('streamlit:setComponentValue', {
      value: 'hand_puzzle',
      dataType: 'json',
    });
    return;
  }
  window.parent.postMessage({ type: 'questpass:completed', activity: 'hand_puzzle' }, '*');
});
$('soundButton').addEventListener('click', () => { soundEnabled = !soundEnabled; unlockAudio(); refreshSound(); try { localStorage.setItem('hand-puzzle.sound.v1', soundEnabled ? 'on' : 'off'); } catch { /* Optional preference. */ } if (soundEnabled) chime('snap'); });
$('fullscreenButton').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { if (state.stream) status('Fullscreen is unavailable in this browser. You can keep playing here.'); }
});
document.addEventListener('fullscreenchange', () => $('fullscreenButton').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));
if (!document.documentElement.requestFullscreen) $('fullscreenButton').hidden = true;
function syncPause() {
  const paused = document.hidden || $('helpDialog').open;
  if (!state.stream) return;
  if (paused && state.pausedAt === null) { state.pausedAt = performance.now(); state.held = null; pointerDrag = null; state.hands = []; state.measuring = false; measuring.reset(); tracker.reset(); }
  if (!paused && state.pausedAt !== null) { if (state.phase === 'solving') state.started += performance.now() - state.pausedAt; state.pausedAt = null; state.readyToGrab = false; }
}
$('helpButton').addEventListener('click', () => { $('helpDialog').showModal(); syncPause(); });
$('closeHelp').addEventListener('click', () => $('helpDialog').close());
$('gotItButton').addEventListener('click', () => $('helpDialog').close());
$('helpDialog').addEventListener('close', syncPause);
document.addEventListener('visibilitychange', syncPause);
window.addEventListener('pagehide', stopCamera);

refreshSound(); showUI();
