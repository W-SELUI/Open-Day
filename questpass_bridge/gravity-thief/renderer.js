import { WORLD, worldTransform, laserAt } from './physics.js';
const CYAN = '#72ecff', GOLD = '#ffd46e', PINK = '#ff5299';
const CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
export function cameraPoint(p, sw, sh, width, height) {
  const s = Math.max(width / sw, height / sh);
  return { x: (1 - p.x) * sw * s + (width - sw * s) / 2, y: p.y * sh * s + (height - sh * s) / 2 };
}
function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }
function rounded(ctx, x, y, w, h, r = 8) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
export class Renderer {
  constructor(canvas, video) {
    this.canvas = canvas; this.video = video; this.ctx = canvas.getContext('2d');
    this.width = 1; this.height = 1; this.particles = [];
    this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resizeObserver = new ResizeObserver(() => this.resize()); this.resizeObserver.observe(canvas);
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, r.width); this.height = Math.max(1, r.height);
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.round(this.width * dpr); this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  burst(point, kind) {
    if (this.reduceMotion) return;
    for (let i = 0; i < (kind === 'won' ? 65 : 30); i++) {
      const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 150;
      this.particles.push({ x: point.x, y: point.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        age: 0, life: .5 + Math.random() * .6, color: kind === 'won' ? (i % 3 ? CYAN : GOLD) : PINK });
    }
  }
  draw(game, input, hand, now, dt) {
    const ctx = this.ctx, w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#08111d'; ctx.fillRect(0, 0, w, h);
    if (this.video.readyState >= 2 && this.video.srcObject) {
      const sw = this.video.videoWidth, sh = this.video.videoHeight, s = Math.max(w / sw, h / sh);
      ctx.save(); ctx.globalAlpha = .24; ctx.translate(w, 0); ctx.scale(-1, 1);
      ctx.drawImage(this.video, (w - sw * s) / 2, (h - sh * s) / 2, sw * s, sh * s); ctx.restore();
    }
    const t = worldTransform(w, h);
    ctx.save(); ctx.translate(t.x, t.y); ctx.scale(t.scale, t.scale);
    ctx.beginPath(); ctx.rect(0, 0, WORLD.width, WORLD.height); ctx.clip();
    ctx.strokeStyle = '#29517226'; ctx.lineWidth = .7;
    ctx.beginPath();
    for (let x = 0; x <= WORLD.width; x += 24) { ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.height); }
    for (let y = 0; y <= WORLD.height; y += 24) { ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); }
    ctx.stroke();
    ctx.strokeStyle = '#5184a633'; ctx.strokeRect(1, 1, WORLD.width - 2, WORLD.height - 2);
    const time = this.reduceMotion ? 0 : now;
    for (let i = 0; i < 27; i++) {
      const x = (i * 163.7 + 63) % WORLD.width, y = (i * 97.3 + 51 + time * (i % 3 + 1) * 2) % WORLD.height;
      ctx.globalAlpha = .15 + .14 * Math.sin(i + time); ctx.fillStyle = i % 3 ? '#80c3d7' : GOLD;
      ctx.fillRect(x, y, 1.3, 1.3);
    }
    ctx.globalAlpha = 1;
    for (const r of game.level.walls) {
      const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      g.addColorStop(0, '#203449'); g.addColorStop(1, '#111c2b');
      rounded(ctx, r.x, r.y, r.w, r.h, 5); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = '#537089'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.clip(); ctx.strokeStyle = '#69879b13'; ctx.lineWidth = 1;
      for (let x = r.x - r.h; x < r.x + r.w; x += 18) { ctx.beginPath(); ctx.moveTo(x, r.y); ctx.lineTo(x + r.h, r.y + r.h); ctx.stroke(); }
      ctx.restore();
    }
    for (const spec of game.level.lasers) this.laser(laserAt(spec, game.elapsed), time);
    this.portal(game.level.exit, time, game.mode === 'won', game.level.exitRadius ?? 31);
    if (input.visible && game.mode === 'playing') this.field(input, time);
    if (input.active && game.mode === 'playing') this.magneticLink(game.core, input);
    if (game.trail.length > 2) {
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 1; i < game.trail.length; i += 2) {
        ctx.globalAlpha = i / game.trail.length * .5; ctx.lineWidth = i / game.trail.length * 6;
        ctx.strokeStyle = GOLD; ctx.beginPath(); ctx.moveTo(game.trail[i - 1].x, game.trail[i - 1].y);
        ctx.lineTo(game.trail[i].x, game.trail[i].y); ctx.stroke();
      }
      ctx.restore();
    }
    if (game.mode !== 'crashed' && game.mode !== 'won') {
      const c = game.core;
      const g = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, 44);
      g.addColorStop(0, '#ffdc7377'); g.addColorStop(1, '#ffcc5000');
      ctx.fillStyle = g; circle(ctx, c.x, c.y, 44); ctx.fill();
      ctx.shadowColor = GOLD; ctx.shadowBlur = 20; ctx.strokeStyle = '#ffe7a0'; ctx.lineWidth = 2.5;
      ctx.fillStyle = '#cd962c'; circle(ctx, c.x, c.y, c.r); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.fillStyle = '#fff9d7'; circle(ctx, c.x - 3, c.y - 4, 3.5); ctx.fill();
      if (!game.started) { ctx.font = '500 12px "Space Grotesk", sans-serif'; ctx.fillStyle = '#e8c978'; ctx.textAlign = 'center'; ctx.fillText('THE CORE', c.x, c.y + 35); }
    }
    for (const p of this.particles) {
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life); ctx.fillStyle = p.color;
      circle(ctx, p.x, p.y, 2.5); ctx.fill();
    }
    this.particles = this.particles.filter(p => p.age < p.life); ctx.globalAlpha = 1;
    ctx.restore();
    if (hand && this.video.videoWidth) this.hand(hand);
  }
  laser(l, now) {
    const ctx = this.ctx; ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = l.active ? PINK : '#64788966'; ctx.lineWidth = l.active ? 4 : 2;
    ctx.shadowColor = PINK; ctx.shadowBlur = l.active ? 17 : 0;
    if (!l.active) ctx.setLineDash([7, 9]);
    ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke(); ctx.setLineDash([]);
    if (l.active) { ctx.strokeStyle = '#ffe6ee'; ctx.lineWidth = 1.4; ctx.stroke(); }
    ctx.shadowBlur = 0;
    for (const [x, y] of [[l.x1, l.y1], [l.x2, l.y2]]) {
      ctx.fillStyle = '#201729'; ctx.strokeStyle = l.active ? '#d3407b' : '#536477'; ctx.lineWidth = 2;
      circle(ctx, x, y, 12); ctx.fill(); ctx.stroke(); ctx.fillStyle = l.active ? '#ffbfdb' : '#617489';
      circle(ctx, x, y, 4); ctx.fill();
    }
    ctx.restore();
  }
  portal(p, now, won, radius = 31) {
    const ctx = this.ctx; ctx.save();
    const outer = radius + 10;
    const g = ctx.createRadialGradient(p.x, p.y, 12, p.x, p.y, outer + 31);
    g.addColorStop(0, '#001924'); g.addColorStop(.55, '#10bce344'); g.addColorStop(1, '#19b8e200');
    ctx.fillStyle = g; circle(ctx, p.x, p.y, outer + 31); ctx.fill();
    ctx.shadowColor = '#32dafa'; ctx.shadowBlur = 20;
    ctx.strokeStyle = CYAN; ctx.lineWidth = 4; circle(ctx, p.x, p.y, outer + (won ? Math.sin(now * 4) * 3 : 0)); ctx.stroke();
    ctx.shadowBlur = 0; ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(76,215,245,${.6 - i * .1})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, outer - 7 - i * 6, now * (i % 2 ? .7 : -.8) + i, now * (i % 2 ? .7 : -.8) + i + 4.8); ctx.stroke();
    }
    ctx.setLineDash([2, 12]); ctx.strokeStyle = '#52a9bd77'; circle(ctx, p.x, p.y, outer + 11); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = CYAN; ctx.textAlign = 'center'; ctx.font = '600 13px "Space Grotesk", sans-serif'; ctx.fillText('EXIT', p.x, p.y + outer + 29); ctx.restore();
  }
  magneticLink(core, input) {
    const ctx = this.ctx; ctx.save();
    ctx.setLineDash([5, 9]); ctx.lineWidth = 1.2; ctx.strokeStyle = '#72ecff66';
    ctx.beginPath(); ctx.moveTo(core.x, core.y); ctx.lineTo(input.x, input.y); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
  field(input, now) {
    const ctx = this.ctx, { x, y, active } = input; ctx.save();
    if (active) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 105);
      g.addColorStop(0, '#22daf347'); g.addColorStop(1, '#22daf300');
      ctx.fillStyle = g; circle(ctx, x, y, 105); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const r = 32 + ((now * 24 + i * 24) % 72);
        ctx.strokeStyle = `rgba(100,230,255,${.55 - r / 240})`; ctx.lineWidth = 1; ctx.setLineDash([2, 7]);
        circle(ctx, x, y, r); ctx.stroke();
      }
    }
    ctx.setLineDash([]); ctx.lineWidth = active ? 2.5 : 1.5; ctx.strokeStyle = active ? '#b3faff' : '#8ecee8aa';
    ctx.shadowColor = CYAN; ctx.shadowBlur = active ? 15 : 0; circle(ctx, x, y, active ? 14 : 10); ctx.stroke();
    if (active) { ctx.fillStyle = '#d5fbff'; circle(ctx, x, y, 3); ctx.fill(); }
    ctx.shadowBlur = 0;
    if (active) {
      const lx = Math.min(WORLD.width - 155, x + 35), ly = Math.max(60, y - 90);
      ctx.strokeStyle = '#70daeb77'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 12, y - 12); ctx.lineTo(lx, ly + 16); ctx.stroke();
      rounded(ctx, lx, ly, 130, 28, 5); ctx.fillStyle = '#082431e8'; ctx.fill(); ctx.strokeStyle = '#74e6f4'; ctx.stroke();
      ctx.fillStyle = CYAN; ctx.textAlign = 'center'; ctx.font = '600 11px "Space Grotesk", sans-serif'; ctx.fillText('GRAVITY ACTIVE', lx + 65, ly + 18);
    }
    ctx.restore();
  }
  hand(hand) {
    const ctx = this.ctx, points = hand.points.map(p => cameraPoint(p, this.video.videoWidth, this.video.videoHeight, this.width, this.height));
    ctx.save(); ctx.strokeStyle = hand.fist ? '#98f3ff' : '#75cddd99'; ctx.lineWidth = hand.fist ? 1.8 : 1.2;
    ctx.shadowColor = CYAN; ctx.shadowBlur = hand.fist ? 6 : 0; ctx.beginPath();
    for (const [a, b] of CONNECTIONS) { ctx.moveTo(points[a].x, points[a].y); ctx.lineTo(points[b].x, points[b].y); }
    ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = '#d7fbff';
    for (const p of points) { circle(ctx, p.x, p.y, 2.1); ctx.fill(); }
    ctx.restore();
  }
}
