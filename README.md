# The City That Forgot the Moon 🌙

An offline-friendly, third-person 3D exploration adventure for Android, using an original blocky, toy-like visual style inspired by sandbox adventure games.

![Game logo](assets/logo.svg)

## Chapter 1 — The Letter

Play as **Ari Vale**, a young courier with midnight-black block hair, a teal explorer jacket, coral scarf, dark trousers and boots, a navy satchel, and a glowing cyan lantern. Ari finds a mysterious letter on the night the moon vanishes.

### Clear controls
1. Tap **BEGIN EXPLORATION** to start.
2. Drag the round joystick at the bottom-left to walk.
3. Follow the floating cyan lights.
4. When a light is close, tap **INTERACT** to collect its memory.
5. Tap **JOURNAL** to review your clues.
6. Collect all three memories to finish Chapter 1.

### Chapter 1 stages — easy to hard
1. **The Quiet Street — Easy:** learn movement and find the first memory.
2. **The Forgotten House — Easy–Medium:** discover a clue about a hidden key.
3. **Strange Footprints — Medium:** follow the trail and recover another memory.
4. **Meet Mira — Hard:** uncover the final clue and complete the chapter.

## Android APK build
1. Open the [GitHub Actions page](https://github.com/axdakkuu08-create/City_moon3d/actions).
2. Open the newest **Build City Moon 3D APK** run.
3. Wait until the run says **Success**.
4. Open that run's **Artifacts** section.
5. Download **city-moon-3d-debug-apk** and extract the ZIP to get the APK.
6. Install it on your Android phone and test movement and interaction.

A new build starts automatically after a push to `main`. The game is still a prototype; the graphics and controls should be tested on a real device before treating it as a finished release.

## Project files
- `assets/logo.svg` — moonlit city logo
- `chapter-1.json` — stage order and clues
- `character.json` — Ari Vale character guide
- `.github/workflows/build-apk.yml` — generates the Android WebView project and APK
