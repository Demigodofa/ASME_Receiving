# MaterialGuardian Android (Native Kotlin)

Native-only Android app for receiving inspection with optional cloud mode (Firestore/Storage) and offline-first flows. Capacitor/web assets have been removed; open the `android/` project directly in Android Studio.

## Quick start

1. Install Android Studio with SDK Platform 36 and Java 17.
2. Clone and open `android/` as the project root.
3. Optional (for Firebase): drop `android/app/google-services.json` in place; otherwise the app runs but cloud calls will fail.
4. Sync Gradle and run the `app` configuration on a device/emulator.

## Features (current)

- Home navigation into Jobs, Upload Queue placeholder, and Settings.
- Jobs list with Firestore-backed create/list; job detail view.
- Materials tied to a job with receiving-spec fields (description, vendor, quantity text, spec numbers, markings, offload/pdf status, photo count). Add via bottom sheet; detail view shows fields and lets you update offload status.
- Settings scaffold for Firebase config/PDF endpoint and cloud toggle (storage currently local only).
- Safe Args navigation, ViewModel + Flow for UI state, Firebase Firestore KTX, WorkManager dependency stubbed for future uploads.

## What’s not built yet

- CameraX/photo capture, thumbnails, and Storage uploads.
- WorkManager-backed upload queue and PDF generation/offload pipeline.
- Cloud mode toggle is not yet gating repository calls; Firestore is used directly.

## Dev notes

- Requires Java 17 (`org.gradle.java.home` set in `android/gradle.properties`).
- Safe Args Gradle plugin included; keep Navigation actions in sync.
- Data/spec references live in `docs/native-spec/`.

## Repository layout

- `android/`: Native app source and Gradle build.
- `docs/native-spec/`: Migration/spec guidance for screens, data, and flows.

