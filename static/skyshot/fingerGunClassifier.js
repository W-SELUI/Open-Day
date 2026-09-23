const EPSILON = 0.0001;

const DEFAULT_TRIGGER_OPTIONS = Object.freeze({
  pressThreshold: 0.56,
  releaseThreshold: 0.76,
  stableFrames: 2,
  poseFrames: 2,
  lostFrameGrace: 8,
  cooldownMs: 260,
});

export function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function extensionRatio(landmarks, mcp, pip, tip) {
  return distance2D(landmarks[tip], landmarks[mcp]) /
    Math.max(distance2D(landmarks[pip], landmarks[mcp]), EPSILON);
}

/**
 * Read the pose without treating the thumb as part of the gun silhouette.
 * Keeping the thumb out of `gunShape` prevents one noisy frame during a
 * trigger pull from destroying the pose and accidentally re-arming a shot.
 */
export function analyzeFingerGun(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length !== 21) {
    return {
      gunShape: false,
      confidence: 0,
      thumbOpenness: 0,
      palmSize: 0,
    };
  }

  const palmSize = Math.max(distance2D(landmarks[0], landmarks[9]), EPSILON);
  const indexRatio = extensionRatio(landmarks, 5, 6, 8);
  const foldedRatios = [
    extensionRatio(landmarks, 9, 10, 12),
    extensionRatio(landmarks, 13, 14, 16),
    extensionRatio(landmarks, 17, 18, 20),
  ];

  const indexExtended = indexRatio > 1.34;
  const foldedCount = foldedRatios.filter((ratio) => ratio < 1.43).length;
  const gunShape = indexExtended && foldedCount >= 2;
  const thumbOpenness = distance2D(landmarks[4], landmarks[5]) / palmSize;
  const confidence = Math.max(
    0,
    Math.min(1, (indexRatio - 1.05) / 0.48),
  ) * (foldedCount / 3);

  return {
    gunShape,
    confidence,
    thumbOpenness,
    palmSize,
  };
}

/**
 * Return a pixel-correct unit ray from the index knuckle through the tip.
 * Scaling before normalising avoids diagonal drift on wide displays.
 */
export function getAimRay(displayLandmarks, width, height) {
  if (!Array.isArray(displayLandmarks) || displayLandmarks.length !== 21) {
    return { x: 1, y: 0 };
  }

  const dx = (displayLandmarks[8].x - displayLandmarks[5].x) * width;
  const dy = (displayLandmarks[8].y - displayLandmarks[5].y) * height;
  const magnitude = Math.hypot(dx, dy) || 1;

  return { x: dx / magnitude, y: dy / magnitude };
}

export function createTriggerState() {
  return {
    armed: false,
    poseFrameCount: 0,
    pressedFrameCount: 0,
    releasedFrameCount: 0,
    lostFrameCount: 0,
    cooldownUntil: 0,
  };
}

/**
 * Hysteresis + consecutive-frame confirmation for a reliable trigger.
 * A shot is allowed only after the thumb was visibly raised, then lowered.
 */
export function updateTriggerState(
  state,
  analysis,
  now,
  options = DEFAULT_TRIGGER_OPTIONS,
) {
  const settings = { ...DEFAULT_TRIGGER_OPTIONS, ...options };
  let fired = false;

  if (!analysis?.gunShape) {
    state.poseFrameCount = 0;
    state.pressedFrameCount = 0;
    state.releasedFrameCount = 0;
    state.lostFrameCount += 1;

    if (state.lostFrameCount > settings.lostFrameGrace) {
      state.armed = false;
    }

    return { fired, state };
  }

  state.lostFrameCount = 0;
  state.poseFrameCount += 1;

  if (analysis.thumbOpenness >= settings.releaseThreshold) {
    state.releasedFrameCount += 1;
    state.pressedFrameCount = 0;
  } else if (analysis.thumbOpenness <= settings.pressThreshold) {
    state.pressedFrameCount += 1;
    state.releasedFrameCount = 0;
  } else {
    state.pressedFrameCount = 0;
    state.releasedFrameCount = 0;
  }

  if (
    state.poseFrameCount >= settings.poseFrames &&
    state.releasedFrameCount >= settings.stableFrames
  ) {
    state.armed = true;
  }

  if (
    state.armed &&
    state.pressedFrameCount >= settings.stableFrames &&
    now >= state.cooldownUntil
  ) {
    fired = true;
    state.armed = false;
    state.pressedFrameCount = 0;
    state.cooldownUntil = now + settings.cooldownMs;
  }

  return { fired, state };
}

export { DEFAULT_TRIGGER_OPTIONS };
