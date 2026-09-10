let detector;
self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      const { FilesetResolver, HandLandmarker } = await import('./vendor/vision_bundle.mjs');
      const files = await FilesetResolver.forVisionTasks(new URL('./vendor/wasm', self.location.href).href, true);
      const options = { baseOptions: { modelAssetPath: new URL('./vendor/hand_landmarker.task', self.location.href).href }, runningMode: 'VIDEO', numHands: 2, minHandDetectionConfidence: .6, minHandPresenceConfidence: .55, minTrackingConfidence: .5 };
      // GPU in supported workers; CPU remains available on browsers without worker WebGL.
      try { detector = await HandLandmarker.createFromOptions(files, { ...options, baseOptions: { ...options.baseOptions, delegate: 'GPU' } }); }
      catch { detector = await HandLandmarker.createFromOptions(files, options); }
      self.postMessage({ type: 'ready' });
    } catch (error) { self.postMessage({ type: 'error', message: error.message }); }
  } else if (data.type === 'frame') {
    try { const result = detector.detectForVideo(data.bitmap, data.time); self.postMessage({ type: 'result', landmarks: result.landmarks, time: data.time }); }
    catch (error) { self.postMessage({ type: 'error', message: error.message }); }
    finally { data.bitmap.close(); }
  }
};
