# Repository Guidelines

## Project Structure & Module Organization
MaterialGuardian is a single-module Android app.
- `app/`: main Android module.
  - `app/src/main/java/com/asme/receiving/`: Kotlin source (data layer, Room, export, and Compose UI).
  - `app/src/main/res/`: resources (themes, strings, launcher icons).
  - `app/src/main/assets/`: bundled PDFs/templates.
  - `app/src/test/`: JVM unit tests.
  - `app/src/androidTest/`: instrumented and Compose UI tests.
- `docs/`: product specs and future add-on notes.
- `assets/` and `www/`: static assets used for documentation and distribution.

## Build, Test, and Development Commands
Use the Gradle wrapper from the repo root:
- `./gradlew assembleDebug`: build a debug APK.
- `./gradlew installDebug`: install the debug build on a connected device.
- `./gradlew testDebugUnitTest`: run local JVM tests (JUnit/Robolectric).
- `./gradlew connectedDebugAndroidTest`: run instrumented tests on a device/emulator.
- `./gradlew lint`: run Android Lint checks.

Android Studio is the default workflow; Java 17 and Android SDK 35+ are required.

## Coding Style & Naming Conventions
- Kotlin source uses standard Android/Kotlin style: 4-space indentation, trailing commas where helpful, and clear Compose function naming.
- Classes/Composables: `PascalCase` (e.g., `JobDetailScreen`).
- Functions/vars: `camelCase`; constants: `UPPER_SNAKE_CASE`.
- Packages are lowercase (e.g., `com.asme.receiving.data.export`).

## Testing Guidelines
- Unit tests live under `app/src/test/` and use JUnit4 with Robolectric/AndroidX test utilities.
- Instrumented and UI tests live under `app/src/androidTest/` and use Compose test APIs.
- Name tests `*Test.kt` and keep UI tests focused on visible behavior (text, enabled/disabled states).

## Commit & Pull Request Guidelines
- Recent commits use short, imperative summaries (e.g., "Update dependencies and improve export compatibility"); follow that style unless a team convention is introduced.
- PRs should include: a brief summary, testing notes (commands and results), and screenshots/GIFs for UI changes. Link related issues when available.

## Configuration & Security Notes
- `local.properties` holds local SDK paths; do not commit machine-specific values.
- `docs/future_add_ons/google-services.json` is archival only; production configs should not be added without review.

## Recent Changes (Tooling Alignment)
- What changed: aligned AGP/Kotlin/KSP and Gradle wrapper for a stable toolchain, fixed theme resource API-25 override for lint, updated AndroidX test libs, and adjusted one instrumented test signature.
- Why: consistent versions eliminate KSP/Room compiler errors; API-25 override resolves lint NewApi; Android 16 emulator required newer test libs; test signature kept UI tests compiling.
- Next steps: commit changes, keep emulator/device handy for `./gradlew connectedDebugAndroidTest`, and review lint warnings in `app/build/reports/lint-results-debug.html` if you want cleanup.
