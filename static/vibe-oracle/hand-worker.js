/* MediaPipe inference stays off the animation thread. Only 21 landmarks leave this worker. */
importScripts("../slice-club/vendor/vision_bundle.js");

let detector;

self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      const files = await Vision.FilesetResolver.forVisionTasks(
        new URL("../slice-club/vendor/wasm", self.location.href).href,
      );
      const options = {
        baseOptions: {
          modelAssetPath: new URL(
            "../slice-club/assets/hand_landmarker.task",
            self.location.href,
          ).href,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.52,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.42,
        canvas: new OffscreenCanvas(640, 480),
      };

      try {
        detector = await Vision.HandLandmarker.createFromOptions(files, options);
      } catch {
        options.baseOptions.delegate = "CPU";
        options.canvas = new OffscreenCanvas(640, 480);
        detector = await Vision.HandLandmarker.createFromOptions(files, options);
      }
      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({ type: "error", message: error.message });
    }
    return;
  }

  if (data.type === "frame") {
    try {
      const result = detector.detectForVideo(data.bitmap, data.time);
      self.postMessage({
        type: "landmarks",
        landmarks: result.landmarks[0] || null,
        time: data.time,
      });
    } catch (error) {
      self.postMessage({ type: "error", message: error.message });
    } finally {
      data.bitmap.close();
    }
  }
};
