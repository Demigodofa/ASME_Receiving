# Data model parity

## Firestore (cloud mode)
- Collection `jobs`: job metadata.
- Collection `items`: form fields per material, `photoCount`, `offloadStatus`, `pdfStatus`, `pdfStoragePath`.
- Subcollection `items/{itemId}/photos`: `thumbStoragePath`, `fullStoragePath`, `status`.

## Local (native replacement for IndexedDB)
- `jobs`: jobNumber (key), description, notes, createdAt, cloudJobId.
- `materials`: item form fields + cloud state (photoCount, offloadStatus, pdfStatus, pdfStoragePath).
- `photos`: local blobs/paths, thumb/full storage paths, status.
- `uploadQueue`: work items for thumbnail/full/pdf uploads with retry state.

## Models already ported to Kotlin
- `MaterialItem`: id, name, quantity, status, receivedAt, userId; Firestore hash map helper and mock factory.
- `MaterialRepository`: add material, real-time stream of materials (`Flow<List<MaterialItem>>`), update material status via `await()`.

## Native data layer to build next
- Job model + repository with cloud/local sync.
- Photo model + repository integrating CameraX/local cache + Firestore Storage.
- Upload queue manager using WorkManager for offline/deferrable uploads.
