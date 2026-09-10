import { coverTransform, cameraPoint, cellCenter, cellAt, fitSquare } from './game.js';
import { HAND_CONNECTIONS } from './tracker.js';

const mint = '#adf8d9';
const rounded = (ctx, x, y, w, h, radius = 6) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); };
export class Renderer {
  constructor(canvas, video, onResize) {
    this.canvas = canvas; this.video = video; this.ctx = canvas.getContext('2d', { alpha: true });
    this.width = 1; this.height = 1; this.particles = []; this.flash = 0;
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.observer = new ResizeObserver(() => {
      const old = { width: this.width, height: this.height };
      const rect = canvas.getBoundingClientRect();
      this.width = rect.width; this.height = rect.height;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      onResize?.(old);
    });
    this.observer.observe(canvas);
  }
  defaultFrame() { return fitSquare(this.width * .5, this.height * .54, Math.min(this.width, this.height) * .57, this.width, this.height); }
  point(p) { return cameraPoint(p, this.video.videoWidth, this.video.videoHeight, this.width, this.height); }
  camera(ctx = this.ctx, width = this.width, height = this.height) {
    if (this.video.readyState < 2 || !this.video.videoWidth) return;
    const t = coverTransform(this.video.videoWidth, this.video.videoHeight, width, height);
    ctx.save(); ctx.translate(width, 0); ctx.scale(-1, 1);
    ctx.drawImage(this.video, t.x, t.y, this.video.videoWidth * t.scale, this.video.videoHeight * t.scale);
    ctx.restore();
  }
  capture(frame) {
    const full = document.createElement('canvas'); full.width = Math.round(this.width); full.height = Math.round(this.height);
    // Match the display coordinates exactly, including cover crop and mirroring.
    this.camera(full.getContext('2d'), this.width, this.height);
    const photo = document.createElement('canvas'); photo.width = photo.height = 768;
    photo.getContext('2d').drawImage(full, frame.x, frame.y, frame.size, frame.size, 0, 0, 768, 768);
    this.flash = 1;
    return photo;
  }
  burst(point, count = 18) {
    if (this.reduceMotion) return;
    for (let i = 0; i < count; i++) { const angle = Math.random() * Math.PI * 2; const speed = .6 + Math.random() * 2.4; this.particles.push({ x: point.x, y: point.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color: i % 4 === 0 ? '#ffe5a4' : mint }); }
  }
  draw(state, now, dt = 16) {
    const ctx = this.ctx, w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h);
    if (!state.stream) return;
    this.camera();
    ctx.fillStyle = `rgba(8, 19, 14, ${state.phase === 'solving' || state.phase === 'won' ? .48 : .2})`;
    ctx.fillRect(0, 0, w, h);
    const vignette = ctx.createLinearGradient(0, 0, 0, h);
    vignette.addColorStop(0, '#07140eb5'); vignette.addColorStop(.28, '#07140e00'); vignette.addColorStop(.72, '#07140e00'); vignette.addColorStop(1, '#07140e8a');
    ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
    if (state.phase === 'measuring' && state.frame) this.frame(state.frame, state.measuring, state.hands, state.input);
    if ((state.phase === 'solving' || state.phase === 'won') && state.puzzle && state.photo) this.board(state, now);
    if (state.input === 'hands' && state.phase !== 'won') for (const hand of state.hands) this.hand(hand, state.held?.handId === hand.id);
    if (state.phase === 'solving' && state.held) this.tile(state, state.held.cell, state.held.point, true, now);
    for (const p of this.particles) {
      p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += .025 * dt / 16; p.life -= .022 * dt / 16;
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2); ctx.fill();
    }
    this.particles = this.particles.filter(p => p.life > 0); ctx.globalAlpha = 1;
    if (this.flash > 0) { ctx.fillStyle = `rgba(222, 255, 239, ${this.flash * .55})`; ctx.fillRect(0, 0, w, h); this.flash = Math.max(0, this.flash - dt / 270); }
  }
  frame(frame, active, hands, input) {
    const ctx = this.ctx, { x, y, size } = frame;
    // Reveal the un-dimmed live image only inside the selected crop.
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, size, size); ctx.clip(); this.camera(); ctx.restore();
    ctx.save(); ctx.strokeStyle = active ? mint : '#c6e6d688'; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
    ctx.beginPath(); ctx.strokeStyle = '#eafff224';
    for (let i = 1; i < 3; i++) { ctx.moveTo(x + size * i / 3, y); ctx.lineTo(x + size * i / 3, y + size); ctx.moveTo(x, y + size * i / 3); ctx.lineTo(x + size, y + size * i / 3); }
    ctx.stroke();
    if (active && hands.length === 2 && input === 'hands') { const a = this.point(hands[0].point), b = this.point(hands[1].point); ctx.setLineDash([6, 6]); ctx.strokeStyle = '#baffdd99'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]); }
    ctx.shadowColor = mint; ctx.shadowBlur = active ? 20 : 7; ctx.strokeStyle = mint; ctx.lineWidth = active ? 5 : 3; ctx.lineCap = 'round';
    const length = Math.min(24, size * .08);
    for (const [cx, cy, dx, dy] of [[x,y,1,1],[x+size,y,-1,1],[x,y+size,1,-1],[x+size,y+size,-1,-1]]) { ctx.beginPath(); ctx.moveTo(cx, cy + dy * length); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * length, cy); ctx.stroke(); }
    ctx.shadowBlur = 0;
    const captureSize = Math.round(size / coverTransform(this.video.videoWidth, this.video.videoHeight, this.width, this.height).scale);
    ctx.font = '500 12px "DM Sans", sans-serif';
    const label = active ? `${captureSize} × ${captureSize}` : (input === 'hands' ? 'PINCH TO FRAME' : 'DRAG TO POSITION');
    const labelWidth = ctx.measureText(label).width + 22;
    const lx = x + size - labelWidth, ly = y + size + 13;
    rounded(ctx, lx, ly, labelWidth, 28, 6); ctx.fillStyle = '#0f211be8'; ctx.fill(); ctx.strokeStyle = '#c4fbd040'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#dcf9e9'; ctx.fillText(label, lx + 11, ly + 18); ctx.restore();
  }
  board(state, now) {
    const { frame, held, puzzle } = state, ctx = this.ctx, size = frame.size / 3;
    const target = held ? cellAt(held.point, frame) : -1;
    for (let cell = 0; cell < 9; cell++) {
      const p = cellCenter(cell, frame);
      if (held?.cell === cell) {
        ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = '#adf8d955'; ctx.lineWidth = 1.5;
        rounded(ctx, p.x - size / 2 + 2, p.y - size / 2 + 2, size - 4, size - 4, 5); ctx.stroke(); ctx.restore();
      } else this.tile(state, cell, p, false, now);
      if (target === cell && held.cell !== cell && !puzzle.locked(cell)) {
        ctx.save(); ctx.strokeStyle = puzzle.board[held.cell] === cell ? mint : '#effffb'; ctx.lineWidth = 3; ctx.shadowColor = mint; ctx.shadowBlur = 18;
        rounded(ctx, p.x - size / 2 + 2, p.y - size / 2 + 2, size - 4, size - 4, 5); ctx.stroke(); ctx.restore();
      }
    }
  }
  tile(state, cell, point, held, now) {
    const { frame, puzzle, photo } = state, tile = puzzle.board[cell], ctx = this.ctx;
    const elapsed = now - (state.lockTimes?.get(cell) ?? -1000);
    const pulse = !this.reduceMotion && elapsed < 380 ? Math.sin(elapsed / 380 * Math.PI) * .055 : 0;
    const size = frame.size / 3 - 5, drawSize = size * (held ? 1.055 : 1 + pulse);
    const x = point.x - drawSize / 2, y = point.y - drawSize / 2;
    ctx.save(); ctx.shadowColor = held ? '#000' : mint; ctx.shadowBlur = held ? 25 : (puzzle.locked(cell) ? 11 : 0); ctx.shadowOffsetY = held ? 9 : 0;
    rounded(ctx, x, y, drawSize, drawSize, 5); ctx.fillStyle = '#13291f'; ctx.fill(); ctx.shadowBlur = ctx.shadowOffsetY = 0;
    ctx.save(); rounded(ctx, x, y, drawSize, drawSize, 5); ctx.clip();
    ctx.drawImage(photo, tile % 3 * 256, Math.floor(tile / 3) * 256, 256, 256, x, y, drawSize, drawSize); ctx.restore();
    ctx.strokeStyle = held ? '#dbffed' : puzzle.locked(cell) ? mint : '#e8fff08c'; ctx.lineWidth = held || puzzle.locked(cell) ? 2 : 1;
    rounded(ctx, x, y, drawSize, drawSize, 5); ctx.stroke();
    if (puzzle.locked(cell)) { ctx.fillStyle = '#163b2be0'; ctx.beginPath(); ctx.arc(x + drawSize - 12, y + drawSize - 12, 8, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = mint; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + drawSize - 16, y + drawSize - 12); ctx.lineTo(x + drawSize - 13, y + drawSize - 9); ctx.lineTo(x + drawSize - 8, y + drawSize - 15); ctx.stroke(); }
    ctx.restore();
  }
  hand(hand, holding) {
    const ctx = this.ctx; const points = hand.visual.map(point => this.point(point));
    ctx.save(); ctx.strokeStyle = hand.pinching ? '#b2ffe1' : '#aaf4d5d0'; ctx.shadowColor = mint; ctx.shadowBlur = hand.pinching ? 10 : 5; ctx.lineWidth = hand.pinching ? 2.2 : 1.6;
    ctx.beginPath();
    for (const [start, end] of HAND_CONNECTIONS) { ctx.moveTo(points[start].x, points[start].y); ctx.lineTo(points[end].x, points[end].y); }
    ctx.stroke(); ctx.fillStyle = '#ddffef'; ctx.beginPath();
    for (const p of points) { ctx.moveTo(p.x + 2.8, p.y); ctx.arc(p.x, p.y, 2.8, 0, Math.PI * 2); }
    ctx.fill();
    const p = this.point(hand.point);
    ctx.shadowBlur = 12; ctx.strokeStyle = mint; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, hand.pinching ? 13 : 8, 0, Math.PI * 2); ctx.stroke();
    if (holding || hand.pinching) { ctx.fillStyle = '#c9ffe5'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}
