export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// The same cover transform is used for the camera image and all its landmarks.
export function coverTransform(sourceWidth, sourceHeight, width, height) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  return { scale, x: (width - sourceWidth * scale) / 2, y: (height - sourceHeight * scale) / 2 };
}
export function cameraPoint(point, sourceWidth, sourceHeight, width, height) {
  const t = coverTransform(sourceWidth, sourceHeight, width, height);
  return { x: (1 - point.x) * sourceWidth * t.scale + t.x, y: point.y * sourceHeight * t.scale + t.y };
}
export function fitSquare(cx, cy, size, width, height) {
  const margin = 18;
  const top = width < 650 ? Math.min(185, height * .32) : Math.min(155, height * .27);
  const bottom = 115;
  const maxSize = Math.max(20, Math.min(width - margin * 2, height - top - bottom));
  size = clamp(size, Math.min(110, maxSize), maxSize);
  // Keep the size limit, but let the crop move across the whole camera area.
  // Reserving top/bottom space for its position also locks vertical movement
  // whenever the square reaches its maximum height on a landscape screen.
  return { x: clamp(cx - size / 2, margin, width - margin - size), y: clamp(cy - size / 2, margin, height - margin - size), size };
}
export function measureSquare(a, b, width, height) {
  return fitSquare((a.x + b.x) / 2, (a.y + b.y) / 2, Math.hypot(b.x - a.x, b.y - a.y) / Math.SQRT2, width, height);
}
export function cellAt(point, frame, grid = 3) {
  const x = (point.x - frame.x) / frame.size;
  const y = (point.y - frame.y) / frame.size;
  if (x < 0 || y < 0 || x >= 1 || y >= 1) return -1;
  return Math.floor(y * grid) * grid + Math.floor(x * grid);
}
export function cellCenter(cell, frame, grid = 3) {
  const size = frame.size / grid;
  return { x: frame.x + (cell % grid + .5) * size, y: frame.y + (Math.floor(cell / grid) + .5) * size };
}
export function shuffledBoard(count = 9, random = Math.random) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const result = Array.from({ length: count }, (_, i) => i);
    for (let i = count - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
    if (result.every((tile, cell) => tile !== cell)) return result;
  }
  return Array.from({ length: count }, (_, i) => (i + 1) % count);
}
export class Puzzle {
  constructor(random = Math.random) { this.board = shuffledBoard(9, random); this.moves = 0; }
  locked(cell) { return this.board[cell] === cell; }
  get progress() { return this.board.filter((tile, cell) => tile === cell).length; }
  get won() { return this.progress === 9; }
  swap(from, to) {
    if (![from, to].every(cell => Number.isInteger(cell) && cell >= 0 && cell < 9) || from === to || this.locked(from) || this.locked(to)) return false;
    [this.board[from], this.board[to]] = [this.board[to], this.board[from]];
    this.moves++;
    return true;
  }
}
export function formatTime(ms) {
  const total = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
}

// Measurements require both visible hands and a deliberate release, never a lost detection.
export class MeasureGesture {
  constructor() { this.reset(); }
  reset() { this.heldSince = null; this.releaseSince = null; this.lastSeen = null; this.armed = false; }
  update(hands, now) {
    if (hands.length !== 2) {
      this.releaseSince = null;
      if (this.lastSeen === null || now - this.lastSeen > 220) this.reset();
      return 'waiting';
    }
    this.lastSeen = now;
    if (hands.every(hand => hand.pinching)) {
      this.heldSince ??= now;
      this.releaseSince = null;
      if (now - this.heldSince >= 180) this.armed = true;
      return 'measuring';
    }
    if (this.armed && hands.some(hand => hand.ratio > .78)) {
      this.releaseSince ??= now;
      if (now - this.releaseSince >= 150) { this.reset(); return 'capture'; }
      return 'releasing';
    }
    this.releaseSince = null;
    if (!this.armed) this.heldSince = null;
    return 'waiting';
  }
}
