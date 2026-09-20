export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

function distance(a, b, aspect = 1) {
  return Math.hypot((a.x - b.x) * aspect, a.y - b.y);
}

export function palmPoint(points) {
  const indices = [0, 5, 9, 13, 17];
  return indices.reduce(
    (point, index) => ({
      x: point.x + points[index].x / indices.length,
      y: point.y + points[index].y / indices.length,
    }),
    { x: 0, y: 0 },
  );
}

export function fistScore(points, aspect = 1) {
  if (!points?.length) return 0;
  const wrist = points[0];
  const palm = points[9];
  const fingers = [
    [8, 6, 5],
    [12, 10, 9],
    [16, 14, 13],
    [20, 18, 17],
  ];
  const curled = fingers.filter(([tip, pip, mcp]) => {
    const reach = distance(points[tip], wrist, aspect);
    const bend = distance(points[pip], wrist, aspect);
    const tipToPalm = distance(points[tip], palm, aspect);
    const knuckleReach = distance(points[mcp], wrist, aspect);
    return reach < bend * 1.32 && tipToPalm < knuckleReach * 1.55;
  }).length;
  const thumbAcrossPalm =
    distance(points[4], palm, aspect) < distance(points[2], palm, aspect) * 1.25;
  return (curled + (thumbAcrossPalm ? 1 : 0)) / 5;
}

export function openPalmScore(points, aspect = 1) {
  if (!points?.length) return 0;
  const wrist = points[0];
  const palm = points[9];
  const fingers = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18],
  ];
  const extended = fingers.filter(([tip, pip]) => {
    const tipReach = distance(points[tip], wrist, aspect);
    const pipReach = distance(points[pip], wrist, aspect);
    const tipPalm = distance(points[tip], palm, aspect);
    const pipPalm = distance(points[pip], palm, aspect);
    return tipReach > pipReach * 1.08 && tipPalm > pipPalm * 1.18;
  }).length;
  const thumbOpen =
    distance(points[4], palm, aspect) > distance(points[3], palm, aspect) * 1.08;
  return (extended + (thumbOpen ? 1 : 0)) / 5;
}

export function smoothLandmarks(previous, next, deltaMs) {
  if (!previous || !next) return next;
  const alpha = 1 - Math.exp(-Math.min(120, Math.max(8, deltaMs)) / 42);
  return next.map((point, index) => ({
    x: previous[index].x + (point.x - previous[index].x) * alpha,
    y: previous[index].y + (point.y - previous[index].y) * alpha,
    z: previous[index].z + ((point.z || 0) - (previous[index].z || 0)) * alpha,
  }));
}

function timeout(promise, milliseconds, message, signal) {
  let timer;
  let cancel;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
      cancel = () => reject(new Error("Camera setup cancelled."));
      signal?.addEventListener("abort", cancel, { once: true });
      if (signal?.aborted) cancel();
    }),
  ]).finally(() => {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  });
}

export class HandTracker {
  constructor(video, onLandmarks, onError) {
    this.video = video;
    this.onLandmarks = onLandmarks;
    this.onError = onError;
    this.generation = 0;
    this.active = false;
  }

  async start(onStatus) {
    this.stop();
    this.abort = new AbortController();
    const signal = this.abort.signal;
    const generation = this.generation;
    const isCurrent = () => generation === this.generation;

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Camera hand tracking needs localhost or HTTPS.");
    }
    if (!window.Worker || !window.OffscreenCanvas || !window.createImageBitmap) {
      throw new Error("Use a current version of Chrome or Edge for hand tracking.");
    }

    try {
      onStatus("REQUESTING CAMERA");
      const mobile =
        navigator.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const cameraRequest = navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: mobile ? { ideal: 480, max: 640 } : { ideal: 640, max: 960 },
          height: mobile ? { ideal: 360, max: 480 } : { ideal: 480, max: 720 },
          frameRate: mobile ? { ideal: 24, max: 24 } : { ideal: 30, max: 30 },
        },
      });
      cameraRequest.then(
        (stream) => {
          if (!isCurrent()) stream.getTracks().forEach((track) => track.stop());
        },
        () => {},
      );
      const stream = await timeout(
        cameraRequest,
        25000,
        "Camera permission is still waiting. Allow access, then retry.",
        signal,
      );
      if (!isCurrent()) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      this.stream = stream;
      this.video.srcObject = stream;
      for (const track of stream.getVideoTracks()) {
        track.addEventListener("ended", () => {
          if (isCurrent()) this.fail("The camera disconnected. Reconnect it and retry.");
        });
      }
      await timeout(
        this.video.play(),
        10000,
        "The camera did not start. Close other apps using it, then retry.",
        signal,
      );
      if (!isCurrent()) return false;

      onStatus("READING THE STARS");
      const worker = (this.worker = new Worker(new URL("./hand-worker.js", import.meta.url)));
      await timeout(
        new Promise((resolve, reject) => {
          worker.onmessage = ({ data }) => {
            if (!isCurrent()) return;
            if (data.type === "ready") resolve();
            if (data.type === "error") reject(new Error(data.message || "Tracker failed to load."));
          };
          worker.onerror = () => reject(new Error("The hand tracker could not start."));
          worker.postMessage({ type: "init" });
        }),
        35000,
        "The hand tracker took too long to load. Please retry.",
        signal,
      );
      if (!isCurrent()) return false;

      this.active = true;
      this.busy = false;
      this.lastCapture = 0;
      this.lastVideoTime = -1;
      this.lastResponse = performance.now();
      worker.onmessage = ({ data }) => {
        if (!isCurrent()) return;
        this.busy = false;
        this.lastResponse = performance.now();
        if (data.type === "landmarks") {
          const fresh = this.lastResponse - data.time < 320;
          this.onLandmarks(fresh ? data.landmarks : null, data.time);
        } else if (data.type === "error") {
          this.fail("Hand tracking stopped. Please retry the camera.");
        }
      };
      worker.onerror = () => {
        if (isCurrent()) this.fail("Hand tracking stopped. Please retry the camera.");
      };

      const capture = async (now) => {
        if (!isCurrent() || !this.active) return;
        this.raf = requestAnimationFrame(capture);
        if (document.hidden) {
          this.lastResponse = now;
          return;
        }
        if (now - this.lastResponse > 15000) {
          this.fail("The camera stopped responding. Please retry.");
          return;
        }
        if (
          this.busy ||
          now - this.lastCapture < 42 ||
          this.video.readyState < 2 ||
          this.video.currentTime === this.lastVideoTime
        ) {
          return;
        }

        this.busy = true;
        this.lastCapture = now;
        this.lastVideoTime = this.video.currentTime;
        try {
          const bitmap = await createImageBitmap(this.video);
          if (!isCurrent() || !this.active) {
            bitmap.close();
            return;
          }
          worker.postMessage({ type: "frame", bitmap, time: now }, [bitmap]);
        } catch {
          if (isCurrent()) this.fail("The camera frame could not be read. Please retry.");
        }
      };
      this.raf = requestAnimationFrame(capture);
      return true;
    } catch (error) {
      if (!isCurrent()) return false;
      this.stop();
      const messages = {
        NotAllowedError: "Camera access was blocked. Allow it in the browser, then retry.",
        NotFoundError: "No camera was found. Connect one, then retry.",
        NotReadableError: "The camera is busy. Close other camera apps, then retry.",
        OverconstrainedError: "This camera could not use the requested settings.",
      };
      throw new Error(messages[error.name] || error.message || "Camera setup failed.");
    }
  }

  fail(message) {
    this.stop();
    this.onError(message);
  }

  stop() {
    this.generation += 1;
    this.active = false;
    this.abort?.abort();
    this.abort = null;
    cancelAnimationFrame(this.raf);
    this.worker?.terminate();
    this.worker = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
  }
}
