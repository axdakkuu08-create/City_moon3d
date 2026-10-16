# City Moon 3D — Startup Performance Plan

## Baseline checkpoint

Baseline preserved from `main` before optimization work.

Current source packaging:
- The v3 game is imported from `city-moon-3d-v3.zip` by `.github/workflows/build-apk.yml`.
- JavaScript is validated from `public/src/*.js` after extraction.
- The Android workflow currently builds a debug APK.
- The latest baseline commit before this optimization branch is `c9676564894c04d4fd921449068e1eda0fa44116`.

## Optimization checkpoints

### Checkpoint 1 — Inspect & protect
- [x] Create a dedicated optimization branch.
- [x] Record the baseline packaging/build behavior.
- [ ] Make no gameplay changes yet.
- [ ] Obtain editable v3 source files from the ZIP so the runtime can be optimized safely.

### Checkpoint 2 — Startup/UI responsiveness
- Show the title/loading UI before expensive world construction.
- Replace one long synchronous startup block with chunked work that yields to the browser/WebView.
- Make progress reflect completed work rather than appearing frozen.

### Checkpoint 3 — City construction
- Eliminate repeated full-model cloning where static geometry can be reused.
- Cache merged geometry/material variants instead of rebuilding vertex data per tile.
- Use instancing for suitable repeated static objects.
- Preserve the current 17×17 city layout unless a deliberate visual/gameplay reduction is approved.

### Checkpoint 4 — Character loading
- Replace strictly sequential character initialization with controlled concurrency.
- Avoid loading every character at once if memory/GC pressure increases.
- Keep low-quality device behavior conservative.

### Checkpoint 5 — First-frame rendering
- Review shader compilation timing.
- Consider `renderer.compileAsync(scene, camera)` during the loading phase where supported.
- Review the window-glow `onBeforeCompile` path for avoidable startup work.

### Checkpoint 6 — Packaging/build
- Keep debug APK generation available for testing.
- Evaluate release/minification only after runtime startup is improved.
- Avoid changes that make the offline WebView package less reliable.

### Checkpoint 7 — Verification
- Run JavaScript syntax/source tests.
- Build the APK.
- Confirm the APK is non-empty and packaged assets are present.
- Compare startup behavior against the baseline.

## Important correction

A 17×17 grid contains 289 tiles. Reducing it to 15×15 would produce 225 tiles, which is about a **22.1%** reduction, not 40%. No tile-count reduction is being applied automatically.
