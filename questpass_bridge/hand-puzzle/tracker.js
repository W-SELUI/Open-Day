// Stable identities follow wrist positions instead of relying on handedness labels.
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export class HandTracker {
  constructor() { this.tracks = []; this.nextId = 0; }
  reset() { this.tracks = []; }
  update(landmarks, now, aspect = 4 / 3) {
    this.tracks = this.tracks.filter(track => now - track.seen < 250);
    const available = new Set(this.tracks);
    const pairs = [];
    landmarks.forEach((points, index) => this.tracks.forEach(track => pairs.push({ index, track, distance: distance(points[0], track.raw[0]) })));
    pairs.sort((a, b) => a.distance - b.distance);
    const assigned = new Map();
    for (const pair of pairs) if (!assigned.has(pair.index) && available.has(pair.track) && pair.distance < .4) { assigned.set(pair.index, pair.track); available.delete(pair.track); }
    const result = landmarks.map((raw, index) => {
      const old = assigned.get(index);
      const length = (a, b) => Math.hypot((a.x - b.x) * aspect, a.y - b.y);
      const ratio = length(raw[4], raw[8]) / Math.max(.005, length(raw[0], raw[9]));
      const pinching = ratio < (old?.pinching ? .56 : .32);
      const dt = old ? now - old.seen : 100;
      const alpha = 1 - Math.exp(-dt / 24);
      const visual = old && dt < 120 ? raw.map((p, i) => ({ x: old.visual[i].x + (p.x - old.visual[i].x) * alpha, y: old.visual[i].y + (p.y - old.visual[i].y) * alpha, z: p.z })) : raw;
      const track = { id: old?.id ?? this.nextId++, raw, visual, ratio, pinching, justPinched: !!old && !old.pinching && pinching, justReleased: !!old && old.pinching && !pinching, seen: now, point: { x: (raw[4].x + raw[8].x) / 2, y: (raw[4].y + raw[8].y) / 2 } };
      return track;
    });
    this.tracks = [...result, ...available];
    return result;
  }
}

export const HAND_CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
