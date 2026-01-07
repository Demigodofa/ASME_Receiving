# MaterialGuardian Android (Native Kotlin)

Native Android app for receiving inspection with offline-first workflows. Cloud export has been deferred; all data remains local on device for now.

## Quick start

1. Install Android Studio with SDK Platform 35+ and Java 17.
2. Open this repository as the project root.
3. Sync Gradle and run the `app` configuration on a device/emulator.

## Features (current)

- Jobs list with local create/delete; job detail view with export status.
- Receiving Inspection Report form with all specified fields, validation, and save confirmation.
- Materials stored locally via Room; per-job materials list with tap-to-edit.
- Camera capture for up to 4 material photos with thumbnails and retake/delete.
- Document scanning via ML Kit (fallback to camera capture) with up to 8 scans per material.
- Local job export to PDFs/images and copy to Downloads.

## Local storage & export

- All job/material data is stored locally on-device using Room.
- Export generates a job folder with receiving report PDFs, merged MTR scans, and photos.
- Export destination is app-private storage plus a copy under Downloads/MaterialGuardian.

## Future add-ons

- Cloud export is deferred; plans and notes live in `docs/future_add_ons/README.md`.
- Saved Firebase config lives at `docs/future_add_ons/google-services.json`.

## What's not built yet

- Cloud sync or shared storage workflows.
- User storage quota UX.
- Optional custom PDF templates.

## Dev notes

- Requires Java 17.
- Uses Compose Material3, CameraX, ML Kit Document Scanner, and PDFBox-Android.
- 16KB page-size devices: if you see a warning about unsupported 16KB page-size, update native deps (CameraX/ML Kit/PDFBox) or run on a 4KB-page device/emulator.
- Data/spec references live in `docs/native-spec/` (if present).

## Repository layout

- `app/`: Android app source and resources.
- `docs/`: Future add-on notes and archived cloud config.


