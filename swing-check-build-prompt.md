# Build prompt — paste everything below this line into Cowork

Build me a complete, production-quality golf swing analysis web app as a SINGLE self-contained HTML file (all CSS and JS inline) that I will open in Safari on iPhone and install via "Add to Home Screen". Everything must be 100% free to run — no backend, no Supabase, no hosting costs, no paid APIs, no accounts. All data stays on my phone.

## What the app does

I record or upload a video of my golf swing. The app runs pose estimation on it, detects the phases of my swing, compares my joint angles against my own calibrated "good swing" reference data, and plays the video back with a skeleton overlay where each body segment is GREEN if it's within range and RED if it's out of range for that phase of the swing. It tells me plainly, in words, which body part went wrong and when (e.g. "Lead knee straightened too early in the downswing").

## Core tech (all free, all on-device)

- Pose estimation: MediaPipe Pose (Tasks Vision API) loaded from CDN (jsdelivr), running fully in the browser on-device. Use the HEAVY model variant for maximum accuracy, with a settings toggle to drop to LITE if the phone struggles. Cache the model with a service worker so it works offline after first load.
- PWA: include an inline manifest (data URI or injected), service worker registered from the same file if possible, apple-touch-icon as embedded base64, correct meta tags so it installs cleanly from Safari and runs fullscreen standalone.
- Storage: IndexedDB for reference swing data, calibration profiles, and analysis history. localStorage only for small settings. No video files stored (too big) — store extracted keypoint/angle data only, so storage stays tiny.
- Video: <input type="file" accept="video/*" capture="environment"> so I can record directly from the app or pick from my camera roll. Process frame-by-frame with requestVideoFrameCallback (fallback to timeupdate stepping).

## Pose + analysis pipeline

1. Extract 33 MediaPipe landmarks per frame with visibility scores. Discard/interpolate low-visibility frames. Apply light smoothing (One Euro filter or moving average) so the skeleton doesn't jitter.
2. Compute per-frame joint angles: lead/trail knee flex, hip hinge (spine tilt from vertical), shoulder turn vs hip turn (X-factor separation), lead arm extension (shoulder–elbow–wrist), trail elbow fold, head position drift (sway), wrist height, stance width ratio, weight-shift proxy (hip midpoint lateral movement relative to ankle midpoint).
3. Swing phase detection from the keypoint sequence: Address → Takeaway → Backswing → Top → Downswing → Impact → Follow-through. Use wrist position/velocity: address = stable low hands, top = wrist velocity zero-crossing at max height, impact = max downward hand speed near lowest point, etc. Show detected phase markers on a scrub bar so I can see and manually nudge the phase boundaries if detection got one wrong (my corrections should feed back into detection thresholds).
4. Handedness: setting for right/left handed golfer; also auto-detect from which direction the hands travel and confirm with me.
5. Camera angle: support the two standard views — Face-On and Down-the-Line. Ask me (or auto-detect from shoulder landmark depth/width) which view the clip is, because the angle checks differ per view. Only run checks that are valid for that view.

## "Training" — calibration from my own good swings (be accurate and honest about this)

This is not retraining a neural network — the pose model stays fixed. What continuously improves is MY reference profile:

- Calibration mode: I record swings I'm happy with (or my coach approves) and mark them "reference". The app extracts the angle curves per phase and builds statistical bands (mean ± tolerance) for every metric, per camera view.
- Every new reference swing added updates the bands (running mean/std). The more good swings I feed it, the tighter and more personal the red/green thresholds get. Show me how many reference swings each profile is built on and a confidence note (e.g. "based on 3 swings — add more for reliability").
- Ship sensible default coaching ranges (from published golf biomechanics norms) so the app works on day one before I've calibrated, clearly labelled "Default ranges" vs "Your calibrated ranges". Let me choose per-metric which source to use, and let me manually edit any threshold.
- Multiple profiles: e.g. "Driver" and "Irons" as separate calibration sets, because the swings differ.
- Per-swing feedback loop: after an analysis I can mark it "this was actually a good swing" to promote it to reference, or flag a specific red segment as "false alarm" which widens that tolerance slightly. This is the constant-training loop.

## Playback + feedback UI

- Video player with the coloured skeleton overlay drawn on a canvas positioned over the video, scaled correctly for any video resolution/orientation. Segment colours: green = in range, red = out of range, amber = borderline (within 10% of the limit). Grey = not checkable from this camera view.
- Scrub bar with phase markers, frame-step buttons, 0.25x/0.5x/1x speed, and a loop-this-phase button.
- A "Faults" panel listing every out-of-range event: body part, phase, what happened, by how much (e.g. "Spine tilt lost 12° between Top and Impact — early extension"), tap to jump the video to that moment.
- Swing score per phase and overall (simple % of checks passed), and a history screen with a trend chart over time (draw with canvas, no chart library needed) so I can see if I'm improving.
- Compare mode: overlay the angle curves of this swing vs my reference bands as a small graph per metric.
- Export/import: full JSON backup of profiles, references, and history so I never lose data; PDF-free — plain JSON file download and a file picker to restore.

## Design

- Light, clean, modern. Colour scheme: light blue and green — soft off-white/very light blue background, light blue primary UI, green as the "good" colour, red reserved strictly for faults, amber for borderline. No dark theme. This matches my other apps.
- Big touch targets, one-handed use, bottom nav: Analyse / History / Calibrate / Settings.
- Clear plain-English copy everywhere — I'm a beginner golfer, so every fault message should say what it means and one line on how to fix it (include a small built-in dictionary of common faults: early extension, swaying, chicken wing, casting, over-the-top, loss of posture — mapped to the metrics that detect them).
- Empty states that tell me what to do first (e.g. "Record your first swing" / "Add 3 reference swings to calibrate").
- Fast: show a progress bar while processing frames; process at a capped resolution (e.g. 720p max internal) for speed, and never block the UI.

## Quality bar

- Must work fully offline after first load (model cached).
- Handle portrait and landscape videos, front and back camera, and videos where I'm not perfectly centred.
- Graceful failure: if pose confidence is too low (bad lighting, too far away), tell me exactly what to fix ("Stand closer, whole body in frame, good lighting") instead of giving junk analysis.
- No console errors, works in iOS Safari specifically (test assumptions against Safari quirks: no SharedArrayBuffer requirement, service worker limits, video autoplay needs muted+playsinline).
- Keep everything in the one HTML file. If the file gets huge that's fine — single file is the requirement so I can host it anywhere free (or open locally) and Add to Home Screen.

Build the entire thing now, complete and working — not a skeleton or a plan. Then give me a short list of what to test first on my phone.
