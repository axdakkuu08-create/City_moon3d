# The City That Forgot the Moon: 3D build plan
Resume rule: do the first step not marked DONE, then mark it DONE here.

- [x] Step 1: skeleton, selected Kenney assets copied to public/assets, manifest.json
- [x] Step 2 (DONE, verified in headless Chromium): Three.js scene: loader, moonlit sky, fog, ground, road grid + buildings + trees
- [x] Step 3 (DONE, tested): player (character-male-a/female-a), camera-relative movement from Godot controller (accel 6, speed 8, rotation 12), idle/walk/sprint/jump animations, third-person camera with collision
- [x] Step 4 (DONE, tested): touch controls (joystick + jump/interact buttons), keyboard, Android WebView friendly
- [x] Step 5 (DONE, tested): story layer: NPCs (Mira, Clockmaker, child), memory-object pickups, reuse story data from index.html, journal/clues HUD
- [x] Step 6 (DONE, tested): polish (red moon, lights, audio hooks), save/load, performance pass
- [x] Step 7 (DONE): single-file offline build + Android WebView wrapper notes

Notes
- Bundler (esbuild) is blocked in this sandbox; use native ES modules + importmap, three@0.170.0 vendored in public/vendor.
- Godot demo is a robot shooter: port movement feel only.
- All assets CC0 (Kenney).
- vendored: public/vendor/three.module.js + addons (GLTFLoader, SkeletonUtils); importmap maps 'three' and 'three/addons/'
- Run locally: cd public && python3 -m http.server 8123, open http://localhost:8123 (?cam=top for map view)
- Screenshot test: python3 -I tools/shot.py URL out.png
- GLBs need their own Textures/colormap.png per folder (each pack's texture differs).
- Code: public/src/{main,world,sky,loader}.js. World scale SC=6 units/tile; lots[] holds building circles for collision (used in Step 3).

## v0.2
- [x] Step 8 (DONE): merged static city meshes per 2x2-block chunk + material: 178 -> ~80 draw calls (tools/perf_test.py high|low)
- Also fixed short-landscape dialogue layout
- [x] Step 9 (DONE, tested): minimap top-right (roads, buildings, fragments, objective, player arrow) minimap (roads, player arrow, objective, fragments)
- [x] Step 10 (DONE): rebuild dist/city-moon-offline.html + android copy + zip, update this file and the Project copy

## v0.3 (look & life) - snapshot of v0.2 saved as releases/city-moon-3d-v2.zip
- [x] Step 11 (DONE, tested: 4 themes crimson|blue|dusk|dawn in src/themes.js, building tints, glowing windows, Theme button on title+menu): colour themes (sky/fog/light presets) + per-building tints via vertex colours + character outfit tints
- [x] Step 12 (DONE, tested: src/weather.js rain|mist|clear, lamp glow points, Weather button on title+menu): weather (rain, mist) + warm lamp glow + lit-window feel
- [x] Step 13 (DONE, tested: src/walkers.js, 7 townsfolk high / 3 low): ambient townsfolk walking along roads (other Kenney characters)
- [x] Step 14 (DONE, tested: Theme "Story (auto)" is default: ch1 crimson, ch2 blue, ch3 dusk, ch4 crimson, ch5 dusk; endings: restore dawn, silence blue, new dawn, compassion dusk): story-driven sky (moon pales in ch.5, ending colours) + theme picker in Menu/title, saved in prefs
- [x] Step 15 (DONE): rebuild dist, android copy, final zip (releases/city-moon-3d-v3.zip), update PLAN + Project copy
Checkpoint after every step: tools/checkpoint.sh stepN  (zip in /home/claude/releases/), then copy PLAN.md to Project doc claude/city-moon-3d-PLAN.md.

## STATUS: v0.3 (steps 1-15) done. Zips: releases/city-moon-3d-v2.zip (before look changes), city-moon-3d-v3.zip (latest). Next ideas (not started)
- Verify frame rate on a real phone (static merge already done; next: fewer PointLights, instanced orbs)
- Add more NPC wandering, side quests, voice/music files, minimap
- Replace procedural clock tower / train with custom models
- Tune TUNE in src/player.js (walk 6.5, run 11, jump 11)
## Build / run
- Dev: cd public && python3 -m http.server 8123
- Offline single file: python3 tools/build_single.py -> dist/city-moon-offline.html (needs bun + npm i three@0.170.0)
- Android: see android/README.md
- Tests: tools/theme_test.py theme:weather ..., tools/walker_test.py, tools/auto_test.py, tools/perf_test.py [high|low], tools/mini_test.py, tools/play_test2.py (playthrough), tools/file_test.py (file:// build)

## Ideas not started yet
- Side quests (return the lost child), flashbacks on fragments, real music/voice files, Hindi text, app icon + splash, gamepad support, instanced orbs / fewer PointLights if a phone is slow
