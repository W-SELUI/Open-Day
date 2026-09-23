# SkyShot

SkyShot is NeuroVerse's camera-controlled arcade challenge. MediaPipe Hands
runs locally in the visitor's browser and converts a finger-gun pose into a
stable aiming and firing control.

## Controls

1. Point with the index finger.
2. Keep the middle, ring, and pinky fingers folded.
3. Raise the thumb to load.
4. Lower the thumb once to fire.
5. Raise it again before the next shot.

## Open Day modes

- **Solo blast:** one visitor plays a 30-second score round.
- **Side-by-side duel:** two visitors play simultaneously in separate lanes.
- **Easy, Medium, Hard:** changes bird speed, target size, and bomb count.

## Reliability changes from the original prototype

- The game render loop is separate from the MediaPipe inference loop.
- Camera frames are capped at 30 FPS and inference calls never overlap.
- The video element renders the camera directly instead of copying every
  camera frame into the game canvas.
- Trigger pulls use hysteresis, consecutive-frame confirmation, and a lost
  tracking grace period.
- Players have independent trigger cooldowns, effects, scores, and targets.
- Multiplayer uses clear left and right lanes.
- MediaPipe and its model/WASM files are stored locally.
- QuestPass completion is sent only after a finished round and a deliberate
  "Collect QuestPass stamp" action.

## Files

- `index.html` — interface and visual design.
- `game.js` — camera, tracking, gameplay, rendering, sound, and QuestPass.
- `fingerGunClassifier.js` — pose analysis, aiming, and trigger state machine.
- `mediapipe-hands/` — local MediaPipe runtime and model files.

## Local testing

Serve this directory through HTTP rather than opening `index.html` directly:

```text
python -m http.server 8765
```

Then open `http://localhost:8765` in Chrome or Edge and allow camera access.
