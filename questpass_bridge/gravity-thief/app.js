import { GravityGame, LEVELS, WORLD, formatTime, screenToWorld, starsFor } from './physics.js';
import { Renderer, cameraPoint } from './renderer.js';
import { HandInput } from './hand-input.js';

const $ = id => document.getElementById(id);
const game = new GravityGame();
const renderer = new Renderer($('gameCanvas'), $('camera'));
const input = { x: 400, y: 330, active: false, visible: false };
const keys = new Set();
const results = new Map();
let mode = 'pointer', overlayKind = 'start', loading = false, session = 0;
let pointerId = null, mustRelease = true, handPaused = false, previousHand = false;
let lastFrame = 0, accumulator = 0, frameId = 0;
let sound = false, audio = null, parentOrigin = null, streamlit = false;
let lastAnnounced = '';
const handInput = new HandInput($('camera'), message => {
  text('cameraStatusText', message);
  $('cameraStatus').classList.toggle('live', !!handInput.stream);
  if (message === 'Camera disconnected' && mode === 'camera' && game.mode === 'playing') {
    pause(); text('errorText', 'The camera disconnected. Reconnect it or use mouse / touch.'); $('errorText').hidden = false;
  }
});
try { sound = localStorage.getItem('gravity-thief.sound') === 'on'; } catch { /* Optional preference. */ }

function text(id, value) { if ($(id).textContent !== value) $(id).textContent = value; }
function announce(message) { if (message !== lastAnnounced) { text('announcer', message); lastAnnounced = message; } }
function release() { input.active = false; pointerId = null; keys.clear(); mustRelease = true; }
function focusGame() { $('gameCanvas').focus({ preventScroll: true }); }
function unlockAudio() {
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); void audio.resume().catch(() => {}); } catch { /* Audio is optional. */ }
}
function playSound(kind) {
  if (!sound || audio?.state !== 'running') return;
  const notes = kind === 'won' ? [440, 554, 659, 880] : kind === 'crashed' ? [150, 100] : [330, 440];
  notes.forEach((hz, i) => {
    const o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime + i * .08;
    o.type = 'sine'; o.frequency.value = hz; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.04, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + .2);
    o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + .23);
  });
}
function refreshHUD() {
  text('levelNumber', `LEVEL ${String(game.index + 1).padStart(2, '0')} / 06`);
  text('levelName', game.level.name); text('timer', formatTime(game.elapsed)); text('attempts', `ATTEMPT ${String(game.attempts).padStart(2, '0')}`);
  text('levelHint', game.level.hint);
  $('pauseButton').disabled = !['playing', 'paused'].includes(game.mode) || loading;
  $('pauseButton').setAttribute('aria-label', game.mode === 'paused' ? 'Resume game' : 'Pause game');
  $('restartButton').disabled = game.mode === 'ready' || loading;
  $('modeButton').hidden = game.mode === 'ready' || loading;
  text('modeButton', mode === 'camera' ? 'Use mouse / touch' : 'Use camera');
  $('soundButton').setAttribute('aria-pressed', String(sound)); $('soundButton').setAttribute('aria-label', sound ? 'Turn sound off' : 'Turn sound on');
  const active = game.mode === 'playing' && !overlayKind;
  $('hintPill').hidden = !active;
  text('hintPill', mode === 'camera'
    ? (handInput.hand ? mustRelease ? 'Open your hand, then make a fist to pull' : input.active ? 'Move slowly · open your hand to release' : 'Make a fist to pull' : 'Show one hand to the camera')
    : input.active ? 'Move gently to steer · release to coast' : 'Hold to pull · release to coast');
  text('inputBadge', mode === 'camera' && handInput.stream ? 'LIVE CAMERA' : game.mode === 'ready' ? 'READY WHEN YOU ARE' : 'MOUSE / TOUCH');
  $('trackingDot').classList.toggle('detected', mode === 'camera' && !!handInput.hand);
  $('handNotice').hidden = !handPaused || !!overlayKind;
}
function showOverlay(kind) {
  overlayKind = kind; $('overlay').hidden = !kind; $('errorText').hidden = true;
  if (!kind) { refreshHUD(); return; }
  release(); input.visible = false;
  $('primaryButton').disabled = false; $('secondaryButton').hidden = false;
  $('resultStats').hidden = kind !== 'won'; $('privacyNote').hidden = kind !== 'start';
  $('overlayOrb').hidden = kind === 'won';
  const last = game.index === LEVELS.length - 1;
  const copy = {
    start: ['YOUR HANDS. YOUR GRAVITY.', 'Make your getaway.', 'Pull a stolen energy core past security lasers. One hand is all you need.', 'Enable camera & play', 'Play with mouse / touch'],
    pause: ['TAKE A BREATHER', 'Gravity can wait.', 'Your core and timer are paused. Pick up right where you left off.', 'Resume game', mode === 'camera' ? 'Use mouse / touch' : 'Restart level'],
    crashed: ['A SMALL SETBACK', 'Caught by security.', game.reason, 'Try again', 'Start level over'],
    won: [last ? 'THE VAULT IS EMPTY' : 'CORE RECOVERED', last ? 'A clean getaway.' : 'Nicely handled.', last ? 'All six levels cleared. Ready to collect your QuestPass stamp?' : `${game.level.name} cleared. Your next escape is waiting.`, last ? (streamlit ? 'Collect QuestPass Stamp & Return' : 'Play again') : 'Next level →', 'Replay this level']
  }[kind];
  text('overlayKicker', copy[0]); text('overlayTitle', copy[1]); text('overlayBody', copy[2]); text('primaryButton', copy[3]); text('secondaryButton', copy[4]);
  if (kind === 'won') {
    text('resultTime', formatTime(game.elapsed)); text('resultAttempts', String(game.attempts));
    text('resultStars', '★'.repeat(starsFor(game.elapsed, game.attempts, game.level.par)) + '☆'.repeat(3 - starsFor(game.elapsed, game.attempts, game.level.par)));
  }
  announce(`${copy[1]} ${copy[2]}`); refreshHUD();
  if (kind !== 'start') $('primaryButton').focus({ preventScroll: true });
}
function startLevel(index) {
  game.load(index); game.start(); renderer.particles = []; accumulator = 0; handPaused = false; previousHand = false;
  release(); showOverlay(null); focusGame(); announce(`Level ${index + 1}. ${game.level.name}. ${game.level.hint}`);
}
function beginPointer() {
  session++; loading = false; handInput.stop(); mode = 'pointer'; handPaused = false; previousHand = false;
  text('cameraStatusText', 'Camera off'); $('cameraStatus').classList.remove('live');
  if (game.mode === 'ready') game.start(); else if (game.mode === 'paused') game.resume();
  release(); showOverlay(null); focusGame(); unlockAudio();
}
async function beginCamera() {
  const token = ++session; release(); game.pause(); handPaused = false; mode = 'camera';
  showOverlay('start'); loading = true; $('primaryButton').disabled = true;
  text('primaryButton', 'Starting your camera…'); text('overlayBody', 'Allow camera access, then hold one hand up. The first load can take a moment.');
  unlockAudio(); refreshHUD(); let timeout;
  try {
    const ready = await Promise.race([handInput.start(), new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('Hand tracking took too long to load. Retry the camera or use mouse / touch.')), 60000); })]);
    if (token !== session || !ready) return;
    loading = false; game.mode === 'ready' ? game.start() : game.resume();
    mustRelease = true; previousHand = false; showOverlay(null); focusGame();
  } catch (error) {
    if (token !== session) return;
    loading = false; handInput.stop(); showOverlay('start');
    const errors = {
      NotAllowedError: 'Camera access was blocked. Allow it in your browser, or choose mouse / touch. Embedded games also need camera permission from the host page.',
      NotFoundError: 'No camera was found. Connect one or choose mouse / touch.',
      NotReadableError: 'The camera is busy. Close other apps using it and retry.'
    };
    text('errorText', errors[error.name] || error.message || 'Hand tracking could not start. Try again or choose mouse / touch.'); $('errorText').hidden = false;
    text('cameraStatusText', 'Camera unavailable'); $('cameraStatus').classList.remove('live');
  } finally { clearTimeout(timeout); }
}
function pause() {
  if (game.mode !== 'playing' && !handPaused) return;
  game.pause(); handPaused = false; showOverlay('pause');
}
function resume() { release(); game.resume(); accumulator = 0; handPaused = false; showOverlay(null); focusGame(); }
function retry() { game.retry(); handPaused = false; previousHand = false; release(); accumulator = 0; showOverlay(null); focusGame(); }

$('primaryButton').addEventListener('click', () => {
  unlockAudio();
  if (overlayKind === 'start') void beginCamera();
  else if (overlayKind === 'pause') resume();
  else if (overlayKind === 'crashed') retry();
  else if (overlayKind === 'won') {
    if (game.index === LEVELS.length - 1 && streamlit && parentOrigin) {
      handInput.stop();
      window.parent.postMessage({ isStreamlitMessage: true, type: 'streamlit:setComponentValue', value: { action: 'completed' }, dataType: 'json' }, parentOrigin);
      return;
    }
    if (game.index === LEVELS.length - 1) results.clear();
    startLevel((game.index + 1) % LEVELS.length);
  }
});
$('secondaryButton').addEventListener('click', () => {
  if (overlayKind === 'start' || (overlayKind === 'pause' && mode === 'camera')) beginPointer();
  else startLevel(game.index);
});
$('pauseButton').addEventListener('click', () => game.mode === 'paused' ? resume() : pause());
$('restartButton').addEventListener('click', () => game.mode === 'won' ? startLevel(game.index) : retry());
$('modeButton').addEventListener('click', () => mode === 'camera' ? beginPointer() : void beginCamera());
$('soundButton').addEventListener('click', () => {
  sound = !sound; unlockAudio(); refreshHUD(); if (sound) playSound('start');
  try { localStorage.setItem('gravity-thief.sound', sound ? 'on' : 'off'); } catch { /* Optional preference. */ }
});
$('fullscreenButton').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { text('levelHint', 'Fullscreen is unavailable here. You can keep playing in this view.'); }
});
if (!document.documentElement.requestFullscreen) $('fullscreenButton').hidden = true;
document.addEventListener('fullscreenchange', () => $('fullscreenButton').setAttribute('aria-label', document.fullscreenElement ? 'Exit fullscreen' : 'Enter fullscreen'));

function pointerPoint(e) {
  const r = $('gameCanvas').getBoundingClientRect();
  return screenToWorld(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
}
$('gameCanvas').addEventListener('pointerdown', e => {
  if (mode !== 'pointer' || game.mode !== 'playing' || overlayKind || e.button !== 0 || pointerId !== null) return;
  e.preventDefault(); focusGame(); unlockAudio(); pointerId = e.pointerId; keys.clear();
  Object.assign(input, pointerPoint(e), { active: true, visible: true }); mustRelease = false;
  $('gameCanvas').setPointerCapture(e.pointerId);
});
$('gameCanvas').addEventListener('pointermove', e => {
  if (mode !== 'pointer' || (pointerId !== null && e.pointerId !== pointerId)) return;
  Object.assign(input, pointerPoint(e)); input.visible = true;
});
function endPointer(e) {
  if (e.pointerId !== pointerId) return;
  input.active = false; pointerId = null;
  if ($('gameCanvas').hasPointerCapture(e.pointerId)) $('gameCanvas').releasePointerCapture(e.pointerId);
}
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) $('gameCanvas').addEventListener(name, endPointer);
$('gameCanvas').addEventListener('pointerleave', () => { if (pointerId === null) input.visible = false; });
document.addEventListener('keydown', e => {
  if ($('helpDialog').open || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
  if (e.key === 'Escape') { if (overlayKind === 'pause') resume(); else pause(); return; }
  if (e.key.toLowerCase() === 'r' && game.mode !== 'ready' && !loading) { e.preventDefault(); if (!e.repeat) game.mode === 'won' ? startLevel(game.index) : retry(); return; }
  if (mode !== 'pointer' || game.mode !== 'playing' || overlayKind || e.target.tagName === 'BUTTON') return;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
    e.preventDefault(); keys.add(e.key); input.visible = true; if (e.key === ' ') { input.active = true; mustRelease = false; }
  }
});
document.addEventListener('keyup', e => { keys.delete(e.key); if (e.key === ' ' && pointerId === null && mode === 'pointer') input.active = false; });
window.addEventListener('blur', () => { if (game.mode === 'playing') pause(); else release(); });
$('helpButton').addEventListener('click', () => { pause(); $('helpDialog').showModal(); });
for (const id of ['closeHelp', 'gotItButton']) $(id).addEventListener('click', () => $('helpDialog').close());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pause(); $('camera').pause(); }
  else { lastFrame = 0; accumulator = 0; if (handInput.stream) void $('camera').play().catch(() => {}); }
});
window.addEventListener('pagehide', () => { session++; handInput.stop(); release(); cancelAnimationFrame(frameId); });
window.addEventListener('pageshow', e => {
  if (e.persisted) { loading = false; mode = 'pointer'; game.load(game.index); showOverlay('start'); text('cameraStatusText', 'Camera off'); $('cameraStatus').classList.remove('live'); lastFrame = 0; frameId = requestAnimationFrame(loop); }
});

// Standard Streamlit component messages: resize, return-to-menu, and final completion only.
// No camera frames or hand landmarks are sent to the surrounding app.
const embedded = window.parent !== window;
if (embedded) {
  document.body.classList.add('embedded');
  try { parentOrigin = new URL(document.referrer).origin; } catch { /* Referrer may be disabled. */ }
  window.parent.postMessage({ isStreamlitMessage: true, type: 'streamlit:componentReady', apiVersion: 1 }, parentOrigin || '*');
}
function sendHeight() {
  if (streamlit && parentOrigin) window.parent.postMessage({ isStreamlitMessage: true, type: 'streamlit:setFrameHeight', height: Math.ceil(document.body.getBoundingClientRect().height) + 4 }, parentOrigin);
}
window.addEventListener('message', e => {
  if (!embedded || e.source !== window.parent || e.data?.type !== 'streamlit:render' || (parentOrigin && e.origin !== parentOrigin)) return;
  parentOrigin = e.origin; streamlit = true; $('backButton').hidden = true; sendHeight();
});
const pageObserver = new ResizeObserver(sendHeight); pageObserver.observe(document.body);
let hubUrl = null;
try { const value = new URLSearchParams(location.search).get('hub'); if (value) { const url = new URL(value); if (['https:', 'http:'].includes(url.protocol)) { hubUrl = url.href; $('backButton').hidden = false; } } } catch { /* Ignore invalid return URLs. */ }
$('backButton').addEventListener('click', () => {
  pause(); handInput.stop(); text('cameraStatusText', 'Camera off'); $('cameraStatus').classList.remove('live');
  if (streamlit && parentOrigin) window.parent.postMessage({ isStreamlitMessage: true, type: 'streamlit:setComponentValue', value: { action: 'back' }, dataType: 'json' }, parentOrigin);
  else if (hubUrl) window.location.assign(hubUrl);
});

function loop(now) {
  const dt = Math.min(.075, lastFrame ? (now - lastFrame) / 1000 : 0); lastFrame = now;
  if (!document.hidden) {
    if (mode === 'camera' && handInput.detector && !loading && !overlayKind && !$('helpDialog').open) {
      try {
        const hand = handInput.sample(now);
        if (hand && now - handInput.lastResult < 250) {
          if (handPaused) { game.resume(); handPaused = false; accumulator = 0; mustRelease = true; }
          previousHand = true;
          const p = cameraPoint(hand.point, $('camera').videoWidth, $('camera').videoHeight, renderer.width, renderer.height);
          Object.assign(input, screenToWorld(p.x, p.y, renderer.width, renderer.height)); input.visible = true;
          if (!hand.fist) mustRelease = false;
          input.active = hand.fist && !mustRelease && game.mode === 'playing';
        } else {
          input.active = false; input.visible = false; mustRelease = true;
          if (previousHand && game.mode === 'playing') { game.pause(); handPaused = true; accumulator = 0; }
        }
      } catch {
        handInput.stop(); pause(); text('cameraStatusText', 'Tracking unavailable'); $('cameraStatus').classList.remove('live');
        text('errorText', 'Hand tracking stopped. Switch to mouse / touch, then use the camera button to retry.'); $('errorText').hidden = false;
      }
    }
    if (mode === 'pointer' && game.mode === 'playing') {
      const speed = 420 * dt;
      input.x = Math.max(0, Math.min(WORLD.width, input.x + (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'))) * speed));
      input.y = Math.max(0, Math.min(WORLD.height, input.y + (Number(keys.has('ArrowDown')) - Number(keys.has('ArrowUp'))) * speed));
    }
    if (game.mode === 'playing' && !overlayKind) {
      accumulator += dt;
      while (accumulator >= 1 / 120 && game.mode === 'playing') { game.step(1 / 120, input); accumulator -= 1 / 120; }
      if (game.mode === 'crashed' || game.mode === 'won') {
        renderer.burst(game.mode === 'won' ? game.level.exit : game.core, game.mode); playSound(game.mode);
        if (game.mode === 'won') results.set(game.index, { time: game.elapsed, attempts: game.attempts });
        showOverlay(game.mode);
      }
    } else accumulator = 0;
    renderer.draw(game, input, mode === 'camera' && !overlayKind ? handInput.hand : null, now / 1000, dt);
    refreshHUD();
  }
  frameId = requestAnimationFrame(loop);
}
refreshHUD(); frameId = requestAnimationFrame(loop);
