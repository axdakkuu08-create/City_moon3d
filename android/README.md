# Android wrapper (WebView)
1. Create an empty Android Studio project (Empty Views Activity, Kotlin, package `com.citymoon.game`, min SDK 24) or copy this folder in and add the usual root `settings.gradle.kts` / root `build.gradle.kts`.
2. Replace `MainActivity.kt`, `AndroidManifest.xml` and the module `build.gradle.kts` with the files here.
3. Copy the game into `app/src/main/assets/www/`:
   - Easiest (single file): `dist/city-moon-offline.html` -> `app/src/main/assets/www/index.html`
   - Or the multi-file version: copy everything inside `public/` into `app/src/main/assets/www/`
4. Build > Build APK. Fully offline; saves use WebView localStorage.
Tips: first run on a real device; "Graphics: Low" is the default on touch screens (no shadows, 1x pixel ratio).
