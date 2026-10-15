# Import the upgraded game and build the APK

The repository's current default branch contains the older prototype at the repository root; it does not yet contain the upgraded Three.js source tree (`public/` and `android/`). The APK workflow now packages the actual upgraded project instead of generating a separate placeholder game.

## Easiest method on Android

1. Download `city-moon-3d-project-upgraded.zip` from the ChatGPT response.
2. Open this repository on GitHub and choose **Add file → Upload files**.
3. Upload the ZIP to the repository root with this exact name: `city-moon-3d-project-upgraded.zip`.
4. Commit the upload to `main`.
5. Open **Actions → Build City Moon 3D APK** and wait for the run to finish.
6. Only use the APK if the workflow succeeds; download `city-moon-3d-debug-apk` from that run's Artifacts section.

The workflow extracts the ZIP in its temporary runner workspace and builds the Android project from its `android/` folder. It does not commit extracted files into the repository. If you prefer a normal source layout, upload the ZIP's `public/`, `android/`, `tools/test-source.mjs`, and `PLAN.md` contents to the repository root instead; the workflow detects that layout too.

## What the workflow verifies

- JavaScript syntax and required local assets
- touch interaction, save/restore, NPC, story, and offline asset smoke checks
- Android Gradle debug build
- APK file exists and is non-empty before artifact upload

A successful build is not the same as a real-device gameplay test.