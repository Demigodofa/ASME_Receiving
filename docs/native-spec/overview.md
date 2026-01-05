# Native Migration Overview

Goal: rebuild the existing MaterialGuardian experience as a Kotlin-first, Android-native app while keeping at least ~70% parity for flows, wording, and validation. Use this spec as the reference before deleting web/Capacitor assets.

## High-level flows to preserve
- Launch → splash → home/landing with quick access tiles.
- Jobs list → job detail → materials/receiving items for that job.
- Create/edit job: job number (required), description, notes.
- Material/receiving item entry: form fields with length caps and option lists (see screens spec).
- Photo capture/upload and offload workflow (local first, cloud optional).
- Reports: receiving report, hydro report defaults, and PDF generation hook.
- Settings: activate cloud access (Firebase config), PDF endpoint, cloud mode toggle.
- Upload queue: monitor pending/failed/completed uploads with retry.

## Data and sync
- Firestore schema (cloud mode):
  - `jobs/{jobId}`
  - `items/{itemId}` with form fields, `photoCount`, `offloadStatus`, `pdfStatus`, `pdfStoragePath`
  - `items/{itemId}/photos/{photoId}` with `thumbStoragePath`, `fullStoragePath`, `status`
- Local model (web IndexedDB analog to rebuild natively):
  - `jobs` for job metadata
  - `materials` for form data and cloud state fields
  - `photos` for local blobs/cloud storage paths
  - `uploadQueue` for thumbnail/full/PDF uploads
- Cloud config: Firebase config JSON + PDF endpoint stored locally; cloud mode toggle gates sync work.

## UI rules to keep
- Receiving report limits: item description 175 chars (max 5 lines), vendor 30, quantity 20, spec numbers 20, markings 5 lines.
- Defaults: hydro report yes/accepted options default to positive; dimensions default to imperial.
- Photo labels: truncate item description to 12 chars, use numeric suffixes; MTR/CofC use `MTR_` prefix.
- Reports split photos into Materials (max 4) and MTR/CofC (max 8) buckets.

## Migration approach (small commits)
1) Capture/lock spec (this doc + screens/data breakdown).
2) Add native Android foundation (Navigation, ViewModel/Flow, WorkManager, CameraX, Firebase KTX) without removing web yet.
3) Recreate data layer in Kotlin (Firestore + local cache) behind interfaces.
4) Port screens one at a time; after each, delete the matching web/Capacitor assets.
5) Final cleanup: remove Capacitor/ios and leftover web assets once native parity exists.
