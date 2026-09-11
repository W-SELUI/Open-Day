function distance(a, b, aspect = 1) {
  return Math.hypot((a.x - b.x) * aspect, a.y - b.y);
}
export function fistScore(points, aspect = 1) {
  const wrist = points[0], palm = points[9];
  const fingers = [[8, 6, 5], [12, 10, 9], [16, 14, 13], [20, 18, 17]];
  const curled = fingers.filter(([tip, pip, mcp]) => {
    const reach = distance(points[tip], wrist, aspect);
    const bend = distance(points[pip], wrist, aspect);
    return reach < bend * 1.32 && distance(points[tip], palm, aspect) < distance(points[mcp], wrist, aspect) * 1.55;
  }).length;
  const thumbAcrossPalm = distance(points[4], palm, aspect) < distance(points[2], palm, aspect) * 1.25;
  return (curled + (thumbAcrossPalm ? 1 : 0)) / 5;
}
export function isFist(points, aspect = 1, wasFist = false) {
  return fistScore(points, aspect) >= (wasFist ? .6 : .8);
}
export class HandInput {
  constructor(video, onStatus) {
    this.video = video; this.onStatus = onStatus; this.generation = 0; this.detector = null;
    this.stream = null; this.hand = null; this.lastResult = 0; this.lastInference = 0; this.lastVideoTime = -1;
    this.interval = 55; this.buffer = document.createElement('canvas');
    this.context = this.buffer.getContext('2d', { alpha: false });
  }
  async start() {
    this.stop(); const token = this.generation;
    if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('Camera access needs HTTPS or localhost. You can still play with mouse or touch.');
    this.onStatus('Requesting camera…');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } } });
    if (token !== this.generation) { stream.getTracks().forEach(t => t.stop()); return false; }
    this.stream = stream; this.video.srcObject = stream; await this.video.play();
    if (token !== this.generation) return false;
    stream.getVideoTracks()[0].onended = () => { this.stop(); this.onStatus('Camera disconnected'); };
    this.onStatus('Loading hand tracking…');
    let next;
    try {
      const { FilesetResolver, HandLandmarker } = await import('./vendor/vision_bundle.mjs');
      if (token !== this.generation) return false;
      // Use the classic WASM loader that works with the bundled iPhone fix.
      const files = await FilesetResolver.forVisionTasks(new URL('./vendor/wasm', import.meta.url).href);
      if (token !== this.generation) return false;
      const baseOptions = { modelAssetPath: new URL('./vendor/hand_landmarker.task', import.meta.url).href };
      const options = { baseOptions, runningMode: 'VIDEO', numHands: 1, minHandDetectionConfidence: .55, minHandPresenceConfidence: .5, minTrackingConfidence: .5 };
      try { next = await HandLandmarker.createFromOptions(files, { ...options, baseOptions: { ...baseOptions, delegate: 'GPU' } }); }
      catch { if (token !== this.generation) return false; next = await HandLandmarker.createFromOptions(files, options); }
      if (token !== this.generation) { next.close(); return false; }
      this.detector = next; this.onStatus('Camera connected'); return true;
    } catch (error) {
      if (token === this.generation) this.stop();
      throw error;
    }
  }
  sample(now) {
    if (!this.detector || this.video.readyState < 2 || this.video.currentTime === this.lastVideoTime || now - this.lastInference < this.interval) return this.hand;
    this.lastInference = now; this.lastVideoTime = this.video.currentTime;
    const width = 480, height = Math.round(width * this.video.videoHeight / this.video.videoWidth);
    if (this.buffer.width !== width || this.buffer.height !== height) { this.buffer.width = width; this.buffer.height = height; }
    this.context.drawImage(this.video, 0, 0, width, height);
    const start = performance.now();
    const points = this.detector.detectForVideo(this.buffer, now).landmarks[0];
    const cost = performance.now() - start;
    this.interval = this.interval * .85 + Math.max(50, Math.min(140, cost * 2.3)) * .15;
    if (!points) { this.hand = null; return null; }
    const old = this.hand, aspect = this.video.videoWidth / this.video.videoHeight;
    const fist = isFist(points, aspect, old?.fist);
    const alpha = 1 - Math.exp(-Math.min(200, now - this.lastResult) / 32);
    const smooth = old ? points.map((p, i) => ({ x: old.points[i].x + (p.x - old.points[i].x) * alpha, y: old.points[i].y + (p.y - old.points[i].y) * alpha })) : points;
    this.hand = { points: smooth, fist, fistScore: fistScore(points, aspect), point: { x: (smooth[9].x + smooth[13].x) / 2, y: (smooth[9].y + smooth[13].y) / 2 } };
    this.lastResult = now; return this.hand;
  }
  stop() {
    this.generation++;
    this.stream?.getTracks().forEach(t => { t.onended = null; t.stop(); }); this.stream = null;
    this.video.pause(); this.video.srcObject = null;
    this.detector?.close(); this.detector = null;
    this.hand = null; this.lastResult = 0; this.lastInference = 0; this.lastVideoTime = -1; this.interval = 55;
  }
}
