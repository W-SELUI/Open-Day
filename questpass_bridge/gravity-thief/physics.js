export const WORLD = { width: 1200, height: 660 };
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const wall = (x, y, w, h) => ({ x, y, w, h });
const laser = (x1, y1, x2, y2, extra = {}) => ({ x1, y1, x2, y2, ...extra });

export const LEVELS = [
  { name: 'First contact', hint: 'Make a fist and guide the core around the wall. Release to coast.', par: 25, exitRadius: 43,
    start: { x: 190, y: 470 }, exit: { x: 1010, y: 190 },
    walls: [wall(555, 300, 90, 360)], lasers: [],
    route: [[360, 440], [400, 220], [740, 180], [1010, 190]] },
  { name: 'The long way round', hint: 'Get above the first wall, then under the second.', par: 40, exitRadius: 41,
    start: { x: 150, y: 490 }, exit: { x: 1040, y: 190 },
    walls: [wall(360, 285, 70, 375), wall(765, 0, 70, 370)], lasers: [],
    route: [[230, 160], [570, 160], [580, 470], [980, 470], [1040, 190]] },
  { name: 'Silent alarm', hint: 'Pink means danger. Take the opening below the hanging laser.', par: 40, exitRadius: 39,
    start: { x: 225, y: 440 }, exit: { x: 1035, y: 135 },
    walls: [wall(90, 100, 65, 265), wall(465, 0, 100, 205), wall(475, 500, 110, 160)],
    lasers: [laser(665, 75, 665, 320), laser(205, 565, 415, 565)],
    route: [[385, 380], [800, 390], [995, 260], [1035, 135]] },
  { name: 'A window of opportunity', hint: 'The gate pulses. Hold the core still, then cross when it goes dark.', par: 45, exitRadius: 37,
    start: { x: 185, y: 340 }, exit: { x: 1020, y: 340 },
    walls: [wall(560, 0, 80, 180), wall(560, 480, 80, 180)],
    lasers: [laser(600, 180, 600, 480, { period: 5, on: 2.5 })],
    route: [[420, 330], [810, 330], [1020, 340]] },
  { name: 'Moving target', hint: 'The security beam sweeps up and down. Wait for a clear path.', par: 45, exitRadius: 34,
    start: { x: 175, y: 470 }, exit: { x: 1030, y: 170 },
    walls: [wall(385, 365, 75, 295), wall(790, 0, 75, 265)],
    lasers: [laser(560, 255, 715, 255, { motion: 'y', amplitude: 150, period: 6 })],
    route: [[260, 210], [530, 170], [660, 400], [975, 430], [1030, 170]] },
  { name: 'The final getaway', hint: 'One last vault. Find your line and time the final gate.', par: 60, exitRadius: 31,
    start: { x: 150, y: 490 }, exit: { x: 1060, y: 120 },
    walls: [wall(330, 330, 70, 330), wall(560, 0, 75, 225), wall(840, 440, 70, 220)],
    lasers: [laser(435, 125, 435, 250), laser(710, 210, 710, 410, { period: 5, on: 2.8 }), laser(930, 310, 1130, 310, { period: 4.5, on: 2.2 })],
    route: [[225, 280], [490, 290], [660, 460], [780, 340], [1010, 380], [1060, 120]] }
];

export function laserAt(spec, time) {
  const shift = spec.motion ? Math.sin(time * Math.PI * 2 / spec.period) * spec.amplitude : 0;
  const dx = spec.motion === 'x' ? shift : 0, dy = spec.motion === 'y' ? shift : 0;
  return { ...spec, x1: spec.x1 + dx, y1: spec.y1 + dy, x2: spec.x2 + dx, y2: spec.y2 + dy,
    active: spec.on === undefined || time % spec.period < spec.on };
}
export function pointSegmentDistance(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
export function hitsWall(p, rect, radius = 12) {
  return Math.hypot(p.x - clamp(p.x, rect.x, rect.x + rect.w), p.y - clamp(p.y, rect.y, rect.y + rect.h)) < radius;
}
export function resolveWallCollision(point, rect, radius = 12, bounce = .58) {
  const closestX = clamp(point.x, rect.x, rect.x + rect.w), closestY = clamp(point.y, rect.y, rect.y + rect.h);
  let nx = point.x - closestX, ny = point.y - closestY, distance = Math.hypot(nx, ny);
  if (distance > 0) { nx /= distance; ny /= distance; }
  else {
    const sides = [[point.x - rect.x, -1, 0], [rect.x + rect.w - point.x, 1, 0], [point.y - rect.y, 0, -1], [rect.y + rect.h - point.y, 0, 1]];
    [, nx, ny] = sides.reduce((best, side) => side[0] < best[0] ? side : best);
    distance = 0;
  }
  const penetration = radius - distance;
  if (penetration <= 0) return false;
  point.x += nx * penetration; point.y += ny * penetration;
  const intoWall = point.vx * nx + point.vy * ny;
  if (intoWall < 0) { point.vx -= (1 + bounce) * intoWall * nx; point.vy -= (1 + bounce) * intoWall * ny; }
  point.vx *= .82; point.vy *= .82;
  return true;
}
export function resolveBounds(point, radius = 12) {
  let bumped = false;
  if (point.x < radius) { point.x = radius; point.vx = Math.abs(point.vx) * .7; bumped = true; }
  if (point.x > WORLD.width - radius) { point.x = WORLD.width - radius; point.vx = -Math.abs(point.vx) * .7; bumped = true; }
  if (point.y < radius) { point.y = radius; point.vy = Math.abs(point.vy) * .7; bumped = true; }
  if (point.y > WORLD.height - radius) { point.y = WORLD.height - radius; point.vy = -Math.abs(point.vy) * .7; bumped = true; }
  return bumped;
}
export function starsFor(time, attempts, par) {
  return attempts === 1 && time <= par ? 3 : attempts <= 3 && time <= par * 2 ? 2 : 1;
}
export class GravityGame {
  constructor() { this.load(0); }
  load(index) {
    this.index = clamp(index, 0, LEVELS.length - 1);
    this.level = LEVELS[this.index]; this.elapsed = 0; this.attempts = 1; this.started = false;
    this.mode = 'ready'; this.reason = ''; this.resetCore();
  }
  resetCore() { this.core = { ...this.level.start, vx: 0, vy: 0, r: 12 }; this.trail = []; }
  start() { if (this.mode === 'ready') this.mode = 'playing'; }
  pause() { if (this.mode === 'playing') this.mode = 'paused'; }
  resume() { if (this.mode === 'paused') this.mode = 'playing'; }
  retry() {
    if (!['crashed', 'playing', 'paused'].includes(this.mode)) return;
    this.attempts++; this.resetCore(); this.mode = 'playing'; this.reason = '';
  }
  crash(reason) { this.mode = 'crashed'; this.reason = reason; this.core.vx = this.core.vy = 0; }
  step(dt, input) {
    if (this.mode !== 'playing') return;
    if (input.active) this.started = true;
    if (!this.started) return;
    dt = clamp(dt, 0, 1 / 60);
    this.elapsed += dt;
    const c = this.core;
    if (input.active) {
      // Magnetic grab: the core eases toward a capped target velocity instead of
      // demanding pixel-perfect hand placement or launching at full speed.
      const dx = input.x - c.x, dy = input.y - c.y, distance = Math.hypot(dx, dy);
      const targetSpeed = Math.min(285, distance * 3.4);
      const response = 1 - Math.exp(-11 * dt);
      const targetVx = dx / (distance || 1) * targetSpeed, targetVy = dy / (distance || 1) * targetSpeed;
      c.vx += (targetVx - c.vx) * response; c.vy += (targetVy - c.vy) * response;
      const drag = Math.exp(-.16 * dt);
      c.vx *= drag; c.vy *= drag;
    } else { c.vx *= Math.exp(-.1 * dt); c.vy *= Math.exp(-.1 * dt); }
    const speed = Math.hypot(c.vx, c.vy);
    if (speed > 355) { c.vx *= 355 / speed; c.vy *= 355 / speed; }
    // Small collision substeps keep a fast core from passing through thin beams.
    const count = Math.max(1, Math.ceil(Math.hypot(c.vx, c.vy) * dt / 3));
    for (let i = 0; i < count; i++) {
      c.x += c.vx * dt / count; c.y += c.vy * dt / count;
      resolveBounds(c, c.r);
      for (const wall of this.level.walls) resolveWallCollision(c, wall, c.r);
      if (this.level.lasers.some(spec => {
        const l = laserAt(spec, this.elapsed);
        return l.active && pointSegmentDistance(c, { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }) < c.r + 4;
      })) { this.crash('The laser caught the core. Watch for an opening.'); return; }
      if (Math.hypot(c.x - this.level.exit.x, c.y - this.level.exit.y) < (this.level.exitRadius ?? 31)) { this.mode = 'won'; return; }
    }
    this.trail.push({ x: c.x, y: c.y });
    if (this.trail.length > 90) this.trail.shift();
  }
}
export function formatTime(seconds) {
  const n = Math.floor(seconds);
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
}
export function worldTransform(width, height) {
  const scale = Math.min(width / WORLD.width, height / WORLD.height);
  return { scale, x: (width - WORLD.width * scale) / 2, y: (height - WORLD.height * scale) / 2 };
}
export function screenToWorld(x, y, width, height) {
  const t = worldTransform(width, height);
  return { x: clamp((x - t.x) / t.scale, 0, WORLD.width), y: clamp((y - t.y) / t.scale, 0, WORLD.height) };
}
